CREATE DATABASE IF NOT EXISTS `efetivosj` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `efetivosj`;

CREATE TABLE IF NOT EXISTS `secoes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sigla` varchar(20) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `chefe_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `secoes` (`id`, `sigla`, `nome`) VALUES 
(1, 'SSTI', 'SSTI'), 
(2, 'SELT', 'SELT'), 
(3, 'EMS', 'EMS'), 
(4, 'SEC-SO', 'SEC-SO'), 
(5, 'SIATO', 'SIATO'), 
(6, 'AIS', 'AIS'), 
(7, 'ASSIPACEA', 'ASSIPACEA'), 
(8, 'TWR', 'TWR');

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `saram` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `war_name` varchar(255) DEFAULT NULL,
  `grade` varchar(255) DEFAULT NULL,
  `section_id` bigint unsigned NOT NULL,
  `birth_date` date DEFAULT NULL,
  `specialty` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `avatar` varchar(255) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `cpf` varchar(20) DEFAULT NULL,
  `identidade` varchar(50) DEFAULT NULL,
  `praca` date DEFAULT NULL,
  `ult_promocao` date DEFAULT NULL,
  `apresentacao_dtcea` date DEFAULT NULL,
  `data_insp_saude` date DEFAULT NULL,
  `validade_insp_saude` date DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `escala` tinyint(1) NOT NULL DEFAULT '0',
  `prorrogacao` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
