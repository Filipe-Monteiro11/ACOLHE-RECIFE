import psycopg2

class Conexao:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._conectar()
        return cls._instance

    def _conectar(self):
        self.conn = psycopg2.connect(
            host='localhost',
            port='5432',
            dbname='acolhe_recife',
            user='postgres',
            password='123456'
        )
        self.conn.autocommit = True

    def executar(self, sql, params=None):
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(sql, params)
                if cursor.description:
                    colunas = [desc[0] for desc in cursor.description]
                    resultados = cursor.fetchall()
                    return [dict(zip(colunas, linha)) for linha in resultados]
                return None
        except Exception as e:
            print(f"Erro SQL: {e}")
            return None

    def fechar(self):
        self.conn.close()