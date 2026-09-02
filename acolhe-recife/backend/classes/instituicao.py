from classes.conexao import Conexao
from classes.seguranca import Seguranca

class Instituicao:
    def __init__(self):
        self.db = Conexao()

    # ============================
    # INSTITUIÇÕES
    # ============================

    def listar_todas(self):
        resultado = self.db.executar("""
            SELECT id, nome, descricao, endereco, latitude, longitude,
                   telefone, email, como_ajudar
            FROM instituicoes
            ORDER BY nome
        """)
        return resultado if resultado else []

    def buscar_por_id(self, id):
        if not isinstance(id, int) or id <= 0:
            return None
        resultado = self.db.executar("""
            SELECT id, nome, descricao, endereco, latitude, longitude,
                   telefone, email, como_ajudar
            FROM instituicoes WHERE id = %s
        """, (id,))
        return resultado[0] if resultado else None

    def criar(self, nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar):
        # Sanitiza todas as entradas de texto
        nome = Seguranca.sanitizar_texto(nome, 150)
        descricao = Seguranca.sanitizar_texto(descricao, 2000)
        endereco = Seguranca.sanitizar_texto(endereco, 255)
        telefone = Seguranca.sanitizar_texto(telefone, 20)
        email = Seguranca.sanitizar_texto(email, 100)
        como_ajudar = Seguranca.sanitizar_texto(como_ajudar, 2000)

        # Validações obrigatórias
        if not nome or len(nome) < 3:
            return {"erro": "Nome deve ter no mínimo 3 caracteres"}
        if not endereco:
            return {"erro": "Endereço é obrigatório"}

        # Valida coordenadas
        coord_ok, coord_msg = Seguranca.validar_coordenada(latitude, longitude)
        if not coord_ok:
            return {"erro": coord_msg}

        # Valida email se fornecido
        if email and not Seguranca.validar_email(email):
            return {"erro": "Email inválido"}

        # Valida telefone se fornecido
        if telefone and not Seguranca.validar_telefone(telefone):
            return {"erro": "Telefone inválido"}

        resultado = self.db.executar("""
            INSERT INTO instituicoes (nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (nome, descricao, endereco, float(latitude), float(longitude), telefone, email, como_ajudar))

        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao criar instituição"}

    def atualizar(self, id, nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar):
        if not isinstance(id, int) or id <= 0:
            return {"erro": "ID inválido"}

        # Sanitiza
        nome = Seguranca.sanitizar_texto(nome, 150)
        descricao = Seguranca.sanitizar_texto(descricao, 2000)
        endereco = Seguranca.sanitizar_texto(endereco, 255)
        telefone = Seguranca.sanitizar_texto(telefone, 20)
        email = Seguranca.sanitizar_texto(email, 100)
        como_ajudar = Seguranca.sanitizar_texto(como_ajudar, 2000)

        if not nome or len(nome) < 3:
            return {"erro": "Nome deve ter no mínimo 3 caracteres"}

        coord_ok, coord_msg = Seguranca.validar_coordenada(latitude, longitude)
        if not coord_ok:
            return {"erro": coord_msg}

        self.db.executar("""
            UPDATE instituicoes
            SET nome = %s, descricao = %s, endereco = %s, latitude = %s, longitude = %s,
                telefone = %s, email = %s, como_ajudar = %s, ultima_atualizacao = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (nome, descricao, endereco, float(latitude), float(longitude), telefone, email, como_ajudar, id))
        return {"sucesso": True}

    def deletar(self, id):
        if not isinstance(id, int) or id <= 0:
            return {"erro": "ID inválido"}
        self.db.executar("DELETE FROM instituicoes WHERE id = %s", (id,))
        return {"sucesso": True}

    # ============================
    # SERVIÇOS
    # ============================

    def listar_servicos(self, instituicao_id):
        if not isinstance(instituicao_id, int) or instituicao_id <= 0:
            return []
        resultado = self.db.executar(
            "SELECT id, tipo, descricao FROM servicos WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_servico(self, instituicao_id, tipo, descricao):
        tipo = Seguranca.sanitizar_texto(tipo, 50)
        descricao = Seguranca.sanitizar_texto(descricao, 500)

        if not tipo:
            return {"erro": "Tipo de serviço é obrigatório"}

        resultado = self.db.executar(
            "INSERT INTO servicos (instituicao_id, tipo, descricao) VALUES (%s, %s, %s) RETURNING id",
            (instituicao_id, tipo, descricao)
        )
        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao adicionar serviço"}

    # ============================
    # NECESSIDADES
    # ============================

    def listar_necessidades(self, instituicao_id):
        if not isinstance(instituicao_id, int) or instituicao_id <= 0:
            return []
        resultado = self.db.executar(
            "SELECT id, item, descricao, urgencia FROM necessidades WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_necessidade(self, instituicao_id, item, descricao, urgencia):
        item = Seguranca.sanitizar_texto(item, 100)
        descricao = Seguranca.sanitizar_texto(descricao, 500)

        if not item:
            return {"erro": "Item é obrigatório"}

        # Valida urgencia
        if urgencia not in ('baixa', 'media', 'alta'):
            urgencia = 'media'

        resultado = self.db.executar(
            "INSERT INTO necessidades (instituicao_id, item, descricao, urgencia) VALUES (%s, %s, %s, %s) RETURNING id",
            (instituicao_id, item, descricao, urgencia)
        )
        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao adicionar necessidade"}

    # ============================
    # HORÁRIOS
    # ============================

    def listar_horarios(self, instituicao_id):
        if not isinstance(instituicao_id, int) or instituicao_id <= 0:
            return []
        resultado = self.db.executar(
            "SELECT id, dia_semana, horario_abertura, horario_fechamento FROM horarios WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_horario(self, instituicao_id, dia_semana, abertura, fechamento):
        dias_validos = ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')
        if dia_semana not in dias_validos:
            return {"erro": "Dia da semana inválido"}

        resultado = self.db.executar(
            "INSERT INTO horarios (instituicao_id, dia_semana, horario_abertura, horario_fechamento) VALUES (%s, %s, %s, %s) RETURNING id",
            (instituicao_id, dia_semana, abertura, fechamento)
        )
        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao adicionar horário"}