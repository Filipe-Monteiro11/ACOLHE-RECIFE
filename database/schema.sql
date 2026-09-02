-- ============================================================
-- Acolhe Recife — Banco de Dados
-- PostgreSQL (pgAdmin)
-- Como usar:
-- 1. Abra o pgAdmin e conecte no servidor local
-- 2. Crie um banco chamado "acolhe_recife"
-- 3. Abra o Query Tool nesse banco
-- 4. Cole este script inteiro e aperte F5
-- ============================================================

-- Limpa tudo caso já exista
DROP TABLE IF EXISTS horarios CASCADE;
DROP TABLE IF EXISTS necessidades CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS instituicoes CASCADE;
DROP TYPE IF EXISTS tipo_dia_semana CASCADE;
DROP TYPE IF EXISTS tipo_urgencia CASCADE;

-- 1. Tipos ENUM
CREATE TYPE tipo_dia_semana AS ENUM ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo');
CREATE TYPE tipo_urgencia AS ENUM ('baixa', 'media', 'alta');

-- 2. Tabelas
CREATE TABLE instituicoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    endereco VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(100),
    como_ajudar TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    instituicao_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
);

CREATE TABLE servicos (
    id SERIAL PRIMARY KEY,
    instituicao_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    descricao TEXT,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
);

CREATE TABLE necessidades (
    id SERIAL PRIMARY KEY,
    instituicao_id INT NOT NULL,
    item VARCHAR(100) NOT NULL,
    descricao TEXT,
    urgencia tipo_urgencia DEFAULT 'media',
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
);

CREATE TABLE horarios (
    id SERIAL PRIMARY KEY,
    instituicao_id INT NOT NULL,
    dia_semana tipo_dia_semana NOT NULL,
    horario_abertura TIME,
    horario_fechamento TIME,
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
);

-- 3. Índices
CREATE INDEX idx_servicos_instituicao ON servicos(instituicao_id);
CREATE INDEX idx_necessidades_instituicao ON necessidades(instituicao_id);
CREATE INDEX idx_horarios_instituicao ON horarios(instituicao_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_instituicoes_nome ON instituicoes(nome);

-- 4. Dados de teste — Instituições
INSERT INTO instituicoes (nome, descricao, endereco, latitude, longitude, telefone, email, como_ajudar) VALUES
('Casa de Acolhimento Centro', 'Abrigo temporário para adultos em situação de rua no centro do Recife.', 'Rua do Hospício, 100 - Centro, Recife - PE', -8.0631, -34.8710, '(81) 3232-1000', 'contato@casacolhimentocentro.org.br', 'Aceitamos doações de alimentos não perecíveis, roupas e produtos de higiene.'),
('Refeitório Solidário Boa Vista', 'Distribuição de refeições gratuitas e kits de higiene para população em vulnerabilidade.', 'Rua da Boa Vista, 200 - Boa Vista, Recife - PE', -8.0476, -34.8770, '(81) 3231-2000', 'ajuda@refeitoriosolidario.org.br', 'Precisamos de arroz, feijão, sabão, pasta de dente e roupas masculinas.'),
('Abrigo Esperança Viva', 'Acolhimento noturno com dormitórios, banho e apoio social.', 'Av. Cruz Cabugá, 300 - Santo Amaro, Recife - PE', -8.0580, -34.8920, '(81) 3233-3000', 'contato@esperancaviva.org.br', 'Recebemos colchões, cobertores, material de limpeza e voluntários.');

-- 5. Serviços
INSERT INTO servicos (instituicao_id, tipo, descricao) VALUES
(1, 'Abrigo', 'Dormitório coletivo com 30 vagas'),
(1, 'Alimentação', 'Café da manhã e jantar servidos diariamente'),
(1, 'Banho', 'Chuveiros disponíveis das 6h às 9h e das 17h às 20h'),
(2, 'Alimentação', 'Almoço servido das 11h às 13h, todos os dias'),
(2, 'Higiene', 'Distribuição de kits com sabonete, shampoo e pasta de dente'),
(3, 'Abrigo', 'Acolhimento noturno das 18h às 6h'),
(3, 'Banho', 'Banho quente disponível para acolhidos'),
(3, 'Apoio Social', 'Encaminhamento para documentação e serviços públicos');

-- 6. Necessidades
INSERT INTO necessidades (instituicao_id, item, descricao, urgencia) VALUES
(1, 'Arroz', '5kg', 'alta'),
(1, 'Feijão', '3kg', 'alta'),
(1, 'Cobertores', '10 unidades', 'media'),
(2, 'Sabão em pó', '2kg', 'alta'),
(2, 'Pasta de dente', '15 unidades', 'media'),
(2, 'Roupas masculinas (G)', 'Camisetas e calças', 'media'),
(3, 'Colchões', '5 unidades solteiro', 'alta'),
(3, 'Material de limpeza', 'Desinfetante, sabão, vassouras', 'baixa');

-- 7. Horários
INSERT INTO horarios (instituicao_id, dia_semana, horario_abertura, horario_fechamento) VALUES
(1, 'segunda', '06:00', '20:00'),
(1, 'terca', '06:00', '20:00'),
(1, 'quarta', '06:00', '20:00'),
(1, 'quinta', '06:00', '20:00'),
(1, 'sexta', '06:00', '20:00'),
(1, 'sabado', '07:00', '12:00'),
(2, 'segunda', '08:00', '14:00'),
(2, 'terca', '08:00', '14:00'),
(2, 'quarta', '08:00', '14:00'),
(2, 'quinta', '08:00', '14:00'),
(2, 'sexta', '08:00', '14:00'),
(2, 'sabado', '08:00', '12:00'),
(3, 'segunda', '18:00', '06:00'),
(3, 'terca', '18:00', '06:00'),
(3, 'quarta', '18:00', '06:00'),
(3, 'quinta', '18:00', '06:00'),
(3, 'sexta', '18:00', '06:00'),
(3, 'sabado', '18:00', '06:00'),
(3, 'domingo', '18:00', '06:00');