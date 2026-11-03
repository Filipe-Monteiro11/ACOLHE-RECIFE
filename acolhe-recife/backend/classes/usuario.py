import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from classes.conexao import Conexao
from classes.seguranca import Seguranca


class Usuario:
    def __init__(self):
        self.db = Conexao()
        self.secret = os.getenv("SECRET_KEY")

        if not self.secret or len(self.secret) < 32:
            raise RuntimeError(
                "Configure uma SECRET_KEY segura no arquivo .env."
            )

    def login(self, email, senha, ip=None):
        if ip and Seguranca.verificar_bloqueio_ip(ip):
            return {
                "erro": "Muitas tentativas. Tente novamente em 5 minutos."
            }

        email = Seguranca.sanitizar_texto(email, 100).lower()

        if not Seguranca.validar_email(email):
            return {"erro": "Email inválido"}

        if not isinstance(senha, str) or not senha or len(senha) > 100:
            return {"erro": "Credenciais inválidas"}

        resultado = self.db.executar(
            """
            SELECT id, nome, email, senha, instituicao_id
            FROM usuarios
            WHERE email = :email AND ativo = TRUE
            """,
            {"email": email}
        )

        if not resultado:
            if ip:
                Seguranca.registrar_tentativa(ip, False)

            return {"erro": "Credenciais inválidas"}

        usuario = resultado[0]

        try:
            senha_valida = bcrypt.checkpw(
                senha.encode("utf-8"),
                usuario["senha"].encode("utf-8")
            )
        except (ValueError, TypeError):
            senha_valida = False

        if not senha_valida:
            if ip:
                Seguranca.registrar_tentativa(ip, False)

            return {"erro": "Credenciais inválidas"}

        if ip:
            Seguranca.registrar_tentativa(ip, True)

        agora = datetime.now(timezone.utc)

        token = jwt.encode(
            {
                "user_id": usuario["id"],
                "email": usuario["email"],
                "instituicao_id": usuario["instituicao_id"],
                "iat": agora,
                "exp": agora + timedelta(hours=24)
            },
            self.secret,
            algorithm="HS256"
        )

        return {
            "token": token,
            "usuario": {
                "id": usuario["id"],
                "nome": usuario["nome"],
                "email": usuario["email"],
                "instituicao_id": usuario["instituicao_id"]
            }
        }

    def criar(self, nome, email, senha, instituicao_id):
        nome = Seguranca.sanitizar_texto(nome, 100)
        email = Seguranca.sanitizar_texto(email, 100).lower()

        if not nome or len(nome) < 3:
            return {"erro": "Nome deve ter no mínimo 3 caracteres"}

        if not Seguranca.validar_email(email):
            return {"erro": "Email inválido"}

        senha_ok, senha_msg = Seguranca.validar_senha(senha)

        if not senha_ok:
            return {"erro": senha_msg}

        if (
            type(instituicao_id) is not int
            or instituicao_id <= 0
        ):
            return {"erro": "Instituição inválida"}

        existe = self.db.executar(
            "SELECT id FROM usuarios WHERE email = :email",
            {"email": email}
        )

        if existe:
            return {"erro": "Email já cadastrado"}

        instituicao = self.db.executar(
            "SELECT id FROM instituicoes WHERE id = :id",
            {"id": instituicao_id}
        )

        if not instituicao:
            return {"erro": "Instituição não encontrada"}

        senha_hash = bcrypt.hashpw(
            senha.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        resultado = self.db.executar(
            """
            INSERT INTO usuarios (
                nome, email, senha, instituicao_id
            )
            VALUES (
                :nome, :email, :senha, :instituicao_id
            )
            RETURNING id
            """,
            {
                "nome": nome,
                "email": email,
                "senha": senha_hash,
                "instituicao_id": instituicao_id
            }
        )

        if not resultado:
            return {"erro": "Erro ao criar usuário"}

        return {
            "sucesso": True,
            "id": resultado[0]["id"]
        }

    def verificar_token(self, token):
        try:
            return jwt.decode(
                token,
                self.secret,
                algorithms=["HS256"]
            )

        except jwt.ExpiredSignatureError:
            return {"erro": "Token expirado"}

        except jwt.InvalidTokenError:
            return {"erro": "Token inválido"}