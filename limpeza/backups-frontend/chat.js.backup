// ========================================
// CHAT.JS - SCOPSY CHAT LOGIC
// ========================================

// Estado global
const state = {
    currentAssistant: 'orchestrator',
    socket: null,
    token: null,
    user: null,
    isTyping: false,
    messageHistory: []
};

// Mapa de informações dos assistentes
const assistantsInfo = {
    orchestrator: {
        name: 'Orchestrator',
        description: 'Navegação e ajuda geral',
        icon: '🎯',
        welcome: 'Olá! Sou o Orchestrator. Como posso ajudar você hoje?'
    },
    case: {
        name: 'Case Generator',
        description: 'Geração de casos clínicos realistas',
        icon: '📋',
        welcome: 'Olá! Vou te ajudar a criar casos clínicos. Sobre qual transtorno você quer trabalhar?'
    },
    diagnostic: {
        name: 'Diagnostic Training',
        description: 'Treino de diagnóstico DSM-5',
        icon: '🔍',
        welcome: 'Bem-vindo ao treino diagnóstico! Vamos praticar identificação de transtornos. Pronto para começar?'
    },
    journey: {
        name: 'Clinical Journey',
        description: 'Acompanhamento longitudinal',
        icon: '🗺️',
        welcome: 'Olá! Vou te guiar em uma jornada clínica completa. Qual abordagem você quer usar? (CBT, ACT, DBT)'
    },
    generator: {
        name: 'Content Generator',
        description: 'Materiais terapêuticos',
        icon: '✨',
        welcome: 'Olá! Vou criar materiais terapêuticos para você. Que tipo de material precisa?'
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
        window.location.href = '/login.html';
        return;
    }

    // Carregar dados do usuário
    await loadUserData();

    // Inicializar Socket.io
    initializeSocket();

    // Event listeners
    setupEventListeners();

    console.log('✅ Chat inicializado com sucesso!');
});

// ========================================
// CARREGAR DADOS DO USUÁRIO
// ========================================

async function loadUserData() {
    try {
        console.log('📡 Carregando dados do usuário...');
        const response = await fetch('http://localhost:3000/api/auth/me', {
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
        document.getElementById('userName').textContent = state.user.name || state.user.email;
        
        console.log('✅ Dados do usuário carregados:', state.user);
    } catch (error) {
        console.error('❌ Erro ao carregar usuário:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// ========================================
// SOCKET.IO INITIALIZATION
// ========================================

function initializeSocket() {
    console.log('🔌 Conectando Socket.io...');

    // Conectar ao servidor
    state.socket = io('http://localhost:3000', {
        auth: {
            token: state.token
        },
        transports: ['websocket', 'polling']
    });

    // Event: Conectado
    state.socket.on('connect', () => {
        console.log('✅ Socket conectado:', state.socket.id);
        updateConnectionStatus(true);
    });

    // Event: Desconectado
    state.socket.on('disconnect', () => {
        console.log('❌ Socket desconectado');
        updateConnectionStatus(false);
    });

    // Event: Erro de conexão
    state.socket.on('connect_error', (error) => {
        console.error('❌ Erro de conexão:', error);
        updateConnectionStatus(false);
    });

    // Event: Nova mensagem do assistente
    state.socket.on('assistant_message', (data) => {
        console.log('📨 Mensagem recebida:', data);
        hideTypingIndicator();
        addMessage('assistant', data.message, data.assistant || state.currentAssistant);
    });

    // Event: Assistente digitando
    state.socket.on('assistant_typing', () => {
        console.log('⌨️ Assistente digitando...');
        showTypingIndicator();
    });

    // Event: Erro
    state.socket.on('error', (data) => {
        console.error('❌ Erro do servidor:', data);
        hideTypingIndicator();
        showError(data.message || 'Erro ao processar mensagem');
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Formulário de envio
    const chatForm = document.getElementById('chatForm');
    chatForm.addEventListener('submit', handleSubmit);

    // Textarea - Enter para enviar (Shift+Enter para nova linha)
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    });

    // Contador de caracteres
    messageInput.addEventListener('input', updateCharCount);

    // Botões de assistentes
    const assistantButtons = document.querySelectorAll('.assistant-btn');
    assistantButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const assistant = btn.dataset.assistant;
            switchAssistant(assistant);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', handleLogout);
}

// ========================================
// ENVIAR MENSAGEM
// ========================================

async function handleSubmit(e) {
    e.preventDefault();

    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    if (state.isTyping) {
        console.log('⏳ Aguarde a resposta anterior...');
        return;
    }

    console.log('📤 Enviando mensagem:', message);

    // Adicionar mensagem do usuário
    addMessage('user', message);

    // Limpar input
    messageInput.value = '';
    updateCharCount();

    // Desabilitar botão
    state.isTyping = true;
    updateSendButton(false);

    // Mostrar indicador de digitação
    showTypingIndicator();

    try {
        // Enviar via HTTP (mais confiável que Socket.io para mensagens)
        const response = await fetch('http://localhost:3000/api/chat/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
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

        // Esconder indicador
        hideTypingIndicator();

        // Adicionar resposta do assistente
        addMessage('assistant', data.response, data.assistantUsed || state.currentAssistant);

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        hideTypingIndicator();
        showError(error.message || 'Erro ao processar mensagem');
    } finally {
        state.isTyping = false;
        updateSendButton(true);
    }
}

// ========================================
// ADICIONAR MENSAGEM À UI
// ========================================

function addMessage(type, content, assistant = null) {
    const container = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    if (type === 'assistant') {
        const assistantData = assistantsInfo[assistant] || assistantsInfo[state.currentAssistant];
        avatar.textContent = assistantData.icon;
    } else {
        avatar.textContent = '👤';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const strong = document.createElement('strong');
    if (type === 'assistant') {
        const assistantData = assistantsInfo[assistant] || assistantsInfo[state.currentAssistant];
        strong.textContent = assistantData.name;
    } else {
        strong.textContent = 'Você';
    }

    const p = document.createElement('p');
    p.textContent = content;

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    contentDiv.appendChild(strong);
    contentDiv.appendChild(p);
    contentDiv.appendChild(time);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    container.appendChild(messageDiv);

    // Scroll para o final
    scrollToBottom();

    // Salvar no histórico
    state.messageHistory.push({
        type,
        content,
        assistant,
        timestamp: new Date().toISOString()
    });
}

// ========================================
// TROCAR ASSISTENTE
// ========================================

function switchAssistant(assistant) {
    if (assistant === state.currentAssistant) {
        return;
    }

    console.log(`🔄 Trocando para assistente: ${assistant}`);

    // Atualizar estado
    state.currentAssistant = assistant;

    // Atualizar UI dos botões
    document.querySelectorAll('.assistant-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.assistant === assistant) {
            btn.classList.add('active');
        }
    });

    // Atualizar info do assistente atual
    const assistantData = assistantsInfo[assistant];
    document.getElementById('currentAssistantName').textContent = assistantData.name;
    document.getElementById('currentAssistantDesc').textContent = assistantData.description;

    // Adicionar mensagem de boas-vindas
    addMessage('assistant', assistantData.welcome, assistant);
}

// ========================================
// INDICADOR DE DIGITAÇÃO
// ========================================

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'flex';
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    indicator.style.display = 'none';
}

// ========================================
// HELPERS
// ========================================

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function updateCharCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.getElementById('charCount');
    const count = messageInput.value.length;
    charCount.textContent = `${count}/2000`;
}

function updateSendButton(enabled) {
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = !enabled;
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (connected) {
        statusElement.innerHTML = '<span class="status-dot"></span> Conectado';
        statusElement.classList.remove('disconnected');
    } else {
        statusElement.innerHTML = '<span class="status-dot"></span> Desconectado';
        statusElement.classList.add('disconnected');
    }
}

function showError(message) {
    addMessage('assistant', `❌ Erro: ${message}`, state.currentAssistant);
}

function handleLogout() {
    console.log('👋 Fazendo logout...');
    
    // Desconectar socket
    if (state.socket) {
        state.socket.disconnect();
    }

    // Limpar storage
    localStorage.removeItem('token');
    
    // Redirecionar
    window.location.href = '/login.html';
}

// ========================================
// EXPORT (para debug no console)
// ========================================

window.chatDebug = {
    state,
    assistantsInfo,
    addMessage,
    switchAssistant
};

console.log('💡 Debug disponível: window.chatDebug');