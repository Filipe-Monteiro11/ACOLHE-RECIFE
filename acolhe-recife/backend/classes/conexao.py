import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

load_dotenv()


class Conexao:
    _engine = None

    def __init__(self):
        if Conexao._engine is None:
            database_url = os.getenv("DATABASE_URL")

            if not database_url:
                raise RuntimeError(
                    "DATABASE_URL não configurada no arquivo .env."
                )

            url = make_url(database_url)

            if url.drivername == "postgresql":
                url = url.set(drivername="postgresql+psycopg")

            if url.drivername != "postgresql+psycopg":
                raise RuntimeError(
                    "DATABASE_URL deve utilizar PostgreSQL com psycopg."
                )

            Conexao._engine = create_engine(
                url,
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=5,
                max_overflow=5,
                connect_args={
                    "connect_timeout": 10
                }
            )

    def executar(self, sql, params=None):
        """
        Executa consultas SQL usando parâmetros nomeados.

        SELECT:
            Retorna uma lista de dicionários.

        INSERT/UPDATE/DELETE com RETURNING:
            Retorna uma lista de dicionários.

        INSERT/UPDATE/DELETE sem RETURNING:
            Retorna None.
        """
        parametros = params or {}

        with self._engine.begin() as conexao:
            resultado = conexao.execute(
                text(sql),
                parametros
            )

            if resultado.returns_rows:
                return [
                    dict(linha)
                    for linha in resultado.mappings().all()
                ]

            return None

    def fechar(self):
        """
        Libera as conexões do pool.
        Não deve ser chamado após cada requisição.
        """
        if Conexao._engine is not None:
            Conexao._engine.dispose()
            Conexao._engine = None