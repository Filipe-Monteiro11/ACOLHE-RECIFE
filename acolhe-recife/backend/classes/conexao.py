import mysql.connector
import os

class Conexao:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._conectar()
        return cls._instance

    def _conectar(self):
        self.conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            database=os.getenv('DB_NAME', 'acolhe_recife'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '123456')
        )
        self.conn.autocommit = True

    def executar(self, sql, params=None):
        try:
            with self.conn.cursor(dictionary=True) as cursor:
                cursor.execute(sql, params)
                if cursor.description:
                    resultados = cursor.fetchall()
                    return resultados
                # Para INSERT, retorna o último ID inserido
                if cursor.lastrowid > 0:
                    return [{'id': cursor.lastrowid}]
                return None
        except Exception as e:
            print(f"Erro SQL: {e}")
            return None

    def fechar(self):
        self.conn.close()