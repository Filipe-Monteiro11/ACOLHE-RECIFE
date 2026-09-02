from classes.conexao import Conexao

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
        resultado = self.db.executar("""
            SELECT id, nome, descricao, endereco, latitude, longitude,
                   telefone, email, como_ajudar
            FROM instituicoes WHERE id = %s
        """, (id,))
        return resultado[0] if resultado else None

    def criar(self, nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar):
        resultado = self.db.executar("""
            INSERT INTO instituicoes (nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar))

        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao criar instituição"}

    def atualizar(self, id, nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar):
        self.db.executar("""
            UPDATE instituicoes
            SET nome = %s, descricao = %s, endereco = %s, latitude = %s, longitude = %s,
                telefone = %s, email = %s, como_ajudar = %s, ultima_atualizacao = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar, id))
        return {"sucesso": True}

    def deletar(self, id):
        self.db.executar("DELETE FROM instituicoes WHERE id = %s", (id,))
        return {"sucesso": True}

    # ============================
    # SERVIÇOS
    # ============================

    def listar_servicos(self, instituicao_id):
        resultado = self.db.executar(
            "SELECT id, tipo, descricao FROM servicos WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_servico(self, instituicao_id, tipo, descricao):
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
        resultado = self.db.executar(
            "SELECT id, item, descricao, urgencia FROM necessidades WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_necessidade(self, instituicao_id, item, descricao, urgencia):
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
        resultado = self.db.executar(
            "SELECT id, dia_semana, horario_abertura, horario_fechamento FROM horarios WHERE instituicao_id = %s",
            (instituicao_id,)
        )
        return resultado if resultado else []

    def adicionar_horario(self, instituicao_id, dia_semana, abertura, fechamento):
        resultado = self.db.executar(
            "INSERT INTO horarios (instituicao_id, dia_semana, horario_abertura, horario_fechamento) VALUES (%s, %s, %s, %s) RETURNING id",
            (instituicao_id, dia_semana, abertura, fechamento)
        )
        if resultado:
            return {"sucesso": True, "id": resultado[0]['id']}
        return {"erro": "Erro ao adicionar horário"}