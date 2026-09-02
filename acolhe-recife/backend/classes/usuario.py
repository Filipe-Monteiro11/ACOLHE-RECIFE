import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from classes.conexao import Conexao
from classes.seguranca import Seguranca

class Usuario:
    def __init__(self):
        self.db = Conexao()
        self.secret = os.getenv('SECRET_KEY', 'acolhe_recife_secret_2026')

    def login(self, email, senha, ip=None):
        # Verifica bloqueio por IP (brute force)
        if ip and Seguranca.verificar_bloqueio_ip(ip):
            return {"erro": "Muitas tentativas. Tente novamente em 5 minutos."}

        # Sanitiza e valida email
        email = Seguranca.sanitizar_texto(email, 100)
        if not Seguranca.validar_email(email):
            return {"erro": "Email inválido"}

        if not senha or len(senha) > 100:
            return {"erro": "Credenciais inválidas"}

        resultado = self.db.executar(
            "SELECT id, nome, email, senha, instituicao_id FROM usuarios WHERE email = %s AND ativo = TRUE",
            (email,)
        )

        if not resultado:
            if ip:
                Seguranca.registrar_tentativa(ip, False)
            return {"erro": "Credenciais inválidas"}

        user = resultado[0]
        if not bcrypt.checkpw(senha.encode('utf-8'), user['senha'].encode('utf-8')):
            if ip:
                Seguranca.registrar_tentativa(ip, False)
            return {"erro": "Credenciais inválidas"}

        # Login bem-sucedido — remove tentativas
        if ip:
            Seguranca.registrar_tentativa(ip, True)

        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'instituicao_id': user['instituicao_id'],
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
        # Sanitiza entradas
        nome = Seguranca.sanitizar_texto(nome, 100)
        email = Seguranca.sanitizar_texto(email, 100)

        # Validações
        if not nome or len(nome) < 3:
            return {"erro": "Nome deve ter no mínimo 3 caracteres"}
        if not Seguranca.validar_email(email):
            return {"erro": "Email inválido"}
        senha_ok, senha_msg = Seguranca.validar_senha(senha)
        if not senha_ok:
            return {"erro": senha_msg}
        if not instituicao_id or not isinstance(instituicao_id, int):
            return {"erro": "Instituição inválida"}

        # Verifica se email já existe
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