import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from classes.conexao import Conexao

class Usuario:
    def __init__(self):
        self.db = Conexao()
        self.secret = os.getenv('SECRET_KEY')

    def login(self, email, senha):
        resultado = self.db.executar(
            "SELECT id, nome, email, senha, instituicao_id FROM usuarios WHERE email = %s AND ativo = TRUE",
            (email,)
        )
        if not resultado:
            return {"erro": "Usuário não encontrado"}

        user = resultado[0]
        if not bcrypt.checkpw(senha.encode('utf-8'), user['senha'].encode('utf-8')):
            return {"erro": "Senha incorreta"}

        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, self.secret, algorithm='HS256')

        return {
            "token": token,
            "usuario": {
                "id": user['id'],
                "nome": user['nome'],
                "email": user['email'],
                "instituicao_id": user['instituicao_id']
            }
        }

    def criar(self, nome, email, senha, instituicao_id):
        existe = self.db.executar("SELECT id FROM usuarios WHERE email = %s", (email,))
        if existe:
            return {"erro": "Email já cadastrado"}

        senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        resultado = self.db.executar(
            "INSERT INTO usuarios (nome, email, senha, instituicao_id) VALUES (%s, %s, %s, %s) RETURNING id",
            (nome, email, senha_hash, instituicao_id)
        )

        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao criar usuário"}

    def verificar_token(self, token):
        try:
            dados = jwt.decode(token, self.secret, algorithms=['HS256'])
            return dados
        except jwt.ExpiredSignatureError:
            return {"erro": "Token expirado"}
        except jwt.InvalidTokenError:
            return {"erro": "Token inválido"}