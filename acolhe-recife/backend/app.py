from flask import Flask, request, jsonify
from flask_cors import CORS
from classes.usuario import Usuario
from classes.instituicao import Instituicao

app = Flask(__name__)
CORS(app)

usuario_model = Usuario()
instituicao_model = Instituicao()

# ============================
# AUTENTICAÇÃO
# ============================

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    resultado = usuario_model.login(dados.get('email'), dados.get('senha'))
    if 'erro' in resultado:
        return jsonify(resultado), 401
    return jsonify(resultado)

# Rota temporária pra criar o primeiro admin
# Depois de criar, remova ou comente esta rota
@app.route('/setup', methods=['POST'])
def criar_admin():
    dados = request.json
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
def criar_usuario():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
def criar_instituicao():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
def atualizar_instituicao(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
def adicionar_servico(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
def adicionar_necessidade(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
def adicionar_horario(id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({"erro": "Token não fornecido"}), 401
    token = token.replace('Bearer ', '')
    verificacao = usuario_model.verificar_token(token)
    if 'erro' in verificacao:
        return jsonify(verificacao), 401

    dados = request.json
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
# INICIAR SERVIDOR
# ============================

if __name__ == '__main__':
    app.run(debug=True, port=5000)