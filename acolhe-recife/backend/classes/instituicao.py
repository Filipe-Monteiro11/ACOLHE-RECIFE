from classes.conexao import Conexao
from classes.seguranca import Seguranca


class Instituicao:
    def __init__(self):
        self.db = Conexao()

    @staticmethod
    def _id_valido(valor):
        return type(valor) is int and valor > 0

    @staticmethod
    def _validar_dados(
        nome, descricao, endereco, latitude,
        longitude, telefone, email, como_ajudar
    ):
        dados = {
            "nome": Seguranca.sanitizar_texto(nome, 150),
            "descricao": Seguranca.sanitizar_texto(descricao, 2000),
            "endereco": Seguranca.sanitizar_texto(endereco, 255),
            "telefone": Seguranca.sanitizar_texto(telefone, 20),
            "email": Seguranca.sanitizar_texto(email, 100),
            "como_ajudar": Seguranca.sanitizar_texto(
                como_ajudar, 2000
            )
        }

        if len(dados["nome"]) < 3:
            return None, "Nome deve ter no mínimo 3 caracteres"

        if not dados["endereco"]:
            return None, "Endereço é obrigatório"

        coord_ok, coord_msg = Seguranca.validar_coordenada(
            latitude, longitude
        )

        if not coord_ok:
            return None, coord_msg

        if dados["email"] and not Seguranca.validar_email(
            dados["email"]
        ):
            return None, "Email inválido"

        if dados["telefone"] and not Seguranca.validar_telefone(
            dados["telefone"]
        ):
            return None, "Telefone inválido"

        dados["latitude"] = float(latitude)
        dados["longitude"] = float(longitude)

        return dados, None

    def listar_todas(self):
        return self.db.executar(
            """
            SELECT
                id, nome, descricao, endereco,
                latitude, longitude, telefone,
                email, como_ajudar
            FROM instituicoes
            ORDER BY nome
            """
        ) or []

    def buscar_por_id(self, id):
        if not self._id_valido(id):
            return None

        resultado = self.db.executar(
            """
            SELECT
                id, nome, descricao, endereco,
                latitude, longitude, telefone,
                email, como_ajudar
            FROM instituicoes
            WHERE id = :id
            """,
            {"id": id}
        )

        return resultado[0] if resultado else None

    def criar(
        self, nome, descricao, endereco, latitude,
        longitude, telefone, email, como_ajudar
    ):
        dados, erro = self._validar_dados(
            nome, descricao, endereco, latitude,
            longitude, telefone, email, como_ajudar
        )

        if erro:
            return {"erro": erro}

        resultado = self.db.executar(
            """
            INSERT INTO instituicoes (
                nome, descricao, endereco, latitude,
                longitude, telefone, email, como_ajudar
            )
            VALUES (
                :nome, :descricao, :endereco, :latitude,
                :longitude, :telefone, :email, :como_ajudar
            )
            RETURNING id
            """,
            dados
        )

        return {
            "sucesso": True,
            "id": resultado[0]["id"]
        }

    def atualizar(
        self, id, nome, descricao, endereco, latitude,
        longitude, telefone, email, como_ajudar
    ):
        if not self._id_valido(id):
            return {"erro": "ID inválido"}

        dados, erro = self._validar_dados(
            nome, descricao, endereco, latitude,
            longitude, telefone, email, como_ajudar
        )

        if erro:
            return {"erro": erro}

        dados["id"] = id

        resultado = self.db.executar(
            """
            UPDATE instituicoes
            SET
                nome = :nome,
                descricao = :descricao,
                endereco = :endereco,
                latitude = :latitude,
                longitude = :longitude,
                telefone = :telefone,
                email = :email,
                como_ajudar = :como_ajudar,
                ultima_atualizacao = CURRENT_TIMESTAMP
            WHERE id = :id
            RETURNING id
            """,
            dados
        )

        if not resultado:
            return {"erro": "Instituição não encontrada"}

        return {"sucesso": True}

    def deletar(self, id):
        if not self._id_valido(id):
            return {"erro": "ID inválido"}

        resultado = self.db.executar(
            """
            DELETE FROM instituicoes
            WHERE id = :id
            RETURNING id
            """,
            {"id": id}
        )

        if not resultado:
            return {"erro": "Instituição não encontrada"}

        return {"sucesso": True}

    def listar_servicos(self, instituicao_id):
        if not self._id_valido(instituicao_id):
            return []

        return self.db.executar(
            """
            SELECT id, tipo, descricao
            FROM servicos
            WHERE instituicao_id = :instituicao_id
            ORDER BY id
            """,
            {"instituicao_id": instituicao_id}
        ) or []

    def adicionar_servico(
        self, instituicao_id, tipo, descricao
    ):
        if not self._id_valido(instituicao_id):
            return {"erro": "Instituição inválida"}

        tipo = Seguranca.sanitizar_texto(tipo, 50)
        descricao = Seguranca.sanitizar_texto(descricao, 500)

        if not tipo:
            return {"erro": "Tipo de serviço é obrigatório"}

        resultado = self.db.executar(
            """
            INSERT INTO servicos (
                instituicao_id, tipo, descricao
            )
            VALUES (
                :instituicao_id, :tipo, :descricao
            )
            RETURNING id
            """,
            {
                "instituicao_id": instituicao_id,
                "tipo": tipo,
                "descricao": descricao
            }
        )

        return {
            "sucesso": True,
            "id": resultado[0]["id"]
        }

    def listar_necessidades(self, instituicao_id):
        if not self._id_valido(instituicao_id):
            return []

        return self.db.executar(
            """
            SELECT id, item, descricao, urgencia
            FROM necessidades
            WHERE instituicao_id = :instituicao_id
            ORDER BY id
            """,
            {"instituicao_id": instituicao_id}
        ) or []

    def adicionar_necessidade(
        self, instituicao_id, item, descricao, urgencia
    ):
        if not self._id_valido(instituicao_id):
            return {"erro": "Instituição inválida"}

        item = Seguranca.sanitizar_texto(item, 100)
        descricao = Seguranca.sanitizar_texto(descricao, 500)

        if not item:
            return {"erro": "Item é obrigatório"}

        if urgencia not in ("baixa", "media", "alta"):
            urgencia = "media"

        resultado = self.db.executar(
            """
            INSERT INTO necessidades (
                instituicao_id, item, descricao, urgencia
            )
            VALUES (
                :instituicao_id, :item,
                :descricao, :urgencia
            )
            RETURNING id
            """,
            {
                "instituicao_id": instituicao_id,
                "item": item,
                "descricao": descricao,
                "urgencia": urgencia
            }
        )

        return {
            "sucesso": True,
            "id": resultado[0]["id"]
        }

    def listar_horarios(self, instituicao_id):
        if not self._id_valido(instituicao_id):
            return []

        return self.db.executar(
            """
            SELECT
                id, dia_semana,
                horario_abertura, horario_fechamento
            FROM horarios
            WHERE instituicao_id = :instituicao_id
            ORDER BY id
            """,
            {"instituicao_id": instituicao_id}
        ) or []

    def adicionar_horario(
        self, instituicao_id, dia_semana,
        abertura, fechamento
    ):
        if not self._id_valido(instituicao_id):
            return {"erro": "Instituição inválida"}

        dias_validos = (
            "segunda", "terca", "quarta",
            "quinta", "sexta", "sabado", "domingo"
        )

        if dia_semana not in dias_validos:
            return {"erro": "Dia da semana inválido"}

        if not abertura or not fechamento:
            return {"erro": "Informe os horários de funcionamento"}

        resultado = self.db.executar(
            """
            INSERT INTO horarios (
                instituicao_id, dia_semana,
                horario_abertura, horario_fechamento
            )
            VALUES (
                :instituicao_id, :dia_semana,
                :abertura, :fechamento
            )
            RETURNING id
            """,
            {
                "instituicao_id": instituicao_id,
                "dia_semana": dia_semana,
                "abertura": abertura,
                "fechamento": fechamento
            }
        )

        return {
            "sucesso": True,
            "id": resultado[0]["id"]
        }