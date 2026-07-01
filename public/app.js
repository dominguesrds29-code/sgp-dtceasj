// Sistema de Gerenciamento de Pessoal - DTCEA-SJ
// Controle Frontend e Integração com API PHP

let personnelData = [];
let secoesData = [];
let currentUser = null;
let isAdmin = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Inicializa ícones Lucide
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Configura eventos de formulários e modais
    setupEventListeners();
    
    // Verifica sessão e depois carrega os dados
    await checkAuth();
}

async function checkAuth() {
    try {
        const response = await fetch('api.php?action=check_auth');
        const data = await response.json();
        
        if (data.logged_in) {
            isAdmin = data.is_admin;
            document.getElementById('login-modal').classList.remove('active');
            
            // Controle UI baseado em permissão
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'inline-flex' : 'none');
            document.querySelectorAll('.admin-only-field').forEach(el => el.style.display = isAdmin ? 'flex' : 'none');
            document.getElementById('header-actions').style.display = 'flex';
            
            // Carrega dados da API PHP
            await fetchSecoes();
            await fetchPersonnel();
        } else {
            // Mostra tela de login
            document.getElementById('login-modal').classList.add('active');
            document.getElementById('header-actions').style.display = 'none';
        }
    } catch (e) {
        console.error("Erro ao verificar auth:", e);
    }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';
    
    try {
        const response = await fetch('api.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.success) {
            checkAuth();
        } else {
            errorEl.innerText = result.message;
            errorEl.style.display = 'block';
        }
    } catch (e) {
        errorEl.innerText = "Erro de conexão com o servidor.";
        errorEl.style.display = 'block';
    }
});

async function logout() {
    await fetch('api.php?action=logout');
    window.location.reload();
}

// Buscar dados da API
async function fetchPersonnel() {
    const dbStatusEl = document.getElementById('db-status');
    try {
        const response = await fetch('api.php?action=list');
        if (!response.ok) throw new Error("Erro de comunicação com o servidor.");
        const result = await response.json();
        
        if (result.success) {
            personnelData = result.data.map(item => {
                // Mapeamento dos campos do DB para a estrutura de dados JavaScript
                const p = {
                    id: item.id,
                    rank: item.posto_grad,
                    specialty: item.especialidade,
                    secao: item.secao,
                    name: item.nome,
                    warName: item.nome_guerra,
                    identity: item.identidade,
                    cpf: item.cpf,
                    saram: item.saram,
                    birthDate: item.nascimento,
                    pracaDate: item.praca,
                    lastPromotionDate: item.ult_promocao,
                    presentationDate: item.apresentacao_dtcea,
                    healthInspectionDate: item.data_insp_saude,
                    healthInspectionValidity: item.validade_insp_saude,
                    prorrogacaoDate: item.prorrogacao,
                    observations: item.observacoes,
                    is_admin: item.is_admin,
                    personType: item.person_type
                };
                
                // Realiza cálculos em tempo real
                recalculateItemFields(p);
                return p;
            });

            if (dbStatusEl) {
                dbStatusEl.innerText = "Conectado ao banco sgp_dtceasj";
                dbStatusEl.style.color = "var(--accent-green)";
            }

            renderDashboard();
            renderTable();
            populateFilters();
        } else {
            throw new Error(result.message || "Erro desconhecido na API.");
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
        if (dbStatusEl) {
            dbStatusEl.innerText = "Falha ao conectar com o banco de dados";
            dbStatusEl.style.color = "var(--accent-red)";
        }
        
        const tbody = document.querySelector('#personnel-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; color: var(--accent-red); padding: 3rem 0; font-weight: 500;">
                    <i data-lucide="database-backup" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;"></i>
                    Não foi possível carregar os dados.
                    <br><br>
                    <small style="color:#a00; font-family: monospace; font-size: 14px;">Motivo: ${e.message}</small>
                </td>
            </tr>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}

// Auxiliar: Tenta converter string de data em objeto Date (suporta DD/MM/AAAA e AAAA-MM-DD com barras ou traços)
function parseDateString(dateStr) {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    const parts = cleanStr.split(/[\/\-]/).map(p => p.trim());
    if (parts.length !== 3) return null;

    let day, month, year;
    if (parts[0].length === 4) { // Formato AAAA-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) { // Formato DD/MM/AAAA
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
    } else {
        return null;
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    const dateObj = new Date(year, month, day);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj;
}

// Cálculos automáticos de datas e prazos baseados na data atual (2026-06-15)
function recalculateItemFields(item) {
    const today = new Date();

    // 1. Cálculo de Idade
    if (item.birthDate) {
        item.age = calculateAge(item.birthDate, today);
    } else {
        item.age = null;
    }

    // 2. Cálculo de Tempo de Serviço (Praça)
    if (item.pracaDate) {
        const timeDiff = calculateDateDifference(item.pracaDate, today);
        item.serviceTime = `${timeDiff.years}A ${timeDiff.months}M ${timeDiff.days}D`;
        item.serviceTimeYears = timeDiff.years;
        
        // Tempo faltante para reserva (Considerando 30 anos como meta nos dados fictícios)
        const metaReserva = 30;
        item.timeToReserve = Math.max(0, metaReserva - timeDiff.years);
    } else {
        item.serviceTime = '';
        item.serviceTimeYears = null;
        item.timeToReserve = null;
    }

    // 3. Cálculo de Tempo no DTCEA-SJ
    if (item.presentationDate) {
        const timeDiff = calculateDateDifference(item.presentationDate, today);
        item.timeDtceaSj = `${timeDiff.years}A ${timeDiff.months}M ${timeDiff.days}D`;
    } else {
        item.timeDtceaSj = '';
    }

    // 4. Inspeção de Saúde e Vencimento
    if (item.healthInspectionValidity) {
        const validityDate = parseDateString(item.healthInspectionValidity);
        if (validityDate) {
            const diffTime = validityDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            item.healthInspectionDaysLeft = diffDays;
            
            if (diffDays < 0) {
                item.healthInspectionObs = "EXPIRED";
            } else if (diffDays <= 60) {
                item.healthInspectionObs = "WARNING";
            } else {
                item.healthInspectionObs = "VALID";
            }
        } else {
            item.healthInspectionDaysLeft = null;
            item.healthInspectionObs = "NOT_DONE";
        }
    } else {
        item.healthInspectionDaysLeft = null;
        item.healthInspectionObs = "NOT_DONE";
    }

    // 5. Prorrogação
    item.prorrogacaoDaysLeft = null;
    item.prorrogacaoWarning = false;
    if (item.prorrogacaoDate) {
        const prorrogacaoObj = parseDateString(item.prorrogacaoDate);
        if (prorrogacaoObj) {
            const diffTime = prorrogacaoObj - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            item.prorrogacaoDaysLeft = diffDays;
            
            if (diffDays <= 90 && diffDays >= 0) {
                item.prorrogacaoWarning = true;
            }
        }
    }
}

// Auxiliar: Diferença entre duas datas em Anos, Meses e Dias
function calculateDateDifference(startDateStr, endDateObj) {
    const start = parseDateString(startDateStr);
    if (!start) return { years: 0, months: 0, days: 0 };
    const end = endDateObj;

    if (start > end) return { years: 0, months: 0, days: 0 };

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days };
}

// Auxiliar: Cálculo de idade
function calculateAge(birthDateStr, today) {
    const birth = parseDateString(birthDateStr);
    if (!birth) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// ─── DASHBOARD RENDERING ───
function renderDashboard() {
    const totalCount = personnelData.length;
    document.getElementById('dash-total').innerText = totalCount;

    // Contagem de inspeções vencidas ou próximas
    let expiredInspections = 0;
    let warningInspections = 0;
    personnelData.forEach(p => {
        if (p.healthInspectionObs === 'EXPIRED' || p.healthInspectionObs === 'NOT_DONE') {
            expiredInspections++;
        } else if (p.healthInspectionObs === 'WARNING') {
            warningInspections++;
        }
    });

    const inspValueEl = document.getElementById('dash-inspections');
    const inspDetailEl = document.getElementById('dash-inspections-detail');
    if (expiredInspections > 0) {
        inspValueEl.innerHTML = `<span class="indicator offline"></span> <span>${expiredInspections}</span>`;
        inspDetailEl.innerHTML = `<span style="color: var(--accent-red); font-weight: 600;">Pendentes / Vencidas</span>`;
    } else if (warningInspections > 0) {
        inspValueEl.innerHTML = `<span class="indicator running"></span> <span>${warningInspections}</span>`;
        inspDetailEl.innerHTML = `<span style="color: var(--accent-orange); font-weight: 600;">Expira em até 60 dias</span>`;
    } else {
        inspValueEl.innerHTML = `<span class="indicator online"></span> <span>0</span>`;
        inspDetailEl.innerText = "Tudo em conformidade";
    }

    // Militares pretes a ir para a reserva (< 3 anos)
    const activeReserves = personnelData.filter(p => p.timeToReserve !== null && p.timeToReserve <= 3).length;
    const reserveValueEl = document.getElementById('dash-reserves');
    const reserveDetailEl = document.getElementById('dash-reserves-detail');
    reserveValueEl.innerText = activeReserves;
    reserveDetailEl.innerText = `${activeReserves} militares c/ menos de 3 anos`;

    // Tempo médio no DTCEA-SJ
    let totalSjMonths = 0;
    let validCount = 0;
    personnelData.forEach(p => {
        if (p.presentationDate) {
            const diff = calculateDateDifference(p.presentationDate, new Date());
            totalSjMonths += (diff.years * 12) + diff.months;
            validCount++;
        }
    });
    const avgSjYears = validCount > 0 ? ((totalSjMonths / validCount) / 12).toFixed(1) : "0.0";
    document.getElementById('dash-avg-time').innerText = `${avgSjYears} Anos`;
}

// ─── TABELA RENDERING ───
function renderTable() {
    const tbody = document.querySelector('#personnel-table tbody');
    tbody.innerHTML = '';

    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    const rankFilter = document.getElementById('filter-rank').value;
    const specialtyFilter = document.getElementById('filter-specialty').value;
    const healthFilter = document.getElementById('filter-health').value;
    const reserveFilter = document.getElementById('filter-reserve').value;
    const typeFilter = document.getElementById('filter-type').value;

    const filtered = personnelData.filter(p => {
        const matchSearch = !searchQuery || 
            p.name.toLowerCase().includes(searchQuery) ||
            p.specialty.toLowerCase().includes(searchQuery) ||
            p.identity.toLowerCase().includes(searchQuery) ||
            p.cpf.toLowerCase().includes(searchQuery) ||
            p.saram.toLowerCase().includes(searchQuery);

        const matchRank = !rankFilter || p.rank === rankFilter;
        const matchSpecialty = !specialtyFilter || p.specialty === specialtyFilter;
        const matchType = typeFilter === 'TODOS' || p.personType === typeFilter;

        let matchHealth = true;
        if (healthFilter) {
            if (healthFilter === 'VALID') matchHealth = p.healthInspectionObs === 'VALID';
            if (healthFilter === 'WARNING') matchHealth = p.healthInspectionObs === 'WARNING';
            if (healthFilter === 'EXPIRED') matchHealth = p.healthInspectionObs === 'EXPIRED';
            if (healthFilter === 'NOT_DONE') matchHealth = p.healthInspectionObs === 'NOT_DONE';
        }

        let matchReserve = true;
        if (reserveFilter) {
            if (reserveFilter === 'UPCOMING') matchReserve = p.timeToReserve !== null && p.timeToReserve <= 2;
            if (reserveFilter === 'MID') matchReserve = p.timeToReserve !== null && p.timeToReserve > 2 && p.timeToReserve <= 5;
            if (reserveFilter === 'LONG') matchReserve = p.timeToReserve !== null && p.timeToReserve > 5;
        }

        return matchSearch && matchRank && matchSpecialty && matchHealth && matchReserve && matchType;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" style="text-align: center; color: var(--text-secondary); padding: 3rem 0;">
                    Nenhum militar localizado com os filtros selecionados.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        
        let healthCell = '';
        if (p.healthInspectionObs === 'VALID') {
            healthCell = `<span class="status-badge valid"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Válida (${p.healthInspectionValidity})</span>`;
        } else if (p.healthInspectionObs === 'WARNING') {
            healthCell = `<span class="status-badge warning"><i data-lucide="alert-triangle" style="width: 12px; height: 12px;"></i> Expira em ${p.healthInspectionDaysLeft}d</span>`;
        } else if (p.healthInspectionObs === 'EXPIRED') {
            healthCell = `<span class="status-badge expired"><i data-lucide="alert-circle" style="width: 12px; height: 12px;"></i> Vencida (${p.healthInspectionValidity})</span>`;
        } else {
            healthCell = `<span class="status-badge expired"><i data-lucide="help-circle" style="width: 12px; height: 12px;"></i> Não realizada</span>`;
        }

        const reserveText = p.timeToReserve !== null ? `${p.timeToReserve} Anos` : 'N/A';

        let trStyle = "";
        let nameStyle = "font-weight: 600; color: var(--text-primary);";
        let prorrogacaoCell = p.prorrogacaoDate || '-';
        if (p.prorrogacaoWarning) {
            trStyle = "background-color: var(--accent-orange-bg);";
            nameStyle = "font-weight: bold; color: var(--accent-orange);";
            prorrogacaoCell = `<span style="color: var(--accent-orange); font-weight: bold;">${p.prorrogacaoDate} <small>(${p.prorrogacaoDaysLeft}d)</small></span>`;
        }

        if (trStyle) tr.setAttribute('style', trStyle);

        const actionBtns = isAdmin ? `
            <span class="action-btns-inline" style="display: inline-flex; gap: 4px;">
                <button class="btn-icon" onclick="editPerson('${p.id}')" title="Editar"><i data-lucide="edit-3" style="width: 14px; height: 14px; color: var(--fab-blue);"></i></button>
                <button class="btn-icon" onclick="deletePerson('${p.id}')" title="Excluir"><i data-lucide="trash-2" style="width: 14px; height: 14px; color: var(--accent-red);"></i></button>
            </span>
        ` : '';

        tr.innerHTML = `
            <td><span class="rank-badge">${p.rank}</span></td>
            <td><span class="specialty-badge" style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 12px; color: var(--text-secondary);">${p.specialty || '-'}</span></td>
            <td><span class="specialty-badge" style="background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 12px; color: var(--text-secondary);">${p.secao || '-'}</span></td>
            <td style="${nameStyle};">${p.name}</td>
            <td style="font-weight: 600; color: var(--text-primary);">${p.warName || '-'}</td>
            <td>${p.identity || '-'}</td>
            <td>${p.cpf || '-'}</td>
            <td>${p.saram || '-'}</td>
            <td>${p.birthDate} (${p.age || '?'})</td>
            <td>${p.serviceTime || '-'}</td>
            <td>${reserveText}</td>
            <td>${p.timeDtceaSj || '-'}</td>
            <td>${prorrogacaoCell}</td>
            <td>${healthCell}</td>
            <td class="admin-only" style="text-align: center;">${actionBtns}</td>
        `;
        tbody.appendChild(tr);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Filtros dinâmicos baseados no cadastro existente
function populateFilters() {
    // 1. Postos
    const rankFilter = document.getElementById('filter-rank');
    const currentVal = rankFilter.value;
    const ranks = [...new Set(personnelData.map(p => p.rank))].filter(Boolean).sort();
    
    rankFilter.innerHTML = '<option value="">Todos os Postos</option>';
    ranks.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.innerText = r;
        rankFilter.appendChild(opt);
    });
    rankFilter.value = currentVal;

    // 2. Especialidades
    const specialtyFilter = document.getElementById('filter-specialty');
    const currentSpecVal = specialtyFilter.value;
    const specialties = [...new Set(personnelData.map(p => p.specialty))].filter(Boolean).sort();

    specialtyFilter.innerHTML = '<option value="">Todas as Especialidades</option>';
    specialties.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.innerText = s;
        specialtyFilter.appendChild(opt);
    });
    specialtyFilter.value = currentSpecVal;
}

// Configuração de Event Listeners
function setupEventListeners() {
    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('filter-rank').addEventListener('change', renderTable);
    document.getElementById('filter-specialty').addEventListener('change', renderTable);
    document.getElementById('filter-health').addEventListener('change', renderTable);
    document.getElementById('filter-reserve').addEventListener('change', renderTable);
    document.getElementById('filter-type').addEventListener('change', renderTable);

    // Modal Nova Ficha / Editar
    const modal = document.getElementById('person-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const personForm = document.getElementById('person-form');

    const closeModal = () => {
        modal.classList.remove('active');
        personForm.reset();
        document.getElementById('modal-action').value = 'add';
        document.getElementById('modal-edit-id').value = '';
    };

    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    personForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePerson();
        closeModal();
    });

    let isMouseDownOnOverlay = false;
    modal.addEventListener('mousedown', (e) => {
        isMouseDownOnOverlay = (e.target === modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal && isMouseDownOnOverlay) {
            closeModal();
        }
    });

    // Inputs dinâmicos no form para prever cálculos em tempo real
    const birthInput = document.getElementById('field-birthDate');
    const pracaInput = document.getElementById('field-pracaDate');
    const presInput = document.getElementById('field-presentationDate');

    const triggerRecalculatePreview = () => {
        const today = new Date();
        const birth = birthInput.value;
        const praca = pracaInput.value;
        const pres = presInput.value;

        const birthDateObj = parseDateString(birth);
        if (birthDateObj) {
            const age = calculateAge(birth, today);
            document.getElementById('field-age').value = age !== null ? age : '';
        } else {
            document.getElementById('field-age').value = '';
        }
        
        const pracaDateObj = parseDateString(praca);
        if (pracaDateObj) {
            const diff = calculateDateDifference(praca, today);
            document.getElementById('field-serviceTime').value = `${diff.years}A ${diff.months}M ${diff.days}D`;
            document.getElementById('field-timeToReserve').value = Math.max(0, 30 - diff.years);
        } else {
            document.getElementById('field-serviceTime').value = '';
            document.getElementById('field-timeToReserve').value = '';
        }

        const presDateObj = parseDateString(pres);
        if (presDateObj) {
            const diff = calculateDateDifference(pres, today);
            document.getElementById('field-timeDtceaSj').value = `${diff.years}A ${diff.months}M ${diff.days}D`;
        } else {
            document.getElementById('field-timeDtceaSj').value = '';
        }
    };

    birthInput.addEventListener('input', triggerRecalculatePreview);
    pracaInput.addEventListener('input', triggerRecalculatePreview);
    presInput.addEventListener('input', triggerRecalculatePreview);
}

// ─── CRUD OPERAÇÕES VIA PHP ───
function openAddModal() {
    if (!isAdmin) return;
    document.getElementById('modal-action').value = 'add';
    document.getElementById('modal-edit-id').value = '';
    document.getElementById('person-modal-title').innerText = "Novo Cadastro de Militar";
    document.getElementById('field-id').value = ""; // Gerado automatico no banco
    document.getElementById('field-specialty').value = "";
    document.getElementById('field-secao').value = "";
    document.getElementById('field-prorrogacao').value = "";
    document.getElementById('field-personType').value = 'MILITAR';
    document.getElementById('field-isAdmin').checked = false;
    document.getElementById('person-modal').classList.add('active');
}

function editPerson(id) {
    const p = personnelData.find(item => item.id == id);
    if (!p) return;

    document.getElementById('modal-action').value = 'edit';
    document.getElementById('modal-edit-id').value = id;
    document.getElementById('person-modal-title').innerText = `Editar Ficha - ${p.rank} ${p.specialty || ''} ${p.name}`;

    // Popula campos
    document.getElementById('field-id').value = p.id;
    document.getElementById('field-personType').value = p.personType || 'MILITAR';
    document.getElementById('field-rank').value = p.rank;
    document.getElementById('field-specialty').value = p.specialty || '';
    document.getElementById('field-secao').value = p.secao || '';
    document.getElementById('field-name').value = p.name;
    document.getElementById('field-warName').value = p.warName || '';
    document.getElementById('field-identity').value = p.identity;
    document.getElementById('field-cpf').value = p.cpf;
    document.getElementById('field-saram').value = p.saram;
    document.getElementById('field-birthDate').value = p.birthDate;
    document.getElementById('field-age').value = p.age || '';
    document.getElementById('field-pracaDate').value = p.pracaDate;
    document.getElementById('field-lastPromotionDate').value = p.lastPromotionDate;
    document.getElementById('field-presentationDate').value = p.presentationDate;
    document.getElementById('field-healthInspectionDate').value = p.healthInspectionDate;
    document.getElementById('field-healthInspectionValidity').value = p.healthInspectionValidity;
    document.getElementById('field-prorrogacao').value = p.prorrogacaoDate || '';
    document.getElementById('field-serviceTime').value = p.serviceTime || '';
    document.getElementById('field-timeToReserve').value = p.timeToReserve !== null ? p.timeToReserve : '';
    document.getElementById('field-timeDtceaSj').value = p.timeDtceaSj || '';
    document.getElementById('field-observations').value = p.observations || '';
    document.getElementById('field-isAdmin').checked = p.is_admin === 1;

    document.getElementById('person-modal').classList.add('active');
}

async function savePerson() {
    const action = document.getElementById('modal-action').value;
    const editId = document.getElementById('modal-edit-id').value;

    const payload = {
        posto_grad: document.getElementById('field-rank').value.trim(),
        especialidade: document.getElementById('field-specialty').value.trim(),
        nome: document.getElementById('field-name').value.trim().toUpperCase(),
        nome_guerra: document.getElementById('field-warName').value.trim().toUpperCase(),
        identidade: document.getElementById('field-identity').value.trim(),
        cpf: document.getElementById('field-cpf').value.trim(),
        saram: document.getElementById('field-saram').value.trim(),
        secao: document.getElementById('field-secao').value.trim().toUpperCase(),
        nascimento: document.getElementById('field-birthDate').value.trim(),
        praca: document.getElementById('field-pracaDate').value.trim(),
        ult_promocao: document.getElementById('field-lastPromotionDate').value.trim(),
        apresentacao_dtcea: document.getElementById('field-presentationDate').value.trim(),
        data_insp_saude: document.getElementById('field-healthInspectionDate').value.trim(),
        validade_insp_saude: document.getElementById('field-healthInspectionValidity').value.trim(),
        prorrogacao: document.getElementById('field-prorrogacao').value.trim(),
        observacoes: document.getElementById('field-observations').value.trim(),
        is_admin: document.getElementById('field-isAdmin').checked ? 1 : 0,
        person_type: document.getElementById('field-personType').value
    };

    if (!payload.secao) {
        alert("A Seção é obrigatória. Por favor, selecione uma seção antes de salvar.");
        return;
    }

    if (action === 'edit') {
        payload.id = editId;
    }

    try {
        const response = await fetch('api.php?action=save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            await fetchPersonnel();
        } else {
            alert("Erro ao salvar: " + result.message);
        }
    } catch (e) {
        console.error(e);
        alert("Erro de comunicação ao salvar militar.");
    }
}

async function deletePerson(id) {
    const p = personnelData.find(item => item.id == id);
    if (!p) return;

    if (confirm(`Deseja realmente remover o militar ${p.rank} ${p.name} da base de dados?`)) {
        try {
            const response = await fetch('api.php?action=delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const result = await response.json();
            if (result.success) {
                await fetchPersonnel();
            } else {
                alert("Erro ao excluir: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de comunicação ao deletar militar.");
        }
    }
}

// ─── EXPORTAÇÃO CSV ───
function exportToCSV() {
    const headers = [
        "Posto/Grad.", "Especialidade", "Seção", "Nome", "Nome de Guerra", "Identidade", "CPF", "SARAM", "Nascimento", "Idade", "Praça", 
        "Últ. Promoção", "Apresentação no DTCEA", "Prorrogação", "Data Realização Insp. Saúde", "Validade Insp. Saúde",
        "Tempo de Serviço", "Tempo faltante para reserva", "Tempo DTCEA-SJ", "OBSERVAÇÕES"
    ];

    const rows = personnelData.map(p => {
        return [
            p.rank,
            p.specialty || '',
            p.secao || '',
            p.name,
            p.warName || '',
            p.identity,
            p.cpf,
            p.saram,
            p.birthDate,
            p.age || '',
            p.pracaDate,
            p.lastPromotionDate,
            p.presentationDate,
            p.prorrogacaoDate || '',
            p.healthInspectionDate,
            p.healthInspectionValidity,
            p.serviceTime || '',
            p.timeToReserve !== null ? p.timeToReserve : '',
            p.timeDtceaSj || '',
            p.observations || ''
        ];
    });

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
        const parsedRow = row.map(val => {
            let strVal = val === null || val === undefined ? '' : String(val);
            if (strVal.includes(',')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        });
        csvContent += parsedRow.join(",") + "\n";
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "dados_sgp_dtceasj.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Resetar banco de dados
async function resetDatabase() {
    if (confirm("ATENÇÃO: Isso irá redefinir e repovoar a base de dados MySQL com as informações originais do arquivo dados.csv. Suas alterações locais serão perdidas. Deseja prosseguir?")) {
        try {
            const response = await fetch('api.php?action=reset');
            const result = await response.json();
            if (result.success) {
                await fetchPersonnel();
                alert(result.message);
            } else {
                alert("Erro ao resetar banco: " + result.message);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de comunicação ao resetar base de dados.");
        }
    }
}

// ─── MÓDULO DE SEÇÕES ───
async function fetchSecoes() {
    try {
        const response = await fetch('api.php?action=list_secoes');
        const result = await response.json();
        if (result.success) {
            secoesData = result.data;
            populateSecoesDropdown();
        } else {
            console.error("Erro ao listar seções:", result.message);
        }
    } catch (e) {
        console.error("Erro na comunicação para listar seções:", e);
    }
}

function populateSecoesDropdown() {
    const select = document.getElementById('field-secao');
    if (!select) return;
    
    // Guarda o valor selecionado para restaurar após popular
    const currentVal = select.value;
    
    select.innerHTML = '<option value="" disabled selected>Selecione a seção</option>';
    secoesData.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.sigla;
        opt.innerText = s.sigla;
        select.appendChild(opt);
    });
    
    if (currentVal) {
        select.value = currentVal;
    }
}

function openSecoesModal() {
    renderSecoesTable();
    document.getElementById('secoes-modal').classList.add('active');
    
    // Adiciona listener de evento de submit do form se não tiver ainda
    const form = document.getElementById('secao-form');
    if (!form.hasAttribute('data-initialized')) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSecao();
        });
        form.setAttribute('data-initialized', 'true');
    }
}

function closeSecoesModal() {
    document.getElementById('secoes-modal').classList.remove('active');
    resetSecaoForm();
}

function resetSecaoForm() {
    document.getElementById('secao-id').value = '';
    document.getElementById('secao-sigla').value = '';
}

function renderSecoesTable() {
    const tbody = document.querySelector('#secoes-table tbody');
    tbody.innerHTML = '';
    
    if (secoesData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Nenhuma seção cadastrada</td></tr>';
        return;
    }
    
    secoesData.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">${s.sigla}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-secondary btn-sm" onclick="editSecao('${s.id}')" title="Editar"><i data-lucide="edit-3" style="width: 14px; height: 14px;"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteSecao('${s.id}')" title="Excluir"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function editSecao(id) {
    const s = secoesData.find(item => item.id == id);
    if (!s) return;
    
    document.getElementById('secao-id').value = s.id;
    document.getElementById('secao-sigla').value = s.sigla;
}

async function saveSecao() {
    const id = document.getElementById('secao-id').value;
    const sigla = document.getElementById('secao-sigla').value.trim();
    
    if (!sigla) return alert("A sigla é obrigatória.");
    
    try {
        const response = await fetch('api.php?action=save_secao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, sigla, nome: '', chefe_id: '' })
        });
        const result = await response.json();
        
        if (result.success) {
            resetSecaoForm();
            await fetchSecoes(); // atualiza os dados e o select de militares
            renderSecoesTable(); // renderiza a tabela na modal
        } else {
            alert("Erro: " + result.message);
        }
    } catch(e) {
        console.error(e);
        alert("Erro de comunicação ao salvar seção.");
    }
}

async function deleteSecao(id) {
    if (confirm("Tem certeza que deseja excluir esta seção?")) {
        try {
            const response = await fetch('api.php?action=delete_secao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const result = await response.json();
            
            if (result.success) {
                await fetchSecoes();
                renderSecoesTable();
            } else {
                alert("Erro: " + result.message);
            }
        } catch(e) {
            console.error(e);
            alert("Erro de comunicação ao excluir seção.");
        }
    }
}
