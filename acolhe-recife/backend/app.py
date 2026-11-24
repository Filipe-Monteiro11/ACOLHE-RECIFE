
import os
import re
import secrets

from datetime import datetime, timezone
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

load_dotenv()

db = SQLAlchemy()


# Instituições demonstrativas do projeto acadêmico

INSTITUICOES_DEMO = [
    {
        "nome": "Centro Esperança",
        "bairro": "Boa Vista",
        "necessidades": [
            "Alimentos",
            "Roupas",
            "Produtos de higiene"
        ]
    },
    {
        "nome": "Casa de Apoio Solidário",
        "bairro": "Santo Amaro",
        "necessidades": [
            "Alimentos",
            "Produtos de higiene"
        ]
    },
    {
        "nome": "Instituto Novos Caminhos",
        "bairro": "Imbiribeira",
        "necessidades": [
            "Materiais escolares",
            "Roupas"
        ]
    },
    {
        "nome": "Rede Mãos Amigas",
        "bairro": "Cordeiro",
        "necessidades": [
            "Alimentos",
            "Roupas",
            "Produtos de higiene"
        ]
    },
    {
        "nome": "Espaço Recomeçar",
        "bairro": "Boa Viagem",
        "necessidades": [
            "Materiais escolares",
            "Produtos de higiene"
        ]
    },
    {
        "nome": "Projeto Viver Melhor",
        "bairro": "Casa Amarela",
        "necessidades": [
            "Alimentos",
            "Materiais escolares"
        ]
    }
]


# Modelos do banco de dados

class Instituicao(db.Model):
    __tablename__ = "doacao_instituicoes"

    id = db.Column(db.Integer, primary_key=True)

    nome = db.Column(
        db.String(150),
        nullable=False,
        unique=True
    )

    bairro = db.Column(
        db.String(100),
        nullable=False
    )

    ativa = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    necessidades = db.relationship(
        "Necessidade",
        backref="instituicao",
        cascade="all, delete-orphan",
        lazy="selectin"
    )


class Necessidade(db.Model):
    __tablename__ = "doacao_necessidades"

    id = db.Column(db.Integer, primary_key=True)

    instituicao_id = db.Column(
        db.Integer,
        db.ForeignKey("doacao_instituicoes.id"),
        nullable=False
    )

    categoria = db.Column(
        db.String(100),
        nullable=False
    )

    ativa = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    __table_args__ = (
        db.UniqueConstraint(
            "instituicao_id",
            "categoria",
            name="uq_instituicao_categoria"
        ),
    )


class Doacao(db.Model):
    __tablename__ = "doacoes"

    id = db.Column(db.Integer, primary_key=True)

    protocolo = db.Column(
        db.String(40),
        unique=True,
        nullable=False,
        index=True
    )

    token_consulta = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    instituicao_id = db.Column(
        db.Integer,
        db.ForeignKey("doacao_instituicoes.id"),
        nullable=False
    )

    nome_doador = db.Column(
        db.String(120),
        nullable=False
    )

    telefone = db.Column(
        db.String(11),
        nullable=False
    )

    categoria = db.Column(
        db.String(100),
        nullable=False
    )

    descricao = db.Column(
        db.String(1000),
        nullable=False
    )

    quantidade = db.Column(
        db.String(100),
        nullable=False
    )

    observacoes = db.Column(db.String(500))

    entrega = db.Column(
        db.String(20),
        nullable=False
    )

    endereco_coleta = db.Column(
        db.JSON,
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pendente"
    )

    criado_em = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    instituicao = db.relationship("Instituicao")


# Funções auxiliares

def texto(valor, limite):
    if not isinstance(valor, str):
        return ""

    return valor.strip()[:limite]


def somente_digitos(valor):
    return re.sub(r"\D", "", str(valor or ""))


def serializar_instituicao(instituicao):
    return {
        "id": instituicao.id,
        "nome": instituicao.nome,
        "bairro": instituicao.bairro,
        "necessidades": [
            necessidade.categoria
            for necessidade in instituicao.necessidades
            if necessidade.ativa
        ]
    }


def validar_doacao(dados):
    if not isinstance(dados, dict):
        return None, "Envie um objeto JSON válido."

    try:
        instituicao_id = int(dados.get("instituicao_id"))
    except (TypeError, ValueError):
        return None, "Instituição inválida."

    instituicao = db.session.get(
        Instituicao,
        instituicao_id
    )

    if not instituicao or not instituicao.ativa:
        return None, "Instituição não encontrada."

    nome = texto(dados.get("nome"), 120)
    telefone = somente_digitos(dados.get("telefone"))
    categoria = texto(dados.get("categoria"), 100)
    descricao = texto(dados.get("descricao"), 1000)
    quantidade = texto(dados.get("quantidade"), 100)
    observacoes = texto(dados.get("observacoes"), 500)
    entrega = dados.get("entrega")

    if not all([nome, categoria, descricao, quantidade]):
        return None, "Preencha os campos obrigatórios."

    if len(telefone) != 11:
        return None, "Informe um celular com DDD e 11 dígitos."

    categorias_aceitas = {
        necessidade.categoria
        for necessidade in instituicao.necessidades
        if necessidade.ativa
    }

    if categoria not in categorias_aceitas:
        return None, "A instituição não aceita esta categoria."

    if entrega not in ("direct", "pickup"):
        return None, "Forma de entrega inválida."

    endereco = None

    if entrega == "pickup":
        endereco_recebido = dados.get("endereco_coleta")

        if not isinstance(endereco_recebido, dict):
            return None, "Informe o endereço de coleta."

        endereco = {
            "cep": somente_digitos(
                endereco_recebido.get("cep")
            ),
            "bairro": texto(
                endereco_recebido.get("bairro"), 100
            ),
            "rua": texto(
                endereco_recebido.get("rua"), 150
            ),
            "numero": texto(
                endereco_recebido.get("numero"), 20
            ),
            "referencia": texto(
                endereco_recebido.get("referencia"), 150
            )
        }

        if (
            len(endereco["cep"]) != 8
            or not endereco["bairro"]
            or not endereco["rua"]
            or not endereco["numero"]
        ):
            return None, "Endereço de coleta incompleto."

    return {
        "instituicao_id": instituicao.id,
        "nome_doador": nome,
        "telefone": telefone,
        "categoria": categoria,
        "descricao": descricao,
        "quantidade": quantidade,
        "observacoes": observacoes,
        "entrega": entrega,
        "endereco_coleta": endereco
    }, None


# Configuração da aplicação

def criar_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL", "").strip()

    if not database_url:
        raise RuntimeError(
            "Configure a variável DATABASE_URL."
        )

    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql+psycopg://",
            1
        )

    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1
        )

    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY"),
        SQLALCHEMY_DATABASE_URI=database_url,
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        SQLALCHEMY_ENGINE_OPTIONS={
            "pool_pre_ping": True,
            "pool_recycle": 300
        },
        MAX_CONTENT_LENGTH=1024 * 1024
    )

    app.json.ensure_ascii = False

    db.init_app(app)

    origens = [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]

    origens.extend(
        origem.strip().rstrip("/")
        for origem in os.getenv(
            "FRONTEND_ORIGIN", ""
        ).split(",")
        if origem.strip()
    )

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": origens,
                "methods": ["GET", "POST", "OPTIONS"],
                "allow_headers": [
                    "Content-Type",
                    "X-Consulta-Token"
                ]
            }
        }
    )

    @app.after_request
    def configurar_headers(resposta):
        resposta.headers["X-Content-Type-Options"] = "nosniff"
        resposta.headers["X-Frame-Options"] = "DENY"
        resposta.headers["Referrer-Policy"] = "no-referrer"

        if request.path.startswith("/api/doacoes"):
            resposta.headers["Cache-Control"] = "no-store"

        return resposta

    # Página inicial da API

    @app.get("/")
    def inicio():
        return jsonify({
            "projeto": "ABRICIFE - Acolhe Recife",
            "status": "online",
            "versao": "1.0"
        })

    # Verificação da API e do banco

    @app.get("/api/health")
    def health():
        try:
            db.session.execute(sql_text("SELECT 1"))

            return jsonify({
                "status": "ok",
                "database": "connected"
            })

        except SQLAlchemyError:
            db.session.rollback()

            return jsonify({
                "status": "error",
                "database": "unavailable"
            }), 503

    # Listagem de instituições

    @app.get("/api/instituicoes")
    def listar_instituicoes():
        instituicoes = (
            Instituicao.query
            .filter_by(ativa=True)
            .order_by(Instituicao.nome)
            .all()
        )

        return jsonify([
            serializar_instituicao(item)
            for item in instituicoes
        ])

    # Registro de doações

    @app.post("/api/doacoes")
    def criar_doacao():
        dados = request.get_json(silent=True)

        validado, erro = validar_doacao(dados)

        if erro:
            return jsonify({"erro": erro}), 400

        protocolo = (
            "ABR-"
            + datetime.now(timezone.utc).strftime("%Y%m%d")
            + "-"
            + secrets.token_hex(5).upper()
        )

        token = secrets.token_urlsafe(32)

        doacao = Doacao(
            protocolo=protocolo,
            token_consulta=token,
            **validado
        )

        try:
            db.session.add(doacao)
            db.session.commit()

        except IntegrityError:
            db.session.rollback()

            return jsonify({
                "erro": "Não foi possível registrar a doação."
            }), 409

        return jsonify({
            "mensagem": "Solicitação registrada com sucesso.",
            "protocolo": doacao.protocolo,
            "token_consulta": token,
            "status": doacao.status
        }), 201

    # Consulta de doações

    @app.get("/api/doacoes/<protocolo>")
    def consultar_doacao(protocolo):
        token = request.headers.get(
            "X-Consulta-Token", ""
        )

        doacao = Doacao.query.filter_by(
            protocolo=protocolo
        ).first()

        if (
            not doacao
            or not token
            or not secrets.compare_digest(
                token.encode("utf-8"),
                doacao.token_consulta.encode("utf-8")
            )
        ):
            return jsonify({
                "erro": "Solicitação não encontrada."
            }), 404

        return jsonify({
            "protocolo": doacao.protocolo,
            "instituicao": doacao.instituicao.nome,
            "categoria": doacao.categoria,
            "status": doacao.status,
            "criado_em": doacao.criado_em.isoformat()
        })

    # Tratamento de erros

    @app.errorhandler(SQLAlchemyError)
    def erro_banco(erro):
        db.session.rollback()
        app.logger.exception("Erro no banco de dados.")

        return jsonify({
            "erro": "Banco de dados temporariamente indisponível."
        }), 503

    @app.errorhandler(413)
    def requisicao_grande(erro):
        return jsonify({
            "erro": "Os dados enviados excedem o limite permitido."
        }), 413

    @app.errorhandler(404)
    def rota_nao_encontrada(erro):
        return jsonify({
            "erro": "Rota não encontrada."
        }), 404

    @app.errorhandler(500)
    def erro_interno(erro):
        db.session.rollback()

        return jsonify({
            "erro": "Erro interno do servidor."
        }), 500

    return app


app = criar_app()


# Inicialização do banco de dados

@app.cli.command("init-db")
def inicializar_banco():
    db.create_all()

    if Instituicao.query.count() == 0:
        for item in INSTITUICOES_DEMO:
            instituicao = Instituicao(
                nome=item["nome"],
                bairro=item["bairro"]
            )

            for categoria in item["necessidades"]:
                instituicao.necessidades.append(
                    Necessidade(categoria=categoria)
                )

            db.session.add(instituicao)

        db.session.commit()

    print("Banco inicializado com sucesso.")


# Execução local

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5000")),
        debug=False
    )
