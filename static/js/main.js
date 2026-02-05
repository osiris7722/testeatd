// Controle de timeout para evitar múltiplos cliques
let canClick = true;
const TIMEOUT_DURATION = 3000; // 3 segundos

// Selecionar todos os botões de feedback
const feedbackButtons = document.querySelectorAll('.feedback-btn');
const feedbackMessage = document.getElementById('feedback-message');
const statusPill = document.getElementById('status-pill');
const themeToggle = document.getElementById('theme-toggle');
const soundToggle = document.getElementById('sound-toggle');
const fullscreenToggle = document.getElementById('fullscreen-toggle');

const sumToday = document.getElementById('sum-today');
const sumTodayBreakdown = document.getElementById('sum-today-breakdown');
const sumTotal = document.getElementById('sum-total');
const sumLastId = document.getElementById('sum-last-id');
const sumFirebase = document.getElementById('sum-firebase');

const QUEUE_KEY = 'feedback_queue_v1';
const SOUND_KEY = 'sound_enabled_v1';

// Tema (claro/escuro)
(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.dataset.theme = saved;
    if (!themeToggle) return;

    const setIcon = () => {
        themeToggle.textContent = (document.documentElement.dataset.theme === 'dark') ? '☀️' : '🌙';
    };

    setIcon();
    themeToggle.addEventListener('click', () => {
        const next = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
        setIcon();
    });
})();

// Som (opcional)
(() => {
    if (!soundToggle) return;
    const saved = localStorage.getItem(SOUND_KEY);
    const enabled = saved === null ? true : saved === '1';
    const setIcon = (on) => soundToggle.textContent = on ? '🔈' : '🔇';
    setIcon(enabled);
    soundToggle.addEventListener('click', () => {
        const current = (localStorage.getItem(SOUND_KEY) === null) ? true : (localStorage.getItem(SOUND_KEY) === '1');
        const next = !current;
        localStorage.setItem(SOUND_KEY, next ? '1' : '0');
        setIcon(next);
        if (next) beep(880, 0.05);
    });
})();

// Fullscreen (kiosk)
(() => {
    if (!fullscreenToggle) return;
    const update = () => {
        const isFs = !!document.fullscreenElement;
        fullscreenToggle.textContent = isFs ? '⤢' : '⛶';
    };
    update();
    document.addEventListener('fullscreenchange', update);
    fullscreenToggle.addEventListener('click', async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
            }
        } catch (e) {
            // Ignorar (alguns browsers bloqueiam sem gesto)
        }
    });
})();

function soundEnabled() {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved === null ? true : saved === '1';
}

function beep(freq = 660, duration = 0.06) {
    if (!soundEnabled()) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        setTimeout(() => {
            o.stop();
            ctx.close().catch(() => {});
        }, Math.max(10, duration * 1000));
    } catch (e) {
        // sem som
    }
}

function vibrate(ms = 30) {
    try {
        if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
}

function loadQueue() {
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function saveQueue(queue) {
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue || []));
    } catch (e) {}
}

function enqueueFeedback(grau_satisfacao) {
    const queue = loadQueue();
    queue.push({ grau_satisfacao, createdAt: new Date().toISOString() });
    saveQueue(queue);
    updateOnlineStatus();
}

let flushing = false;
async function flushQueue() {
    if (flushing) return;
    if (!navigator.onLine) return;
    const queue = loadQueue();
    if (!queue.length) return;

    flushing = true;
    try {
        while (queue.length) {
            const item = queue[0];
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ grau_satisfacao: item.grau_satisfacao })
            });
            if (!response.ok) {
                // para e tenta mais tarde
                break;
            }
            queue.shift();
            saveQueue(queue);
            updateOnlineStatus();
            await fetchSummary();
        }
    } catch (e) {
        // ignora
    } finally {
        flushing = false;
    }
}

async function fetchSummary() {
    if (!sumToday && !sumTotal && !sumLastId && !sumFirebase) return;
    try {
        const resp = await fetch('/api/public/summary', { cache: 'no-store' });
        const data = await resp.json();
        if (!resp.ok) return;

        if (sumToday) sumToday.textContent = String(data.todayTotal ?? '—');
        if (sumTotal) sumTotal.textContent = String(data.total ?? '—');
        if (sumLastId) sumLastId.textContent = (data.lastId === null || data.lastId === undefined) ? '—' : String(data.lastId);
        if (sumFirebase) sumFirebase.textContent = data.firebaseAvailable ? 'Online' : 'Offline';

        if (sumTodayBreakdown && data.today) {
            const ms = data.today.muito_satisfeito ?? 0;
            const s = data.today.satisfeito ?? 0;
            const i = data.today.insatisfeito ?? 0;
            sumTodayBreakdown.textContent = `😊 ${ms}  ·  🙂 ${s}  ·  😞 ${i}`;
        }
    } catch (e) {
        // ignora
    }
}

// Estado online/offline
function updateOnlineStatus() {
    if (!statusPill) return;
    const online = navigator.onLine;
    const pending = loadQueue().length;
    if (online) {
        statusPill.textContent = pending ? `Online · ${pending} pendente(s)` : 'Online';
        statusPill.className = 'status-pill online';
    } else {
        statusPill.textContent = pending ? `Offline · ${pending} pendente(s)` : 'Offline (sem internet)';
        statusPill.className = 'status-pill offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

window.addEventListener('online', () => {
    flushQueue();
    fetchSummary();
});

// Carregar resumo ao iniciar e periodicamente
fetchSummary();
setInterval(fetchSummary, 30000);

// Adicionar event listeners aos botões
feedbackButtons.forEach(button => {
    button.addEventListener('click', handleFeedbackClick);
});

async function handleFeedbackClick(event) {
    // Verificar se pode clicar
    if (!canClick) {
        return;
    }
    
    const button = event.currentTarget;
    const feedbackType = button.getAttribute('data-feedback');
    
    // Desabilitar cliques temporariamente
    disableButtons();
    
    try {
        showMessage('A enviar…', 'loading');

        if (!navigator.onLine) {
            enqueueFeedback(feedbackType);
            showMessage('Sem internet: guardado e será enviado automaticamente.', 'success');
            beep(520, 0.06);
            vibrate(20);
            return;
        }

        // Enviar feedback para o servidor
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grau_satisfacao: feedbackType
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar mensagem de sucesso
            const msg = data.message || 'Feedback registado com sucesso!';
            const withId = (data && data.id) ? `${msg} (ID: ${data.id})` : msg;
            showMessage(withId, 'success');
            beep(880, 0.06);
            vibrate(25);
            fetchSummary();

            // Animação de sucesso no botão
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = '';
            }, 300);
        } else {
            // Mostrar mensagem de erro
            const errMsg = (data && data.error) ? data.error : 'Erro ao registar feedback. Tente novamente.';
            showMessage(errMsg, 'error');
            beep(220, 0.08);
            vibrate(40);
        }
    } catch (error) {
        console.error('Erro:', error);
        enqueueFeedback(feedbackType);
        showMessage('Falha de conexão: guardado e será enviado automaticamente.', 'success');
        beep(520, 0.06);
        vibrate(20);
    } finally {
        // Reabilitar botões após o timeout
        setTimeout(() => {
            enableButtons();
            hideMessage();
        }, TIMEOUT_DURATION);
    }
}

function disableButtons() {
    canClick = false;
    feedbackButtons.forEach(button => {
        button.classList.add('disabled');
    });
}

function enableButtons() {
    canClick = true;
    feedbackButtons.forEach(button => {
        button.classList.remove('disabled');
    });
}

function showMessage(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback-message show ${type}`;
}

function hideMessage() {
    feedbackMessage.classList.remove('show');
    setTimeout(() => {
        feedbackMessage.textContent = '';
        feedbackMessage.className = 'feedback-message';
    }, 300);
}
