-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS sgp_dtceasj CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgp_dtceasj;

-- Criação da tabela de militares
CREATE TABLE IF NOT EXISTS militares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posto_grad VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    nome_guerra VARCHAR(100) DEFAULT '',
    identidade VARCHAR(50) DEFAULT '',
    cpf VARCHAR(20) DEFAULT '',
    saram VARCHAR(20) DEFAULT '',
    nascimento VARCHAR(20) DEFAULT '',
    praca VARCHAR(20) DEFAULT '',
    ult_promocao VARCHAR(20) DEFAULT '',
    apresentacao_dtcea VARCHAR(20) DEFAULT '',
    data_insp_saude VARCHAR(20) DEFAULT '',
    validade_insp_saude VARCHAR(20) DEFAULT '',
    observacoes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
