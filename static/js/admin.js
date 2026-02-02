// Variáveis globais
let barChart = null;
let pieChart = null;
let currentPage = 1;

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Exportação TXT
    document.getElementById('export-txt').addEventListener('click', exportTXT);
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
        const response = await fetch(`/api/admin/historico?page=${page}&per_page=50`);
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
