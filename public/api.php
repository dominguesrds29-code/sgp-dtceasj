<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'config.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

switch ($action) {
    case 'list':
        getPersonnelList();
        break;
    case 'save':
        savePerson();
        break;
    case 'delete':
        deletePerson();
        break;
    case 'reset':
        resetFromCSV();
        break;
    default:
        echo json_encode(["success" => false, "message" => "Ação inválida."]);
        break;
}

function getPersonnelList() {
    global $conn;
    
    // Verifica se a tabela está vazia. Se estiver, faz o seed automático a partir do dados.csv
    $countQuery = $conn->query("SELECT COUNT(*) as total FROM militares");
    $countRow = $countQuery->fetch_assoc();
    
    if ($countRow['total'] == 0) {
        seedDatabaseFromCSV();
    }

    $result = $conn->query("SELECT * FROM militares ORDER BY nome ASC");
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = $row;
    }
    
    echo json_encode(["success" => true, "data" => $list]);
}

function savePerson() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["success" => false, "message" => "Dados inválidos."]);
        return;
    }

    $id = isset($data['id']) ? intval($data['id']) : 0;
    $posto_grad = isset($data['posto_grad']) ? $conn->real_escape_string($data['posto_grad']) : '';
    $nome = isset($data['nome']) ? $conn->real_escape_string($data['nome']) : '';
    $nome_guerra = isset($data['nome_guerra']) ? $conn->real_escape_string($data['nome_guerra']) : '';
    $identidade = isset($data['identidade']) ? $conn->real_escape_string($data['identidade']) : '';
    $cpf = isset($data['cpf']) ? $conn->real_escape_string($data['cpf']) : '';
    $saram = isset($data['saram']) ? $conn->real_escape_string($data['saram']) : '';
    $nascimento = isset($data['nascimento']) ? $conn->real_escape_string($data['nascimento']) : '';
    $praca = isset($data['praca']) ? $conn->real_escape_string($data['praca']) : '';
    $ult_promocao = isset($data['ult_promocao']) ? $conn->real_escape_string($data['ult_promocao']) : '';
    $apresentacao_dtcea = isset($data['apresentacao_dtcea']) ? $conn->real_escape_string($data['apresentacao_dtcea']) : '';
    $data_insp_saude = isset($data['data_insp_saude']) ? $conn->real_escape_string($data['data_insp_saude']) : '';
    $validade_insp_saude = isset($data['validade_insp_saude']) ? $conn->real_escape_string($data['validade_insp_saude']) : '';
    $observacoes = isset($data['observacoes']) ? $conn->real_escape_string($data['observacoes']) : '';

    // Enforçar maiúsculas para Nome Completo e Nome de Guerra
    $nome = mb_strtoupper($nome, 'UTF-8');
    $nome_guerra = mb_strtoupper($nome_guerra, 'UTF-8');

    if (empty($nome) || empty($posto_grad)) {
        echo json_encode(["success" => false, "message" => "Nome e Posto/Graduação são obrigatórios."]);
        return;
    }

    if ($id > 0) {
        // Update
        $sql = "UPDATE militares SET 
                posto_grad = '$posto_grad', 
                nome = '$nome', 
                nome_guerra = '$nome_guerra',
                identidade = '$identidade', 
                cpf = '$cpf', 
                saram = '$saram', 
                nascimento = '$nascimento', 
                praca = '$praca', 
                ult_promocao = '$ult_promocao', 
                apresentacao_dtcea = '$apresentacao_dtcea', 
                data_insp_saude = '$data_insp_saude', 
                validade_insp_saude = '$validade_insp_saude', 
                observacoes = '$observacoes' 
                WHERE id = $id";
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Registro atualizado com sucesso.", "id" => $id]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao atualizar: " . $conn->error]);
        }
    } else {
        // Insert
        $sql = "INSERT INTO militares 
                (posto_grad, nome, nome_guerra, identidade, cpf, saram, nascimento, praca, ult_promocao, apresentacao_dtcea, data_insp_saude, validade_insp_saude, observacoes) 
                VALUES 
                ('$posto_grad', '$nome', '$nome_guerra', '$identidade', '$cpf', '$saram', '$nascimento', '$praca', '$ult_promocao', '$apresentacao_dtcea', '$data_insp_saude', '$validade_insp_saude', '$observacoes')";
        
        if ($conn->query($sql)) {
            $newId = $conn->insert_id;
            echo json_encode(["success" => true, "message" => "Militar cadastrado com sucesso.", "id" => $newId]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao cadastrar: " . $conn->error]);
        }
    }
}

function deletePerson() {
    global $conn;
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? intval($data['id']) : 0;
    
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "ID inválido para exclusão."]);
        return;
    }

    $sql = "DELETE FROM militares WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "Militar removido com sucesso."]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao excluir: " . $conn->error]);
    }
}

function resetFromCSV() {
    global $conn;
    $conn->query("TRUNCATE TABLE militares");
    if (seedDatabaseFromCSV()) {
        echo json_encode(["success" => true, "message" => "Banco de dados resetado com sucesso."]);
    } else {
        echo json_encode(["success" => false, "message" => "Falha ao ler dados.csv para resetar."]);
    }
}

function seedDatabaseFromCSV() {
    global $conn;
    
    $csvFile = 'dados.csv';
    if (!file_exists($csvFile)) {
        return false;
    }

    $file = fopen($csvFile, 'r');
    if (!$file) return false;

    // Pular cabeçalho
    fgetcsv($file);

    while (($row = fgetcsv($file)) !== FALSE) {
        if (empty($row) || count($row) < 3) continue;

        // Limpar dados
        $id = intval($row[0]);
        $posto_grad = $conn->real_escape_string($row[1]);
        $nome = mb_strtoupper($conn->real_escape_string($row[2]), 'UTF-8');
        
        // Estipula um Nome de Guerra padrão baseado no último sobrenome
        $nameParts = explode(' ', trim($nome));
        $nome_guerra = end($nameParts);
        
        $identidade = $conn->real_escape_string($row[3]);
        $cpf = $conn->real_escape_string($row[4]);
        // Ignorando Banco (row 5), Nº Banco (row 6), Agência (row 7), C/C (row 8)
        $saram = $conn->real_escape_string($row[9]);
        // Ignorando Dep (row 10), RC/RA (row 11)
        $nascimento = $conn->real_escape_string($row[12]);
        $praca = $conn->real_escape_string($row[14]);
        $ult_promocao = $conn->real_escape_string($row[15]);
        $apresentacao_dtcea = $conn->real_escape_string($row[17]);
        $data_insp_saude = $conn->real_escape_string($row[18]);
        $validade_insp_saude = $conn->real_escape_string($row[19]);
        $observacoes = isset($row[28]) ? $conn->real_escape_string($row[28]) : '';

        // Inserir mantendo o ID original do CSV
        $sql = "INSERT INTO militares 
                (id, posto_grad, nome, nome_guerra, identidade, cpf, saram, nascimento, praca, ult_promocao, apresentacao_dtcea, data_insp_saude, validade_insp_saude, observacoes) 
                VALUES 
                ($id, '$posto_grad', '$nome', '$nome_guerra', '$identidade', '$cpf', '$saram', '$nascimento', '$praca', '$ult_promocao', '$apresentacao_dtcea', '$data_insp_saude', '$validade_insp_saude', '$observacoes')";
        $conn->query($sql);
    }
    
    fclose($file);
    return true;
}
?>
