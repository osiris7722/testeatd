// Variáveis globais
let barChart = null;
let pieChart = null;
let comparisonChart = null;
let currentPage = 1;
let historyFilters = {
    q: '',
    grau: '',
    data_inicio: '',
    data_fim: ''
};

let autoRefreshTimer = null;

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadSystemInfo();
    loadGeneralStats();
    loadDailyStats();
    loadHistory();
    loadAvailableDates();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Botão "Hoje"
    document.getElementById('btn-hoje').addEventListener('click', () => {
        loadDailyStats();
        document.getElementById('btn-hoje').classList.add('active');
    });
    
    // Select de data
    document.getElementById('date-select').addEventListener('change', (e) => {
        if (e.target.value) {
            loadDailyStats(e.target.value);
            document.getElementById('btn-hoje').classList.remove('active');
        }
    });
    
    // Exportação CSV
    document.getElementById('export-csv').addEventListener('click', exportCSV);

    // Exportação CSV (texto)
    const csvPlainBtn = document.getElementById('export-csv-plain');
    if (csvPlainBtn) csvPlainBtn.addEventListener('click', exportCSVPlain);
    
    // Exportação TXT
    document.getElementById('export-txt').addEventListener('click', exportTXT);
    
    // Comparação de períodos
    document.getElementById('btn-comparar').addEventListener('click', comparePeriodsClick);

    // Sistema
    const btnRefreshSystem = document.getElementById('btn-refresh-system');
    if (btnRefreshSystem) btnRefreshSystem.addEventListener('click', loadSystemInfo);

    const autoRefresh = document.getElementById('auto-refresh');
    if (autoRefresh) {
        autoRefresh.addEventListener('change', (e) => {
            if (e.target.checked) {
                autoRefreshTimer = setInterval(() => {
                    loadSystemInfo();
                    loadGeneralStats();
                    loadDailyStats();
                    loadHistory(currentPage);
                }, 30000);
            } else {
                if (autoRefreshTimer) clearInterval(autoRefreshTimer);
                autoRefreshTimer = null;
            }
        });
    }

    // Filtros do histórico
    const applyBtn = document.getElementById('history-apply');
    const clearBtn = document.getElementById('history-clear');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            historyFilters.q = (document.getElementById('history-search-id')?.value || '').trim();
            historyFilters.grau = (document.getElementById('history-filter-grau')?.value || '').trim();
            historyFilters.data_inicio = (document.getElementById('history-date-inicio')?.value || '').trim();
            historyFilters.data_fim = (document.getElementById('history-date-fim')?.value || '').trim();
            loadHistory(1);
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const idEl = document.getElementById('history-search-id');
            const grauEl = document.getElementById('history-filter-grau');
            const diEl = document.getElementById('history-date-inicio');
            const dfEl = document.getElementById('history-date-fim');
            if (idEl) idEl.value = '';
            if (grauEl) grauEl.value = '';
            if (diEl) diEl.value = '';
            if (dfEl) dfEl.value = '';
            historyFilters = { q: '', grau: '', data_inicio: '', data_fim: '' };
            loadHistory(1);
        });
    }
}

async function loadSystemInfo() {
    try {
        const resp = await fetch('/api/admin/system', { cache: 'no-store' });
        const data = await resp.json();
        if (!resp.ok) return;

        const timeEl = document.getElementById('sys-time');
        const pyEl = document.getElementById('sys-python');
        const totalEl = document.getElementById('sys-total');
        const dbEl = document.getElementById('sys-db');
        const fbEl = document.getElementById('sys-firebase');
        const projEl = document.getElementById('sys-project');
        const lastIdEl = document.getElementById('sys-last-id');

        if (timeEl) timeEl.textContent = new Date(data.time).toLocaleString();
        if (pyEl) pyEl.textContent = `Python ${data.python}`;
        if (totalEl) totalEl.textContent = String(data.total ?? '—');

        if (dbEl) {
            const size = data?.db?.sizeBytes;
            const sizeStr = (typeof size === 'number') ? formatBytes(size) : '—';
            dbEl.textContent = `${data?.db?.path || ''} · ${sizeStr}`.trim();
        }

        if (fbEl) fbEl.textContent = data?.firebase?.firestoreAvailable ? 'Online' : 'Offline';
        if (projEl) projEl.textContent = data?.firebase?.projectId ? `Projeto: ${data.firebase.projectId}` : '—';
        if (lastIdEl) lastIdEl.textContent = (data.lastId === null || data.lastId === undefined) ? '—' : String(data.lastId);
    } catch (e) {
        console.error('Erro ao carregar sistema:', e);
    }
}

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let b = bytes;
    let i = 0;
    while (b >= 1024 && i < units.length - 1) {
        b /= 1024;
        i++;
    }
    return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Carregar estatísticas gerais
async function loadGeneralStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        // Atualizar cards
        document.getElementById('total-muito-satisfeito').textContent = data.muito_satisfeito;
        document.getElementById('percent-muito-satisfeito').textContent = data.percentagens.muito_satisfeito + '%';
        
        document.getElementById('total-satisfeito').textContent = data.satisfeito;
        document.getElementById('percent-satisfeito').textContent = data.percentagens.satisfeito + '%';
        
        document.getElementById('total-insatisfeito').textContent = data.insatisfeito;
        document.getElementById('percent-insatisfeito').textContent = data.percentagens.insatisfeito + '%';
        
        document.getElementById('total-geral').textContent = data.total;
        
        // Criar gráficos
        createCharts(data);
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Criar gráficos
function createCharts(data) {
    const labels = ['Muito Satisfeito', 'Satisfeito', 'Insatisfeito'];
    const values = [data.muito_satisfeito, data.satisfeito, data.insatisfeito];
    const colors = ['#4caf50', '#2196f3', '#f44336'];
    
    // Gráfico de Barras
    const barCtx = document.getElementById('barChart').getContext('2d');
    
    if (barChart) {
        barChart.destroy();
    }
    
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Feedbacks',
                data: values,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // Gráfico Circular
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChart) {
        pieChart.destroy();
    }
    
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Carregar estatísticas diárias
async function loadDailyStats(date = null) {
    try {
        const url = date ? `/api/admin/stats/daily?data=${date}` : '/api/admin/stats/daily';
        const response = await fetch(url);
        const data = await response.json();
        
        const statsContainer = document.getElementById('temporal-stats');
        statsContainer.innerHTML = `
            <div class="temporal-stat-item">
                <h4>😊 Muito Satisfeito</h4>
                <p>${data.muito_satisfeito}</p>
            </div>
            <div class="temporal-stat-item">
                <h4>🙂 Satisfeito</h4>
                <p>${data.satisfeito}</p>
            </div>
            <div class="temporal-stat-item">
                <h4>😞 Insatisfeito</h4>
                <p>${data.insatisfeito}</p>
            </div>
            <div class="temporal-stat-item">
                <h4>📊 Total do Dia</h4>
                <p>${data.muito_satisfeito + data.satisfeito + data.insatisfeito}</p>
            </div>
        `;
    } catch (error) {
        console.error('Erro ao carregar estatísticas diárias:', error);
    }
}

// Carregar datas disponíveis
async function loadAvailableDates() {
    try {
        const response = await fetch('/api/admin/dates');
        const dates = await response.json();
        
        const select = document.getElementById('date-select');
        select.innerHTML = '<option value="">Selecione uma data</option>';
        
        dates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = formatDate(date);
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar datas:', error);
    }
}

// Carregar histórico
async function loadHistory(page = 1) {
    try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('per_page', '50');
        if (historyFilters.q) params.set('q', historyFilters.q);
        if (historyFilters.grau) params.set('grau', historyFilters.grau);
        if (historyFilters.data_inicio) params.set('data_inicio', historyFilters.data_inicio);
        if (historyFilters.data_fim) params.set('data_fim', historyFilters.data_fim);

        const response = await fetch(`/api/admin/historico?${params.toString()}`);
        const data = await response.json();
        
        const tbody = document.getElementById('history-tbody');
        
        if (data.registros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        Nenhum registro encontrado
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = data.registros.map(reg => {
            const satisfactionMap = {
                'muito_satisfeito': 'Muito Satisfeito',
                'satisfeito': 'Satisfeito',
                'insatisfeito': 'Insatisfeito'
            };
            
            return `
                <tr>
                    <td>${reg.id}</td>
                    <td>
                        <span class="satisfaction-badge ${reg.grau_satisfacao}">
                            ${satisfactionMap[reg.grau_satisfacao]}
                        </span>
                    </td>
                    <td>${formatDate(reg.data)}</td>
                    <td>${reg.hora}</td>
                    <td>${reg.dia_semana}</td>
                </tr>
            `;
        }).join('');
        
        // Atualizar paginação
        updatePagination(data);
        currentPage = page;
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

function exportCSVPlain() {
    // CSV real
    const dataInicio = document.getElementById('export-date-inicio').value;
    const dataFim = document.getElementById('export-date-fim').value;
    let url = '/api/admin/export/csv-plain';
    if (dataInicio && dataFim) {
        url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    }
    window.location.href = url;
}

// Atualizar paginação
function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    
    pagination.innerHTML = `
        <button ${data.page <= 1 ? 'disabled' : ''} onclick="loadHistory(${data.page - 1})">
            ← Anterior
        </button>
        <span>Página ${data.page} de ${data.total_pages}</span>
        <button ${data.page >= data.total_pages ? 'disabled' : ''} onclick="loadHistory(${data.page + 1})">
            Próxima →
        </button>
    `;
}

// Exportar CSV
function exportCSV() {
    const dataInicio = document.getElementById('export-date-inicio').value;
    const dataFim = document.getElementById('export-date-fim').value;
    
    let url = '/api/admin/export/csv';
    
    if (dataInicio && dataFim) {
        url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    }
    
    window.location.href = url;
}

// Exportar TXT
function exportTXT() {
    const dataInicio = document.getElementById('export-date-inicio').value;
    const dataFim = document.getElementById('export-date-fim').value;
    
    let url = '/api/admin/export/txt';
    
    if (dataInicio && dataFim) {
        url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    }
    
    window.location.href = url;
}

// Comparar períodos
async function comparePeriodsClick() {
    const data1Inicio = document.getElementById('comp-data1-inicio').value;
    const data1Fim = document.getElementById('comp-data1-fim').value;
    const data2Inicio = document.getElementById('comp-data2-inicio').value;
    const data2Fim = document.getElementById('comp-data2-fim').value;
    
    if (!data1Inicio || !data1Fim || !data2Inicio || !data2Fim) {
        alert('Por favor, preencha todas as datas!');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/admin/stats/comparison?data1_inicio=${data1Inicio}&data1_fim=${data1Fim}&data2_inicio=${data2Inicio}&data2_fim=${data2Fim}`
        );
        const data = await response.json();
        
        if (!response.ok) {
            alert('Erro ao comparar períodos');
            return;
        }
        
        displayComparisonResults(data);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados de comparação');
    }
}

function displayComparisonResults(data) {
    // Mostrar resultados
    document.getElementById('comparison-results').style.display = 'block';
    
    // Período 1
    document.getElementById('comp-ms-p1').textContent = data.periodo1.muito_satisfeito;
    document.getElementById('comp-s-p1').textContent = data.periodo1.satisfeito;
    document.getElementById('comp-i-p1').textContent = data.periodo1.insatisfeito;
    
    // Período 2
    document.getElementById('comp-ms-p2').textContent = data.periodo2.muito_satisfeito;
    document.getElementById('comp-s-p2').textContent = data.periodo2.satisfeito;
    document.getElementById('comp-i-p2').textContent = data.periodo2.insatisfeito;
    
    // Variações
    updateVariationDisplay('comp-ms-var', data.variacao.muito_satisfeito);
    updateVariationDisplay('comp-s-var', data.variacao.satisfeito);
    updateVariationDisplay('comp-i-var', data.variacao.insatisfeito);
    
    // Gráfico comparativo
    createComparisonChart(data);
    
    // Scroll para resultados
    document.getElementById('comparison-results').scrollIntoView({ behavior: 'smooth' });
}

function updateVariationDisplay(elementId, variacao) {
    const element = document.getElementById(elementId);
    let className = 'neutral';
    let sinal = '';
    
    if (variacao > 0) {
        className = 'positive';
        sinal = '↑ ';
    } else if (variacao < 0) {
        className = 'negative';
        sinal = '↓ ';
    }
    
    element.className = `comp-value variation ${className}`;
    element.innerHTML = `${sinal}${Math.abs(variacao)}% de variação`;
}

function createComparisonChart(data) {
    const labels = ['Muito Satisfeito', 'Satisfeito', 'Insatisfeito'];
    const periodo1 = [
        data.periodo1.muito_satisfeito,
        data.periodo1.satisfeito,
        data.periodo1.insatisfeito
    ];
    const periodo2 = [
        data.periodo2.muito_satisfeito,
        data.periodo2.satisfeito,
        data.periodo2.insatisfeito
    ];
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Período 1',
                    data: periodo1,
                    backgroundColor: '#4472C4',
                    borderColor: '#4472C4',
                    borderWidth: 2
                },
                {
                    label: 'Período 2',
                    data: periodo2,
                    backgroundColor: '#70AD47',
                    borderColor: '#70AD47',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Formatar data
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Auto-refresh a cada 30 segundos
setInterval(() => {
    loadGeneralStats();
    loadDailyStats();
    loadHistory(currentPage);
}, 30000);
