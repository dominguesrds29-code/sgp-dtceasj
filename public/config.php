<?php
// Configuração do banco de dados SGP
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'sgp_dtceasj';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die("Falha na conexão: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");
?>
