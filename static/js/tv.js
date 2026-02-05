let barChart = null;
let pieChart = null;
let wakeLock = null;

const COLORS = ['#4caf50', '#2196f3', '#f44336'];

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const el = $(id);
    if (!el) return;
    el.textContent = value;
}

function setStatus(ok, text) {
    const el = $('tv-status');
    if (!el) return;
    el.textContent = text;
    el.className = ok ? 'tv-pill ok' : 'tv-pill warn';
}

function tickClock() {
    const now = new Date();
    const s = now.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    setText('tv-clock', s);
}

async function tryWakeLock() {
    try {
        if (!('wakeLock' in navigator)) return;
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
            // pode acontecer ao mudar de tab
        });
    } catch (e) {
        // silencioso (nem todos suportam)
    }
}

async function fetchJSON(url) {
    const resp = await fetch(url, { cache: 'no-store' });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
    return data;
}

function ensureCharts(stats) {
    const labels = ['Muito Satisfeito', 'Satisfeito', 'Insatisfeito'];
    const values = [stats.muito_satisfeito || 0, stats.satisfeito || 0, stats.insatisfeito || 0];

    const barCtx = document.getElementById('tv-bar')?.getContext('2d');
    if (barCtx) {
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Feedbacks',
                    data: values,
                    backgroundColor: COLORS,
                    borderColor: COLORS,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    const pieCtx = document.getElementById('tv-pie')?.getContext('2d');
    if (pieCtx) {
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: COLORS,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
}

function renderToday(daily) {
    const ms = daily.muito_satisfeito || 0;
    const s = daily.satisfeito || 0;
    const i = daily.insatisfeito || 0;
    const total = ms + s + i;
    setText('kpi-today-total', String(total));
    setText('kpi-today-breakdown', `😊 ${ms} · 🙂 ${s} · 😞 ${i}`);
}

function renderSystem(sys) {
    setText('kpi-total', String(sys.total ?? '—'));
    setText('kpi-last-id', (sys.lastId === null || sys.lastId === undefined) ? '—' : String(sys.lastId));

    const fbOnline = !!sys?.firebase?.firestoreAvailable;
    setText('kpi-firebase', fbOnline ? 'Online' : 'Offline');
    setText('kpi-project', sys?.firebase?.projectId ? `Projeto: ${sys.firebase.projectId}` : '—');

    const dbPath = sys?.db?.path || 'feedback.db';
    const size = sys?.db?.sizeBytes;
    const sizeStr = (typeof size === 'number') ? formatBytes(size) : '—';
    setText('kpi-db', `${dbPath} · ${sizeStr}`);

    setStatus(true, `Atualizado: ${new Date(sys.time).toLocaleTimeString()}`);
}

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let b = bytes;
    let i = 0;
    while (b >= 1024 && i < units.length - 1) {
        b /= 1024;
        i++;
    }
    return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

async function refreshAll() {
    try {
        const [stats, daily, sys] = await Promise.all([
            fetchJSON('/api/admin/stats'),
            fetchJSON('/api/admin/stats/daily'),
            fetchJSON('/api/admin/system')
        ]);

        ensureCharts(stats);
        renderToday(daily);
        renderSystem(sys);
    } catch (e) {
        setStatus(false, `Erro: ${e.message}`);
    }
}

function setupActions() {
    const fsBtn = $('tv-fullscreen');
    const refreshBtn = $('tv-refresh');

    if (refreshBtn) refreshBtn.addEventListener('click', refreshAll);

    if (fsBtn) {
        const update = () => {
            const isFs = !!document.fullscreenElement;
            fsBtn.textContent = isFs ? '⤢' : '⛶';
        };
        document.addEventListener('fullscreenchange', update);
        update();

        fsBtn.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else {
                    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
                }
            } catch (e) {
                // ignore
            }
        });
    }

    // Atalhos
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') refreshAll();
        if (e.key === 'f' || e.key === 'F') fsBtn?.click();
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        tryWakeLock();
        refreshAll();
    }
});

// Init
setupActions();
tickClock();
setInterval(tickClock, 1000);
tryWakeLock();
refreshAll();
setInterval(refreshAll, 15000);
