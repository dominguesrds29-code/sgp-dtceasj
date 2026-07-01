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
    case 'list_secoes':
        getSecoesList();
        break;
    case 'save_secao':
        saveSecao();
        break;
    case 'delete_secao':
        deleteSecao();
        break;
    default:
        echo json_encode(["success" => false, "message" => "Ação inválida."]);
        break;
}

function formatDateToSQL($dateStr) {
    if (empty($dateStr)) return null;
    $dateStr = trim($dateStr);
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateStr)) return $dateStr;
    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $dateStr, $matches)) return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
    return null;
}

function formatSQLToDate($sqlStr) {
    if (empty($sqlStr)) return '';
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $sqlStr, $matches)) {
        return $matches[3] . '/' . $matches[2] . '/' . $matches[1];
    }
    return $sqlStr;
}

function getSecoesList() {
    global $conn;
    $result = $conn->query("SELECT * FROM secoes ORDER BY sigla ASC");
    $list = [];
    if($result) {
        while ($row = $result->fetch_assoc()) {
            $list[] = $row;
        }
    }
    echo json_encode(["success" => true, "data" => $list]);
}

function saveSecao() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) {
        echo json_encode(["success" => false, "message" => "Dados inválidos."]);
        return;
    }
    $id = isset($data['id']) ? intval($data['id']) : 0;
    $sigla = isset($data['sigla']) ? mb_strtoupper($conn->real_escape_string($data['sigla']), 'UTF-8') : '';
    $nome = isset($data['nome']) ? mb_strtoupper($conn->real_escape_string($data['nome']), 'UTF-8') : '';
    $chefe_id = (isset($data['chefe_id']) && $data['chefe_id'] !== '') ? intval($data['chefe_id']) : 'NULL';

    if (empty($sigla)) {
        echo json_encode(["success" => false, "message" => "Sigla é obrigatória."]);
        return;
    }

    if ($id > 0) {
        $sql = "UPDATE secoes SET sigla='$sigla', nome='$nome', chefe_id=$chefe_id WHERE id=$id";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Seção atualizada com sucesso."]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao atualizar: " . $conn->error]);
        }
    } else {
        $sql = "INSERT INTO secoes (sigla, nome, chefe_id) VALUES ('$sigla', '$nome', $chefe_id)";
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Seção cadastrada com sucesso."]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao cadastrar: " . $conn->error]);
        }
    }
}

function deleteSecao() {
    global $conn;
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? intval($data['id']) : 0;
    
    if ($id <= 0) {
        echo json_encode(["success" => false, "message" => "ID inválido para exclusão."]);
        return;
    }

    $sql = "DELETE FROM secoes WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "Seção removida com sucesso."]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao excluir: " . $conn->error]);
    }
}

function getPersonnelList() {
    global $conn;
    
    // Verifica se a tabela está vazia. Se estiver, faz o seed automático a partir do dados.csv
    $countQuery = $conn->query("SELECT COUNT(*) as total FROM users");
    $countRow = $countQuery ? $countQuery->fetch_assoc() : ['total'=>0];
    
    if ($countRow['total'] == 0) {
        seedDatabaseFromCSV();
    }

    $result = $conn->query("SELECT u.*, s.sigla as secao_sigla FROM users u LEFT JOIN secoes s ON u.section_id = s.id WHERE u.deleted_at IS NULL ORDER BY u.name ASC");
    $list = [];
    if($result) {
        while ($row = $result->fetch_assoc()) {
            $secao = isset($row['secao_sigla']) ? $row['secao_sigla'] : $row['section_id'];
            $list[] = [
                'id' => $row['id'],
                'posto_grad' => $row['grade'],
                'especialidade' => $row['specialty'],
                'secao' => $secao,
                'nome' => $row['name'],
                'nome_guerra' => $row['war_name'],
                'identidade' => $row['identidade'],
                'cpf' => $row['cpf'],
                'saram' => $row['saram'],
                'nascimento' => formatSQLToDate($row['birth_date']),
                'praca' => formatSQLToDate($row['praca']),
                'ult_promocao' => formatSQLToDate($row['ult_promocao']),
                'apresentacao_dtcea' => formatSQLToDate($row['apresentacao_dtcea']),
                'data_insp_saude' => formatSQLToDate($row['data_insp_saude']),
                'validade_insp_saude' => formatSQLToDate($row['validade_insp_saude']),
                'prorrogacao' => formatSQLToDate($row['prorrogacao']),
                'observacoes' => $row['observacoes']
            ];
        }
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
    $grade = isset($data['posto_grad']) ? $conn->real_escape_string($data['posto_grad']) : '';
    $specialty = isset($data['especialidade']) ? $conn->real_escape_string($data['especialidade']) : '';
    $name = isset($data['nome']) ? mb_strtoupper($conn->real_escape_string($data['nome']), 'UTF-8') : '';
    $war_name = isset($data['nome_guerra']) ? mb_strtoupper($conn->real_escape_string($data['nome_guerra']), 'UTF-8') : '';
    $identidade = isset($data['identidade']) ? $conn->real_escape_string($data['identidade']) : '';
    $cpf = isset($data['cpf']) ? $conn->real_escape_string($data['cpf']) : '';
    $saram = isset($data['saram']) ? $conn->real_escape_string($data['saram']) : '';
    
    $birth_date = isset($data['nascimento']) ? formatDateToSQL($data['nascimento']) : null;
    $birth_date_sql = $birth_date ? "'" . $conn->real_escape_string($birth_date) . "'" : "NULL";

    $praca = isset($data['praca']) ? formatDateToSQL($data['praca']) : null;
    $praca_sql = $praca ? "'" . $conn->real_escape_string($praca) . "'" : "NULL";

    $ult_promocao = isset($data['ult_promocao']) ? formatDateToSQL($data['ult_promocao']) : null;
    $ult_promocao_sql = $ult_promocao ? "'" . $conn->real_escape_string($ult_promocao) . "'" : "NULL";

    $apresentacao_dtcea = isset($data['apresentacao_dtcea']) ? formatDateToSQL($data['apresentacao_dtcea']) : null;
    $apresentacao_dtcea_sql = $apresentacao_dtcea ? "'" . $conn->real_escape_string($apresentacao_dtcea) . "'" : "NULL";

    $data_insp_saude = isset($data['data_insp_saude']) ? formatDateToSQL($data['data_insp_saude']) : null;
    $data_insp_saude_sql = $data_insp_saude ? "'" . $conn->real_escape_string($data_insp_saude) . "'" : "NULL";

    $validade_insp_saude = isset($data['validade_insp_saude']) ? formatDateToSQL($data['validade_insp_saude']) : null;
    $validade_insp_saude_sql = $validade_insp_saude ? "'" . $conn->real_escape_string($validade_insp_saude) . "'" : "NULL";

    $prorrogacao = isset($data['prorrogacao']) ? formatDateToSQL($data['prorrogacao']) : null;
    $prorrogacao_sql = $prorrogacao ? "'" . $conn->real_escape_string($prorrogacao) . "'" : "NULL";
    
    $observacoes = isset($data['observacoes']) ? $conn->real_escape_string($data['observacoes']) : '';

    $secao_sigla = isset($data['secao']) ? mb_strtoupper($conn->real_escape_string($data['secao']), 'UTF-8') : '';
    $section_id = 'NULL';
    if ($secao_sigla) {
        $sec_res = $conn->query("SELECT id FROM secoes WHERE sigla='$secao_sigla' LIMIT 1");
        if ($sec_res && $sec_res->num_rows > 0) {
            $sec_row = $sec_res->fetch_assoc();
            $section_id = $sec_row['id'];
        }
    }

    if (empty($name) || empty($grade)) {
        echo json_encode(["success" => false, "message" => "Nome e Posto/Graduação são obrigatórios."]);
        return;
    }

    if ($id > 0) {
        $sql = "UPDATE users SET 
                grade='$grade', specialty='$specialty', name='$name', war_name='$war_name',
                identidade='$identidade', cpf='$cpf', saram='$saram', birth_date=$birth_date_sql, praca=$praca_sql, 
                ult_promocao=$ult_promocao_sql, apresentacao_dtcea=$apresentacao_dtcea_sql, 
                data_insp_saude=$data_insp_saude_sql, validade_insp_saude=$validade_insp_saude_sql, section_id=$section_id, prorrogacao=$prorrogacao_sql, observacoes='$observacoes'
                WHERE id=$id";
        
        if ($conn->query($sql)) {
            echo json_encode(["success" => true, "message" => "Registro atualizado com sucesso.", "id" => $id]);
        } else {
            echo json_encode(["success" => false, "message" => "Erro ao atualizar: " . $conn->error]);
        }
    } else {
        if ($section_id === 'NULL') {
            $sec_res = $conn->query("SELECT id FROM secoes LIMIT 1");
            if ($sec_res && $sec_res->num_rows > 0) {
                $section_id = $sec_res->fetch_assoc()['id'];
            } else {
                $section_id = 1;
            }
        }
        
        $email = $saram ? $saram . '@fab.mil.br' : uniqid() . '@fab.mil.br';
        $password = password_hash('123456', PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (
                    grade, specialty, name, war_name, identidade, cpf, saram,
                    birth_date, praca, ult_promocao, apresentacao_dtcea, data_insp_saude, validade_insp_saude, section_id, prorrogacao, observacoes, email, password, escala
                ) VALUES (
                    '$grade', '$specialty', '$name', '$war_name', '$identidade', '$cpf', '$saram',
                    $birth_date_sql, $praca_sql, $ult_promocao_sql, $apresentacao_dtcea_sql, $data_insp_saude_sql, $validade_insp_saude_sql, $section_id, $prorrogacao_sql, '$observacoes', '$email', '$password', 0
                )";
        
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

    // Soft delete: ao invés de apagar do banco e prejudicar outros sistemas, apenas marcamos como deletado.
    $sql = "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "Militar removido com sucesso."]);
    } else {
        echo json_encode(["success" => false, "message" => "Erro ao excluir: " . $conn->error]);
    }
}

function resetFromCSV() {
    global $conn;
    // Risco Crítico: TRUNCATE TABLE users apagaria todos os usuários de outros sistemas!
    // $conn->query("TRUNCATE TABLE users"); 
    
    // Como a tabela é compartilhada, o reset completo foi desativado por segurança.
    // Você pode fazer um update/insert condicional no seedDatabaseFromCSV se precisar importar.
    echo json_encode(["success" => false, "message" => "Ação bloqueada por segurança: A tabela users é compartilhada e não pode ser resetada."]);
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

    $default_section = 1;
    $sec_res = $conn->query("SELECT id FROM secoes LIMIT 1");
    if ($sec_res && $sec_res->num_rows > 0) {
        $default_section = $sec_res->fetch_assoc()['id'];
    }

    while (($row = fgetcsv($file)) !== FALSE) {
        if (empty($row) || count($row) < 3) continue;

        // Limpar dados
        $id = intval($row[0]);
        $csv_posto_grad = trim($conn->real_escape_string($row[1]));
        $name = mb_strtoupper($conn->real_escape_string($row[2]), 'UTF-8');
        
        $parts = explode(' ', $csv_posto_grad, 2);
        $grade = $parts[0];
        $specialty = isset($parts[1]) ? $parts[1] : '';

        $nameParts = explode(' ', trim($name));
        $war_name = end($nameParts);
        
        $identidade = $conn->real_escape_string($row[3]);
        $cpf = $conn->real_escape_string($row[4]);
        $saram = $conn->real_escape_string($row[9]);
        
        $birth_date = formatDateToSQL($row[12]);
        $birth_date_sql = $birth_date ? "'" . $conn->real_escape_string($birth_date) . "'" : "NULL";

        $praca = formatDateToSQL($row[14]);
        $praca_sql = $praca ? "'" . $conn->real_escape_string($praca) . "'" : "NULL";

        $ult_promocao = formatDateToSQL($row[15]);
        $ult_promocao_sql = $ult_promocao ? "'" . $conn->real_escape_string($ult_promocao) . "'" : "NULL";

        $apresentacao_dtcea = formatDateToSQL($row[17]);
        $apresentacao_dtcea_sql = $apresentacao_dtcea ? "'" . $conn->real_escape_string($apresentacao_dtcea) . "'" : "NULL";

        $data_insp_saude = formatDateToSQL($row[18]);
        $data_insp_saude_sql = $data_insp_saude ? "'" . $conn->real_escape_string($data_insp_saude) . "'" : "NULL";

        $validade_insp_saude = formatDateToSQL($row[19]);
        $validade_insp_saude_sql = $validade_insp_saude ? "'" . $conn->real_escape_string($validade_insp_saude) . "'" : "NULL";

        $observacoes = isset($row[28]) ? $conn->real_escape_string($row[28]) : '';
        
        $email = $saram ? $saram . '@fab.mil.br' : uniqid() . '@fab.mil.br';
        $password = password_hash('123456', PASSWORD_DEFAULT);

        // Inserir mantendo o ID original do CSV se possível, ou deixar autoincrement
        $sql = "INSERT INTO users 
                (id, grade, specialty, name, war_name, identidade, cpf, saram, birth_date, praca, ult_promocao, apresentacao_dtcea, data_insp_saude, validade_insp_saude, observacoes, section_id, email, password, escala) 
                VALUES 
                ($id, '$grade', '$specialty', '$name', '$war_name', '$identidade', '$cpf', '$saram', $birth_date_sql, $praca_sql, $ult_promocao_sql, $apresentacao_dtcea_sql, $data_insp_saude_sql, $validade_insp_saude_sql, '$observacoes', $default_section, '$email', '$password', 0)";
        $conn->query($sql);
    }
    
    fclose($file);
    return true;
}
?>
