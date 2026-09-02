from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from classes.usuario import Usuario
from classes.instituicao import Instituicao

app = Flask(__name__)

# ============================
# SEGURANÇA — Headers HTTP
# ============================
Talisman(app,
    force_https=False,  # False em desenvolvimento, True em produção
    strict_transport_security=True,
    content_security_policy=None,
    referrer_policy='strict-origin-when-cross-origin'
)

# ============================
# CORS — Restrito a domínios autorizados
# ============================
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://127.0.0.1:3000",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "max_age": 3600
    }
})

# ============================
# RATE LIMITING — Proteção contra brute force e spam
# ============================
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per hour", "50 per minute"],
    storage_uri="memory://"
)

# ============================
# Limite de tamanho de request (proteção contra payload gigante)
# ============================
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024  # 1 MB máximo

usuario_model = Usuario()
instituicao_model = Instituicao()

# ============================
# AUTENTICAÇÃO
# ============================

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Máx 5 tentativas de login por minuto
def login():
    dados = request.json or {}
    ip = get_remote_address()
    resultado = usuario_model.login(dados.get('email'), dados.get('senha'), ip)
    if 'erro' in resultado:
        return jsonify(resultado), 401
    return jsonify(resultado)

@app.route('/setup', methods=['POST'])
@limiter.limit("3 per hour")  # Setup só 3x por hora
def criar_admin():
    dados = request.json or {}
    resultado = usuario_model.criar(
        dados.get('nome'),
        dados.get('email'),
        dados.get('senha'),
        dados.get('instituicao_id', 1)
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

@app.route('/usuarios', methods=['POST'])
@limiter.limit("10 per hour")
def criar_usuario():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = usuario_model.criar(
        dados.get('nome'),
        dados.get('email'),
        dados.get('senha'),
        dados.get('instituicao_id')
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

# ============================
# INSTITUIÇÕES
# ============================

@app.route('/instituicoes', methods=['GET'])
def listar_instituicoes():
    resultado = instituicao_model.listar_todas()
    return jsonify(resultado)

@app.route('/instituicoes/<int:id>', methods=['GET'])
def buscar_instituicao(id):
    resultado = instituicao_model.buscar_por_id(id)
    if not resultado:
        return jsonify({"erro": "Instituição não encontrada"}), 404
    return jsonify(resultado)

@app.route('/instituicoes', methods=['POST'])
@limiter.limit("20 per hour")
def criar_instituicao():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = instituicao_model.criar(
        dados.get('nome'),
        dados.get('descricao'),
        dados.get('endereco'),
        dados.get('latitude'),
        dados.get('longitude'),
        dados.get('telefone'),
        dados.get('email'),
        dados.get('como_ajudar')
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

@app.route('/instituicoes/<int:id>', methods=['PUT'])
@limiter.limit("20 per hour")
def atualizar_instituicao(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = instituicao_model.atualizar(
        id,
        dados.get('nome'),
        dados.get('descricao'),
        dados.get('endereco'),
        dados.get('latitude'),
        dados.get('longitude'),
        dados.get('telefone'),
        dados.get('email'),
        dados.get('como_ajudar')
    )
    return jsonify(resultado)

@app.route('/instituicoes/<int:id>', methods=['DELETE'])
@limiter.limit("10 per hour")
def deletar_instituicao(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    resultado = instituicao_model.deletar(id)
    return jsonify(resultado)

# ============================
# SERVIÇOS
# ============================

@app.route('/instituicoes/<int:id>/servicos', methods=['GET'])
def listar_servicos(id):
    resultado = instituicao_model.listar_servicos(id)
    return jsonify(resultado)

@app.route('/instituicoes/<int:id>/servicos', methods=['POST'])
@limiter.limit("30 per hour")
def adicionar_servico(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = instituicao_model.adicionar_servico(
        id,
        dados.get('tipo'),
        dados.get('descricao')
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

# ============================
# NECESSIDADES
# ============================

@app.route('/instituicoes/<int:id>/necessidades', methods=['GET'])
def listar_necessidades(id):
    resultado = instituicao_model.listar_necessidades(id)
    return jsonify(resultado)

@app.route('/instituicoes/<int:id>/necessidades', methods=['POST'])
@limiter.limit("30 per hour")
def adicionar_necessidade(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = instituicao_model.adicionar_necessidade(
        id,
        dados.get('item'),
        dados.get('descricao'),
        dados.get('urgencia', 'media')
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

# ============================
# HORÁRIOS
# ============================

@app.route('/instituicoes/<int:id>/horarios', methods=['GET'])
def listar_horarios(id):
    resultado = instituicao_model.listar_horarios(id)
    return jsonify(resultado)

@app.route('/instituicoes/<int:id>/horarios', methods=['POST'])
@limiter.limit("30 per hour")
def adicionar_horario(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json or {}
    resultado = instituicao_model.adicionar_horario(
        id,
        dados.get('dia_semana'),
        dados.get('abertura'),
        dados.get('fechamento')
    )
    if 'erro' in resultado:
        return jsonify(resultado), 400
    return jsonify(resultado), 201

# ============================
# TRATAMENTO DE ERROS
# ============================

@app.errorhandler(400)
def erro_400(e):
    return jsonify({"erro": "Requisição inválida"}), 400

@app.errorhandler(401)
def erro_401(e):
    return jsonify({"erro": "Não autorizado"}), 401

@app.errorhandler(404)
def erro_404(e):
    return jsonify({"erro": "Recurso não encontrado"}), 404

@app.errorhandler(413)
def erro_413(e):
    return jsonify({"erro": "Dados enviados são muito grandes (máx 1MB)"}), 413

@app.errorhandler(429)
def erro_429(e):
    return jsonify({"erro": "Muitas requisições. Aguarde alguns minutos."}), 429

@app.errorhandler(500)
def erro_500(e):
    return jsonify({"erro": "Erro interno do servidor"}), 500

# ============================
# INICIAR SERVIDOR
# ============================

if __name__ == '__main__':
    app.run(debug=True, port=5000)