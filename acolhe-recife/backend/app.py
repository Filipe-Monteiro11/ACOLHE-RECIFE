import os
import re
import secrets
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError

load_dotenv()

db = SQLAlchemy()

INSTITUICOES_DEMO = [
    {
        "nome": "Centro Esperança",
        "bairro": "Boa Vista",
        "necessidades": [
            "Alimentos", "Roupas", "Produtos de higiene"
        ],
    },
    {
        "nome": "Casa de Apoio Solidário",
        "bairro": "Santo Amaro",
        "necessidades": [
            "Alimentos", "Produtos de higiene"
        ],
    },
    {
        "nome": "Instituto Novos Caminhos",
        "bairro": "Imbiribeira",
        "necessidades": [
            "Materiais escolares", "Roupas"
        ],
    },
    {
        "nome": "Rede Mãos Amigas",
        "bairro": "Cordeiro",
        "necessidades": [
            "Alimentos", "Roupas", "Produtos de higiene"
        ],
    },
    {
        "nome": "Espaço Recomeçar",
        "bairro": "Boa Viagem",
        "necessidades": [
            "Materiais escolares", "Produtos de higiene"
        ],
    },
    {
        "nome": "Projeto Viver Melhor",
        "bairro": "Casa Amarela",
        "necessidades": [
            "Alimentos", "Materiais escolares"
        ],
    },
]


class Instituicao(db.Model):
    __tablename__ = "doacao_instituicoes"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False, unique=True)
    bairro = db.Column(db.String(100), nullable=False)
    ativa = db.Column(db.Boolean, nullable=False, default=True)

    necessidades = db.relationship(
        "Necessidade",
        backref="instituicao",
        cascade="all, delete-orphan",
        lazy=True,
    )


class Necessidade(db.Model):
    __tablename__ = "doacao_necessidades"

    id = db.Column(db.Integer, primary_key=True)
    instituicao_id = db.Column(
        db.Integer,
        db.ForeignKey("doacao_instituicoes.id"),
        nullable=False,
    )
    categoria = db.Column(db.String(100), nullable=False)
    ativa = db.Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        db.UniqueConstraint(
            "instituicao_id",
            "categoria",
            name="uq_instituicao_categoria",
        ),
    )


class Doacao(db.Model):
    __tablename__ = "doacoes"

    id = db.Column(db.Integer, primary_key=True)
    protocolo = db.Column(
        db.String(40),
        unique=True,
        nullable=False,
        index=True,
    )
    token_consulta = db.Column(
        db.String(100),
        nullable=False,
        unique=True,
    )

    instituicao_id = db.Column(
        db.Integer,
        db.ForeignKey("doacao_instituicoes.id"),
        nullable=False,
    )

    nome_doador = db.Column(db.String(120), nullable=False)
    telefone = db.Column(db.String(11), nullable=False)
    categoria = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(1000), nullable=False)
    quantidade = db.Column(db.String(100), nullable=False)
    observacoes = db.Column(db.String(500))

    entrega = db.Column(db.String(20), nullable=False)
    endereco_coleta = db.Column(db.JSON, nullable=True)

    status = db.Column(
        db.String(30),
        nullable=False,
        default="pendente",
    )

    criado_em = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    instituicao = db.relationship("Instituicao")


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
        ],
    }


def validar_doacao(dados):
    if not isinstance(dados, dict):
        return None, "Envie um objeto JSON válido."

    try:
        instituicao_id = int(dados.get("instituicao_id"))
    except (TypeError, ValueError):
        return None, "Instituição inválida."

    instituicao = db.session.get(Instituicao, instituicao_id)

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
            "cep": somente_digitos(endereco_recebido.get("cep")),
            "bairro": texto(endereco_recebido.get("bairro"), 100),
            "rua": texto(endereco_recebido.get("rua"), 150),
            "numero": texto(endereco_recebido.get("numero"), 20),
            "referencia": texto(
                endereco_recebido.get("referencia"), 150
            ),
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
        "endereco_coleta": endereco,
    }, None


def criar_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL", "")

    if not database_url:
        raise RuntimeError("Configure DATABASE_URL no arquivo .env.")

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024

    db.init_app(app)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    os.getenv(
                        "FRONTEND_ORIGIN",
                        "http://127.0.0.1:5500",
                    )
                ]
            }
        },
    )

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/instituicoes")
    def listar_instituicoes():
        instituicoes = Instituicao.query.filter_by(
            ativa=True
        ).order_by(Instituicao.nome).all()

        return jsonify([
            serializar_instituicao(item)
            for item in instituicoes
        ])

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
            **validado,
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
            "status": doacao.status,
        }), 201

    @app.get("/api/doacoes/<protocolo>")
    def consultar_doacao(protocolo):
        token = request.headers.get("X-Consulta-Token", "")

        doacao = Doacao.query.filter_by(
            protocolo=protocolo,
        ).first()

        if (
            not doacao
            or not token
            or not secrets.compare_digest(
                token, doacao.token_consulta
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
            "criado_em": doacao.criado_em.isoformat(),
        })

    return app


app = criar_app()


@app.cli.command("init-db")
def inicializar_banco():
    with app.app_context():
        db.create_all()

        if Instituicao.query.count() == 0:
            for item in INSTITUICOES_DEMO:
                instituicao = Instituicao(
                    nome=item["nome"],
                    bairro=item["bairro"],
                )

                for categoria in item["necessidades"]:
                    instituicao.necessidades.append(
                        Necessidade(categoria=categoria)
                    )

                db.session.add(instituicao)

            db.session.commit()

        print("Banco inicializado com sucesso.")


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", "5000")),
        debug=False,
    )