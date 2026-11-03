import os
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException

from classes.usuario import Usuario
from classes.instituicao import Instituicao

load_dotenv()

app = Flask(__name__)

app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024
app.config["JSON_SORT_KEYS"] = False

ambiente = os.getenv("FLASK_DEBUG", "false").lower() == "true"

Talisman(
    app,
    force_https=False,
    strict_transport_security=False,
    content_security_policy=None,
    referrer_policy="strict-origin-when-cross-origin"
)

origens = [
    origem.strip()
    for origem in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5500,http://localhost:5500,"
        "http://127.0.0.1:3000,http://localhost:3000"
    ).split(",")
    if origem.strip()
]

CORS(
    app,
    resources={
        r"/*": {
            "origins": origens,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "max_age": 3600
        }
    }
)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=["200 per hour", "50 per minute"],
    storage_uri="memory://"
)

usuario_model = Usuario()
instituicao_model = Instituicao()


# AUTENTICAÇÃO

def autenticar(funcao):
    @wraps(funcao)
    def wrapper(*args, **kwargs):
        autorizacao = request.headers.get("Authorization", "")
        partes = autorizacao.split()

        if len(partes) != 2 or partes[0].lower() != "bearer":
            return jsonify({"erro": "Token não fornecido"}), 401

        verificacao = usuario_model.verificar_token(partes[1])

        if "erro" in verificacao:
            return jsonify(verificacao), 401

        usuario_id = verificacao.get("user_id")
        instituicao_id = verificacao.get("instituicao_id")

        if (
            type(usuario_id) is not int
            or type(instituicao_id) is not int
        ):
            return jsonify({"erro": "Token inválido"}), 401

        usuarios = usuario_model.db.executar(
            """
            SELECT id, instituicao_id
            FROM usuarios
            WHERE id = :id AND ativo = TRUE
            """,
            {"id": usuario_id}
        )

        if not usuarios:
            return jsonify({"erro": "Usuário não autorizado"}), 401

        usuario = usuarios[0]

        if usuario["instituicao_id"] != instituicao_id:
            return jsonify({"erro": "Token inválido"}), 401

        g.usuario = usuario

        return funcao(*args, **kwargs)

    return wrapper


def verificar_instituicao(funcao):
    @wraps(funcao)
    @autenticar
    def wrapper(id, *args, **kwargs):
        if g.usuario["instituicao_id"] != id:
            return jsonify({
                "erro": "Você não tem permissão para esta instituição"
            }), 403

        if not instituicao_model.buscar_por_id(id):
            return jsonify({"erro": "Instituição não encontrada"}), 404

        return funcao(id, *args, **kwargs)

    return wrapper


def obter_json():
    if not request.is_json:
        return None

    dados = request.get_json(silent=True)

    return dados if isinstance(dados, dict) else None


def responder(resultado, sucesso=200):
    if "erro" in resultado:
        mensagem = resultado["erro"]

        if mensagem in (
            "Instituição não encontrada",
            "Usuário não encontrado"
        ):
            return jsonify(resultado), 404

        return jsonify(resultado), 400

    return jsonify(resultado), sucesso


# LOGIN

@app.post("/login")
@limiter.limit("5 per minute")
def login():
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    resultado = usuario_model.login(
        dados.get("email"),
        dados.get("senha"),
        get_remote_address()
    )

    if "erro" in resultado:
        return jsonify(resultado), 401

    return jsonify(resultado), 200


# USUÁRIOS

@app.post("/usuarios")
@limiter.limit("10 per hour")
@autenticar
def criar_usuario():
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    instituicao_id = g.usuario["instituicao_id"]

    resultado = usuario_model.criar(
        dados.get("nome"),
        dados.get("email"),
        dados.get("senha"),
        instituicao_id
    )

    return responder(resultado, 201)


# INSTITUIÇÕES

@app.get("/instituicoes")
def listar_instituicoes():
    return jsonify(instituicao_model.listar_todas())


@app.get("/instituicoes/<int:id>")
def buscar_instituicao(id):
    resultado = instituicao_model.buscar_por_id(id)

    if not resultado:
        return jsonify({"erro": "Instituição não encontrada"}), 404

    return jsonify(resultado)


@app.post("/instituicoes")
@limiter.limit("20 per hour")
@autenticar
def criar_instituicao():
    return jsonify({
        "erro": (
            "Cadastro de instituições indisponível nesta rota. "
            "É necessária autorização administrativa."
        )
    }), 403


@app.put("/instituicoes/<int:id>")
@limiter.limit("20 per hour")
@verificar_instituicao
def atualizar_instituicao(id):
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    resultado = instituicao_model.atualizar(
        id,
        dados.get("nome"),
        dados.get("descricao"),
        dados.get("endereco"),
        dados.get("latitude"),
        dados.get("longitude"),
        dados.get("telefone"),
        dados.get("email"),
        dados.get("como_ajudar")
    )

    return responder(resultado)


@app.delete("/instituicoes/<int:id>")
@limiter.limit("10 per hour")
@verificar_instituicao
def deletar_instituicao(id):
    resultado = instituicao_model.deletar(id)
    return responder(resultado)


# SERVIÇOS

@app.get("/instituicoes/<int:id>/servicos")
def listar_servicos(id):
    if not instituicao_model.buscar_por_id(id):
        return jsonify({"erro": "Instituição não encontrada"}), 404

    return jsonify(instituicao_model.listar_servicos(id))


@app.post("/instituicoes/<int:id>/servicos")
@limiter.limit("30 per hour")
@verificar_instituicao
def adicionar_servico(id):
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    resultado = instituicao_model.adicionar_servico(
        id,
        dados.get("tipo"),
        dados.get("descricao")
    )

    return responder(resultado, 201)


# NECESSIDADES

@app.get("/instituicoes/<int:id>/necessidades")
def listar_necessidades(id):
    if not instituicao_model.buscar_por_id(id):
        return jsonify({"erro": "Instituição não encontrada"}), 404

    return jsonify(instituicao_model.listar_necessidades(id))


@app.post("/instituicoes/<int:id>/necessidades")
@limiter.limit("30 per hour")
@verificar_instituicao
def adicionar_necessidade(id):
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    resultado = instituicao_model.adicionar_necessidade(
        id,
        dados.get("item"),
        dados.get("descricao"),
        dados.get("urgencia", "media")
    )

    return responder(resultado, 201)


# HORÁRIOS

@app.get("/instituicoes/<int:id>/horarios")
def listar_horarios(id):
    if not instituicao_model.buscar_por_id(id):
        return jsonify({"erro": "Instituição não encontrada"}), 404

    horarios = instituicao_model.listar_horarios(id)

    for horario in horarios:
        for campo in ("horario_abertura", "horario_fechamento"):
            valor = horario.get(campo)

            if hasattr(valor, "strftime"):
                horario[campo] = valor.strftime("%H:%M")

    return jsonify(horarios)


@app.post("/instituicoes/<int:id>/horarios")
@limiter.limit("30 per hour")
@verificar_instituicao
def adicionar_horario(id):
    dados = obter_json()

    if dados is None:
        return jsonify({"erro": "Envie um JSON válido"}), 400

    resultado = instituicao_model.adicionar_horario(
        id,
        dados.get("dia_semana"),
        dados.get("abertura"),
        dados.get("fechamento")
    )

    return responder(resultado, 201)


# TRATAMENTO DE ERROS

@app.errorhandler(HTTPException)
def tratar_erro_http(erro):
    mensagens = {
        400: "Requisição inválida",
        404: "Recurso não encontrado",
        405: "Método não permitido",
        413: "Dados enviados são muito grandes (máx. 1 MB)",
        429: "Muitas requisições. Aguarde alguns minutos"
    }

    mensagem = mensagens.get(erro.code, erro.description)

    return jsonify({"erro": mensagem}), erro.code


@app.errorhandler(IntegrityError)
def tratar_integridade(erro):
    app.logger.warning("Violação de integridade no banco de dados")

    return jsonify({
        "erro": "Não foi possível concluir a operação devido a um conflito de dados"
    }), 409


@app.errorhandler(SQLAlchemyError)
def tratar_banco(erro):
    app.logger.exception("Erro de banco de dados")

    return jsonify({
        "erro": "Erro ao acessar o banco de dados"
    }), 500


@app.errorhandler(Exception)
def tratar_erro(erro):
    app.logger.exception("Erro interno")

    return jsonify({"erro": "Erro interno do servidor"}), 500


# INICIAR SERVIDOR

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=ambiente
    )