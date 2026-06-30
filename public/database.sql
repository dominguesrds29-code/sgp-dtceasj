-- SQL Dump para criação e alimentação do banco de dados do SGP DTCEA-SJ
-- Codificação: UTF-8

CREATE DATABASE IF NOT EXISTS `sgp_dtceasj` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sgp_dtceasj`;

DROP TABLE IF EXISTS `secoes`;
CREATE TABLE `secoes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sigla` varchar(20) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `chefe_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `secoes` WRITE;
INSERT INTO `secoes` (`sigla`, `nome`) VALUES 
('SSTI', 'SSTI'), 
('SELT', 'SELT'), 
('EMS', 'EMS'), 
('SEC-SO', 'SEC-SO'), 
('SIATO', 'SIATO'), 
('AIS', 'AIS'), 
('ASSIPACEA', 'ASSIPACEA'), 
('TWR', 'TWR');
UNLOCK TABLES;

DROP TABLE IF EXISTS `militares`;
CREATE TABLE `militares` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `posto_grad` varchar(50) NOT NULL,
  `especialidade` varchar(50) DEFAULT '',
  `nome` varchar(255) NOT NULL,
  `nome_guerra` varchar(100) DEFAULT '',
  `identidade` varchar(50) DEFAULT '',
  `cpf` varchar(20) DEFAULT '',
  `saram` varchar(20) DEFAULT '',
  `nascimento` varchar(20) DEFAULT '',
  `praca` varchar(20) DEFAULT '',
  `ult_promocao` varchar(20) DEFAULT '',
  `apresentacao_dtcea` varchar(20) DEFAULT '',
  `data_insp_saude` varchar(20) DEFAULT '',
  `validade_insp_saude` varchar(20) DEFAULT '',
  `secao` varchar(50) DEFAULT '',
  `prorrogacao` varchar(20) DEFAULT '',
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `militares` WRITE;
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (13, 'SO', 'BCO', 'RENATO DOMINGUES SILVA', 'SILVA', '515740', '091.303.727-39', '393.068-8', '29/01/1982', '08/07/2002', '01/12/2024', '18/01/2024', '', '', 'SSTI', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (14, 'SO', 'SAI', 'LUCIANY DA SILVA RAMOS DE MENDONÇA', 'MENDONÇA', '494578', '307.654.498-54', '404.007-4', '01/11/1980', '07/07/2003', '01/12/2025', '16/01/2025', '', '', 'SELT', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (17, '1S', 'BCT', 'TAÍS RIBEIRO DOS SANTOS', 'SANTOS', '528.756', '117.078.557-30', '420.197-3', '28/11/1985', '23/01/2005', '01/12/2020', '24/03/2020', '', '', 'EMS', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (18, '1S', 'BCT', 'INGRID MARTINS VICENTE', 'VICENTE', '532.166', '325.893.278-62', '424.013-8', '01/11/1984', '04/07/2005', '01/08/2022', '11/01/2022', '', '', 'SEC-SO', 'Prestando serviço ao ICEA');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (19, '1S', 'BCT', 'MUNIQUE CAROLINE BALTHAR DE SOUZA', 'SOUZA', '533.523', '351.564.388-57', '423.802-8', '16/03/1985', '04/07/2005', '01/08/2022', '28/03/2016', '02/09/2016', '02/09/2017', 'SIATO', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (20, '1S', 'SAI', 'MARCOS PAULO GARCIA ALVES', 'ALVES', '533.279', '108.693.577-27', '423.766-8', '22/07/1986', '04/07/2005', '01/08/2022', '17/09/2008', '10/05/2016', '10/05/2017', 'AIS', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (21, '1S', 'BCT', 'ERICA FREIRE PROENÇA', 'PROENÇA', '536.295', '317.909.538-55', '437.932-8', '27/10/1983', '23/01/2006', '01/12/2022', '26/01/2024', '', '', 'ASSIPACEA', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (22, '1S', 'BCT', 'RAFAEL CIPRIANO DA SILVA', 'SILVA', '536-.251', '334.896.828-31', '7427.982-4', '12/11/1984', '22/01/2006', '01/12/2022', '29/04/2024', '', '', 'SELT', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (23, '1S', 'BCT', 'BEATRIZ LAIA BARRETO CÂNDIDO DE PAULA', 'PAULA', '535.475', '133.745.317-09', '437.945-4', '29/06/1988', '25/02/2007', '01/12/2022', '29/05/2017', '29/12/2016', '29/12/2017', 'SIATO', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (24, '1S', 'BCT', 'JONATHAN FERNANDES GONÇALVES', 'GONÇALVES', '535.606', '339.192.568-08', '437.953-5', '02/02/1986', '26/02/2007', '01/12/2022', '09/05/2024', '', '', 'TWR', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (25, '1S', 'BET', 'BIANCA BEATRIZ VARGAS DUARTE DE OLIVEIRA', 'OLIVEIRA', '542.022', '118.014.367-11', '436.014-1', '26/10/1987', '21/01/2007', '01/12/2023', '28/12/2020', '', '', 'SELT', '');
INSERT INTO `militares` (`id`, `posto_grad`, `especialidade`, `nome`, `nome_guerra`, `identidade`, `cpf`, `saram`, `nascimento`, `praca`, `ult_promocao`, `apresentacao_dtcea`, `data_insp_saude`, `validade_insp_saude`, `secao`, `observacoes`) VALUES (26, '1S', 'BCT', 'THAIS VITOR HERZOG REIS', 'REIS', '541.472', '396.786.738-27', '601.082-2', '16/07/1989', '18/02/2008', '01/12/2023', '12/01/2026', '', '', 'TWR', '');
UNLOCK TABLES;
