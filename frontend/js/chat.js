// ========================================
// CHAT.JS - SCOPSY CHAT (REST API)
// ========================================

// API_URL vem do config.js (window.API_URL)

// ========================================
// CACHE DE REFERÊNCIAS DOM
// ========================================

/**
 * Cache de elementos DOM para evitar queries repetidas
 * Inicializado no DOMContentLoaded
 */
const DOMCache = {
    messagesContainer: null,
    messageInput: null,
    typingIndicator: null,
    chatForm: null,
    userName: null,
    logoutBtn: null,
    assistantButtons: null,
    currentAssistantName: null,
    currentAssistantDesc: null,

    init() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.chatForm = document.getElementById('chatForm');
        this.userName = document.getElementById('userName');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.assistantButtons = document.querySelectorAll('.assistant-btn');
        this.currentAssistantName = document.getElementById('currentAssistantName');
        this.currentAssistantDesc = document.getElementById('currentAssistantDesc');
    }
};

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
        name: 'Radar Diagnóstico',
        description: 'Treino de diagnóstico DSM-5-TR',
        icon: '🎲',
        welcome: 'Bem-vindo ao treino diagnóstico! Vamos praticar identificação de transtornos. Pronto para começar?'
    },
    journey: {
        name: 'Jornada Clínica',
        description: 'Jornada de 12 sessões',
        icon: '🗺️',
        welcome: 'Olá! Vou te guiar em uma jornada clínica completa. Qual abordagem você quer usar? (CBT, ACT, DBT)'
    }
};

// ========================================
// UTILITIES - THROTTLE
// ========================================

/**
 * Throttle - Limita execução de função a uma vez por intervalo
 * Garante que a última chamada sempre seja executada
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em ms
 * @returns {Function}
 */
function throttle(func, delay) {
    let lastCall = 0;
    let timeoutId = null;

    return function(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCall;

        if (timeSinceLastCall >= delay) {
            lastCall = now;
            func.apply(this, args);
        } else {
            // Garantir que a última chamada seja executada
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                func.apply(this, args);
            }, delay - timeSinceLastCall);
        }
    };
}

// ========================================
// UTILITIES - FETCH COM TIMEOUT
// ========================================

/**
 * Fetch com timeout automático usando AbortController
 * Previne requisições infinitas que travam a UI
 * @param {string} url - URL da API
 * @param {object} options - Opções do fetch
 * @param {number} timeout - Timeout em ms (padrão: 60s)
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = 60000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - O servidor demorou muito para responder (60s)');
        }
        throw error;
    }
}

// ========================================
// UTILITIES - SANITIZAÇÃO HTML
// ========================================

/**
 * Sanitiza HTML para prevenir XSS
 * Usa DOMPurify se disponível, senão fallback seguro
 * @param {string} html - HTML a ser sanitizado
 * @returns {string}
 */
function sanitizeHTML(html) {
    // Se DOMPurify estiver disponível, usar ele (melhor opção)
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['br', 'strong', 'em', 'p', 'span'],
            ALLOWED_ATTR: []
        });
    }

    // Fallback: escape de caracteres perigosos
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

// ========================================
// UTILITIES - SCROLL SUAVE
// ========================================

/**
 * Scroll suave para o final das mensagens
 */
function scrollToBottomSmooth() {
    if (!DOMCache.messagesContainer) return;

    DOMCache.messagesContainer.scrollTo({
        top: DOMCache.messagesContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Versão throttled para evitar chamadas excessivas (max 1x por 100ms)
const scrollToBottom = throttle(scrollToBottomSmooth, 100);

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Chat inicializando...');

    // Inicializar cache DOM primeiro (otimização)
    DOMCache.init();

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

        // Usar fetch com timeout de 10s para auth
        const response = await fetchWithTimeout(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        }, 10000);

        if (!response.ok) {
            throw new Error('Falha ao carregar dados');
        }

        const data = await response.json();
        state.user = data.user;

        // Atualizar UI usando cache DOM
        if (DOMCache.userName) {
            DOMCache.userName.textContent = state.user.name || state.user.email;
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
    if (DOMCache.chatForm) {
        DOMCache.chatForm.addEventListener('submit', handleSubmit);
    }

    // Enter no textarea (sem Shift)
    if (DOMCache.messageInput) {
        DOMCache.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        });
    }

    // Event delegation para botões de assistentes (otimização)
    // Um único listener no pai em vez de um por botão
    const assistantsList = document.querySelector('.assistants-list');
    if (assistantsList) {
        assistantsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.assistant-btn');
            if (btn) {
                const assistantType = btn.dataset.assistant;
                switchAssistant(assistantType);
            }
        });
    }

    // Botão de logout
    if (DOMCache.logoutBtn) {
        DOMCache.logoutBtn.addEventListener('click', handleLogout);
    }
}

// ========================================
// ENVIAR MENSAGEM
// ========================================

async function handleSubmit(e) {
    e.preventDefault();

    const message = DOMCache.messageInput.value.trim();

    if (!message) return;

    // Limpar input
    DOMCache.messageInput.value = '';

    // Adicionar mensagem do usuário
    addMessage('user', message);

    // Mostrar "digitando..."
    showTypingIndicator();

    try {
        console.log(`📤 Enviando para ${state.currentAssistant}:`, message);

        // Usar fetch com timeout de 60s para mensagens
        const response = await fetchWithTimeout(`${API_URL}/api/chat/message`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                assistantType: state.currentAssistant
            })
        }, 60000);

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
    if (!DOMCache.messagesContainer) return;

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

    DOMCache.messagesContainer.appendChild(messageDiv);

    // Scroll automático com throttle (otimização)
    scrollToBottom();

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
    // Sanitizar primeiro para prevenir XSS
    const safeText = sanitizeHTML(text);

    // Quebras de linha
    let formatted = safeText.replace(/\n/g, '<br>');

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
    if (DOMCache.typingIndicator) {
        DOMCache.typingIndicator.style.display = 'flex';
        state.isTyping = true;
    }
}

function hideTypingIndicator() {
    if (DOMCache.typingIndicator) {
        DOMCache.typingIndicator.style.display = 'none';
        state.isTyping = false;
    }
}

// ========================================
// TROCAR ASSISTENTE
// ========================================

function switchAssistant(assistantType) {
    console.log(`🔄 Trocando para assistente: ${assistantType}`);

    state.currentAssistant = assistantType;

    // Atualizar botões usando cache
    DOMCache.assistantButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.assistant === assistantType) {
            btn.classList.add('active');
        }
    });

    // Atualizar informações
    const info = assistantsInfo[assistantType];

    if (DOMCache.currentAssistantName) {
        DOMCache.currentAssistantName.textContent = info.name;
    }

    if (DOMCache.currentAssistantDesc) {
        DOMCache.currentAssistantDesc.textContent = info.description;
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

    if (!DOMCache.messagesContainer) return;

    DOMCache.messagesContainer.innerHTML = `
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
    if (DOMCache.messagesContainer) {
        DOMCache.messagesContainer.innerHTML = '';
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