// Controle de timeout para evitar múltiplos cliques
let canClick = true;
const TIMEOUT_DURATION = 3000; // 3 segundos

// Selecionar todos os botões de feedback
const feedbackButtons = document.querySelectorAll('.feedback-btn');
const feedbackMessage = document.getElementById('feedback-message');

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
            showMessage(data.message, 'success');
            
            // Animação de sucesso no botão
            button.style.transform = 'scale(1.1)';
            setTimeout(() => {
                button.style.transform = '';
            }, 300);
        } else {
            // Mostrar mensagem de erro
            showMessage('Erro ao registrar feedback. Tente novamente.', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro de conexão. Tente novamente.', 'error');
    }
    
    // Reabilitar botões após o timeout
    setTimeout(() => {
        enableButtons();
        hideMessage();
    }, TIMEOUT_DURATION);
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
