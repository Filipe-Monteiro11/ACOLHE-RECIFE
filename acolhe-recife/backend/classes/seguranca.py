import re
import bleach

class Seguranca:
    # Limite de tentativas de login por IP
    tentativas_login = {}
    MAX_TENTATIVAS = 5
    TEMPO_BLOQUEIO = 300  # 5 minutos em segundos

    @staticmethod
    def sanitizar_texto(texto, max_len=255):
        """Remove tags HTML/scripts e limita o tamanho do texto"""
        if texto is None:
            return None
        if not isinstance(texto, str):
            texto = str(texto)
        # Remove tags HTML e scripts
        texto_limpo = bleach.clean(texto, tags=[], strip=True)
        # Limita o tamanho
        texto_limpo = texto_limpo[:max_len]
        return texto_limpo.strip()

    @staticmethod
    def validar_email(email):
        """Valida formato de email"""
        if not email or not isinstance(email, str):
            return False
        padrao = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(padrao, email) is not None

    @staticmethod
    def validar_senha(senha):
        """Valida força da senha: mínimo 8 chars, 1 maiúscula, 1 número"""
        if not senha or not isinstance(senha, str):
            return False, "Senha inválida"
        if len(senha) < 8:
            return False, "Senha deve ter no mínimo 8 caracteres"
        if not re.search(r'[A-Z]', senha):
            return False, "Senha deve ter ao menos 1 letra maiúscula"
        if not re.search(r'[0-9]', senha):
            return False, "Senha deve ter ao menos 1 número"
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', senha):
            return False, "Senha deve ter ao menos 1 caractere especial"
        return True, "Senha válida"

    @staticmethod
    def validar_coordenada(lat, lon):
        """Valida se latitude e longitude são números válidos"""
        try:
            lat_float = float(lat)
            lon_float = float(lon)
            if not (-90 <= lat_float <= 90):
                return False, "Latitude inválida"
            if not (-180 <= lon_float <= 180):
                return False, "Longitude inválida"
            return True, "Válido"
        except (ValueError, TypeError):
            return False, "Coordenadas devem ser números"

    @staticmethod
    def validar_telefone(telefone):
        """Valida formato de telefone brasileiro"""
        if not telefone:
            return True  # Telefone é opcional
        if not isinstance(telefone, str):
            return False
        # Aceita formatos: (81) 3232-1000, 8132321000, +558132321000
        padrao = r'^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$'
        return re.match(padrao, telefone) is not None

    @staticmethod
    def verificar_bloqueio_ip(ip):
        """Verifica se o IP excedeu tentativas de login"""
        if ip not in Seguranca.tentativas_login:
            return False
        dados = Seguranca.tentativas_login[ip]
        import time
        if time.time() - dados['tempo'] > Seguranca.TEMPO_BLOQUEIO:
            del Seguranca.tentativas_login[ip]
            return False
        return dados['tentativas'] >= Seguranca.MAX_TENTATIVAS

    @staticmethod
    def registrar_tentativa(ip, sucesso):
        """Registra tentativa de login para proteção contra brute force"""
        import time
        if ip not in Seguranca.tentativas_login:
            Seguranca.tentativas_login[ip] = {'tentativas': 0, 'tempo': time.time()}

        if sucesso:
            del Seguranca.tentativas_login[ip]
        else:
            Seguranca.tentativas_login[ip]['tentativas'] += 1
            Seguranca.tentativas_login[ip]['tempo'] = time.time()

    @staticmethod
    def mascarar_erro(erro):
        """Mascara erros internos pra não expor detalhes do banco"""
        erros_conhecidos = {
            'duplicate key': 'Este registro já existe',
            'foreign key': 'Registro relacionado não encontrado',
            'not-null': 'Campo obrigatório não preenchido',
            'invalid input syntax': 'Dados em formato inválido',
        }
        for chave, mensagem in erros_conhecidos.items():
            if chave in str(erro).lower():
                return mensagem
        return 'Erro interno. Contate o administrador.'