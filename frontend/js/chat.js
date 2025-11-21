// ========================================
// CHAT.JS - SCOPSY CHAT (REST API)
// ========================================

const API_URL = 'http://localhost:3000';

// Estado global
const state = {
    currentAssistant: 'case', // Iniciar com Case
    token: null,
    user: null,
    isTyping: false,
    messageHistory: []
};

// Mapa de informações dos assistentes
const assistantsInfo = {
    case: {
        name: 'Treino de Olhar Clínico',
        description: 'Casos clínicos com feedback formativo',
        icon: '🎯',
        welcome: 'Olá! Pronto para treinar seu olhar clínico? Posso gerar casos de qualquer transtorno do DSM-5.'
    },
    diagnostic: {
        name: 'Diagnostic Training',
        description: 'Treino de diagnóstico DSM-5-TR',
        icon: '🎲',
        welcome: 'Bem-vindo ao treino diagnóstico! Vamos praticar identificação de transtornos. Pronto para começar?'
    },
    journey: {
        name: 'Clinical Journey',
        description: 'Jornada de 12 sessões',
        icon: '🗺️',
        welcome: 'Olá! Vou te guiar em uma jornada clínica completa. Qual abordagem você quer usar? (CBT, ACT, DBT)'
    }
};

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Chat inicializando...');

    // Verificar autenticação
    state.token = localStorage.getItem('token');
    if (!state.token) {
        console.log('❌ Token não encontrado, redirecionando...');
        window.location.href = 'login.html';
        return;
    }

    // Carregar dados do usuário
    await loadUserData();

    // Event listeners
    setupEventListeners();

    // Mostrar mensagem de boas-vindas
    showWelcomeMessage();

    console.log('✅ Chat inicializado com sucesso!');
});

// ========================================
// CARREGAR DADOS DO USUÁRIO
// ========================================

async function loadUserData() {
    try {
        console.log('📡 Carregando dados do usuário...');
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao carregar dados');
        }

        const data = await response.json();
        state.user = data.user;

        // Atualizar UI
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = state.user.name || state.user.email;
        }

        console.log('✅ Dados do usuário carregados:', state.user);
    } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Formulário de envio
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleSubmit);
    }

    // Enter no textarea (sem Shift)
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        });
    }

    // Botões de assistentes
    const assistantButtons = document.querySelectorAll('.assistant-btn');
    assistantButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const assistantType = btn.getAttribute('data-assistant');
            switchAssistant(assistantType);
        });
    });

    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ========================================
// ENVIAR MENSAGEM
// ========================================

async function handleSubmit(e) {
    e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) return;

    // Limpar input
    messageInput.value = '';

    // Adicionar mensagem do usuário
    addMessage('user', message);

    // Mostrar "digitando..."
    showTypingIndicator();

    try {
        console.log(`📤 Enviando para ${state.currentAssistant}:`, message);

        const response = await fetch(`${API_URL}/api/chat/message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                assistantType: state.currentAssistant
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao enviar mensagem');
        }

        const data = await response.json();
        
        console.log('✅ Resposta recebida:', data);

        // Esconder "digitando..."
        hideTypingIndicator();

        // Adicionar resposta do assistente
        addMessage('assistant', data.response);

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        
        hideTypingIndicator();
        
        addMessage('system', `Erro: ${error.message}`);
    }
}

// ========================================
// ADICIONAR MENSAGEM
// ========================================

function addMessage(role, content, assistant = state.currentAssistant) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    let avatar = '👤';
    let senderName = 'Você';

    if (role === 'assistant') {
        avatar = assistantsInfo[assistant]?.icon || '🤖';
        senderName = assistantsInfo[assistant]?.name || 'Assistente';
    } else if (role === 'system') {
        avatar = '⚠️';
        senderName = 'Sistema';
    }

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <strong>${senderName}</strong>
            <p>${formatMessage(content)}</p>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);

    // Scroll automático
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Salvar no histórico
    state.messageHistory.push({
        role,
        content,
        assistant,
        timestamp: new Date().toISOString()
    });
}

// ========================================
// FORMATAR MENSAGEM
// ========================================

function formatMessage(text) {
    // Quebras de linha
    let formatted = text.replace(/\n/g, '<br>');

    // Bold **texto**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Itálico *texto*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return formatted;
}

// ========================================
// INDICADOR DE DIGITAÇÃO
// ========================================

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        state.isTyping = true;
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
        state.isTyping = false;
    }
}

// ========================================
// TROCAR ASSISTENTE
// ========================================

function switchAssistant(assistantType) {
    console.log(`🔄 Trocando para assistente: ${assistantType}`);

    state.currentAssistant = assistantType;

    // Atualizar botões
    document.querySelectorAll('.assistant-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-assistant') === assistantType) {
            btn.classList.add('active');
        }
    });

    // Atualizar informações
    const info = assistantsInfo[assistantType];
    
    const nameElement = document.getElementById('currentAssistantName');
    if (nameElement) {
        nameElement.textContent = info.name;
    }

    const descElement = document.getElementById('currentAssistantDesc');
    if (descElement) {
        descElement.textContent = info.description;
    }

    // Limpar mensagens e mostrar boas-vindas
    clearMessages();
    showWelcomeMessage();
}

// ========================================
// MENSAGEM DE BOAS-VINDAS
// ========================================

function showWelcomeMessage() {
    const info = assistantsInfo[state.currentAssistant];
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = `
        <div class="message assistant-message">
            <div class="message-avatar">${info.icon}</div>
            <div class="message-content">
                <strong>${info.name}</strong>
                <p>${info.welcome}</p>
                <span class="message-time">Agora</span>
            </div>
        </div>
    `;
}

// ========================================
// LIMPAR MENSAGENS
// ========================================

function clearMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
    }
    state.messageHistory = [];
}

// ========================================
// UTILIDADES
// ========================================

function getCurrentTime() {
    return new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function handleLogout() {
    console.log('👋 Fazendo logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ========================================
// EXPORTAR (para debug no console)
// ========================================

window.chatDebug = {
    state,
    sendTestMessage: (msg) => {
        document.getElementById('messageInput').value = msg;
        handleSubmit(new Event('submit'));
    },
    switchTo: (assistant) => switchAssistant(assistant),
    clearChat: clearMessages
};