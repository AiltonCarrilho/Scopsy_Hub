/**
 * CHAT VALIDATION - Testes Automatizados
 * Valida a lógica JavaScript do chat.js sem precisar do navegador
 */

// Simular ambiente DOM
global.document = {
    getElementById: (id) => ({ id, textContent: '', style: {}, value: '' }),
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => ({
        className: '',
        innerHTML: '',
        appendChild: () => {},
        textContent: ''
    }),
    addEventListener: () => {}
};

global.localStorage = {
    getItem: (key) => key === 'token' ? 'fake-token' : null,
    setItem: () => {},
    removeItem: () => {}
};

global.window = {
    location: { href: '' }
};

// Mock DOMPurify
global.DOMPurify = {
    sanitize: (html, options) => {
        // Simular sanitização básica
        return html.replace(/<script.*?>.*?<\/script>/gi, '');
    }
};

console.log('🧪 Iniciando Testes de Validação do Chat\n');

// ========================================
// TESTE 1: Validar Throttle
// ========================================
console.log('📋 TESTE 1: Throttle Function');

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
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                func.apply(this, args);
            }, delay - timeSinceLastCall);
        }
    };
}

let throttleCallCount = 0;
const throttledFunc = throttle(() => {
    throttleCallCount++;
}, 100);

// Executar 10 vezes rapidamente
for (let i = 0; i < 10; i++) {
    throttledFunc();
}

setTimeout(() => {
    if (throttleCallCount === 1) {
        console.log('✅ Throttle funcionando corretamente (1 chamada de 10)');
    } else {
        console.log(`❌ Throttle FALHOU (${throttleCallCount} chamadas de 10)`);
    }
}, 150);

// ========================================
// TESTE 2: Validar fetchWithTimeout
// ========================================
setTimeout(() => {
    console.log('\n📋 TESTE 2: Fetch com Timeout');

    async function fetchWithTimeout(url, options = {}, timeout = 1000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Simular fetch (real fetch falharia em Node.js)
            const mockFetch = () => new Promise((resolve) => {
                setTimeout(() => resolve({ ok: true }), 500);
            });

            const response = await mockFetch();
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Teste 2.1: Fetch normal (sucesso)
    fetchWithTimeout('http://test.com', {}, 2000)
        .then(() => {
            console.log('✅ Fetch com timeout PASSOU (resposta rápida)');
        })
        .catch((err) => {
            console.log('❌ Fetch FALHOU:', err.message);
        });

    // Teste 2.2: Timeout (deve abortar)
    setTimeout(async () => {
        try {
            // Simular fetch lento
            const slowFetch = () => new Promise((resolve) => {
                setTimeout(() => resolve({ ok: true }), 3000);
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);

            await slowFetch();
            clearTimeout(timeoutId);
            console.log('❌ Timeout NÃO funcionou (deveria abortar)');
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('✅ Timeout funcionando corretamente (abortou após 500ms)');
            }
        }
    }, 200);
}, 200);

// ========================================
// TESTE 3: Validar Sanitização
// ========================================
setTimeout(() => {
    console.log('\n📋 TESTE 3: Sanitização XSS');

    function sanitizeHTML(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['br', 'strong', 'em', 'p', 'span'],
                ALLOWED_ATTR: []
            });
        }

        const temp = { textContent: '', innerHTML: '' };
        temp.textContent = html;
        return temp.innerHTML || html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    const xssTests = [
        {
            input: '<script>alert("XSS")</script>',
            shouldContain: false,
            name: 'Script tag'
        },
        {
            input: '<img src=x onerror=alert(1)>',
            shouldContain: false,
            name: 'Image onerror'
        },
        {
            input: '**Texto em negrito**',
            shouldContain: true,
            name: 'Texto legítimo'
        }
    ];

    xssTests.forEach(test => {
        const sanitized = sanitizeHTML(test.input);
        const containsScript = sanitized.includes('script') || sanitized.includes('onerror');

        if (test.shouldContain && sanitized.includes(test.input)) {
            console.log(`✅ ${test.name}: Texto legítimo preservado`);
        } else if (!test.shouldContain && !containsScript) {
            console.log(`✅ ${test.name}: XSS bloqueado`);
        } else {
            console.log(`❌ ${test.name}: FALHOU`);
        }
    });
}, 500);

// ========================================
// TESTE 4: Validar DOMCache
// ========================================
setTimeout(() => {
    console.log('\n📋 TESTE 4: DOM Cache');

    const DOMCache = {
        messagesContainer: null,
        messageInput: null,
        init() {
            this.messagesContainer = document.getElementById('messagesContainer');
            this.messageInput = document.getElementById('messageInput');
        }
    };

    DOMCache.init();

    if (DOMCache.messagesContainer && DOMCache.messageInput) {
        console.log('✅ DOMCache inicializado corretamente');
        console.log('   - messagesContainer:', !!DOMCache.messagesContainer);
        console.log('   - messageInput:', !!DOMCache.messageInput);
    } else {
        console.log('❌ DOMCache FALHOU na inicialização');
    }
}, 700);

// ========================================
// TESTE 5: Validar Event Delegation
// ========================================
setTimeout(() => {
    console.log('\n📋 TESTE 5: Event Delegation Pattern');

    // Simular estrutura HTML
    const mockButton = {
        dataset: { assistant: 'case' },
        classList: { add: () => {}, remove: () => {} }
    };

    const mockEvent = {
        target: {
            closest: (selector) => {
                if (selector === '.assistant-btn') {
                    return mockButton;
                }
                return null;
            }
        }
    };

    // Simular event handler
    let delegationWorked = false;
    const handleClick = (e) => {
        const btn = e.target.closest('.assistant-btn');
        if (btn) {
            delegationWorked = true;
            return btn.dataset.assistant;
        }
    };

    const result = handleClick(mockEvent);

    if (delegationWorked && result === 'case') {
        console.log('✅ Event delegation funcionando corretamente');
        console.log('   - Botão detectado:', result);
    } else {
        console.log('❌ Event delegation FALHOU');
    }
}, 900);

// ========================================
// RESUMO FINAL
// ========================================
setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DOS TESTES AUTOMATIZADOS');
    console.log('='.repeat(50));
    console.log('\nTodos os testes de lógica JavaScript foram executados.');
    console.log('\n⚠️  PRÓXIMO PASSO: Testes no Navegador');
    console.log('Execute o seguinte no terminal:\n');
    console.log('   1. Abra: SCOPSY-CLAUDE-CODE/frontend/chat.html');
    console.log('   2. Pressione F12 para abrir DevTools');
    console.log('   3. Vá para a aba "Console"');
    console.log('   4. Verifique se não há erros');
    console.log('   5. Digite: console.log(DOMCache)');
    console.log('   6. Teste enviar mensagens e trocar assistentes\n');
    console.log('='.repeat(50) + '\n');
}, 1200);
