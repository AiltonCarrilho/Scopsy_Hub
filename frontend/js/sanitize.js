// ========================================
// SANITIZE.JS - XSS Protection Helper
// ========================================

/**
 * Sanitiza HTML usando DOMPurify para prevenir XSS
 * @param {string} dirty - HTML não confiável
 * @param {object} config - Configuração DOMPurify (opcional)
 * @returns {string} HTML sanitizado
 */
function sanitizeHTML(dirty, config = {}) {
    if (typeof DOMPurify === 'undefined') {
        console.error('❌ DOMPurify não está carregado! Usando fallback inseguro.');
        // Fallback básico (NÃO é 100% seguro, mas melhor que nada)
        const div = document.createElement('div');
        div.textContent = dirty;
        return div.innerHTML;
    }

    // Configuração padrão permissiva mas segura
    const defaultConfig = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'small'],
        ALLOWED_ATTR: ['class', 'style', 'id'],
        ALLOW_DATA_ATTR: false,
        ...config
    };

    return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Define innerHTML de forma segura (com sanitização)
 * @param {HTMLElement} element - Elemento DOM
 * @param {string} html - HTML a ser inserido
 */
function safeSetInnerHTML(element, html) {
    if (!element) {
        console.error('❌ Elemento não encontrado para safeSetInnerHTML');
        return;
    }
    element.innerHTML = sanitizeHTML(html);
}

/**
 * Escapa texto puro (sem permitir HTML)
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Exibe overlay amigável de sessão expirada e redireciona para login.
 * Limpa token do localStorage automaticamente.
 */
function showSessionExpired() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;';
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:40px 32px;text-align:center;max-width:360px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
            <div style="font-size:48px;margin-bottom:16px;">🔐</div>
            <h3 style="margin:0 0 12px;color:#1e293b;font-size:1.25rem;font-weight:700;">Sessão expirada</h3>
            <p style="margin:0 0 24px;color:#64748b;font-size:0.95rem;line-height:1.5;">
                Por segurança, faça o login novamente para continuar de onde parou.
            </p>
            <button onclick="window.location.href='login.html'" style="background:#7c3aed;color:#fff;border:none;padding:12px 28px;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;width:100%;">
                Fazer Login
            </button>
        </div>`;
    document.body.appendChild(overlay);
    setTimeout(() => { window.location.href = 'login.html'; }, 4000);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.sanitizeHTML = sanitizeHTML;
    window.safeSetInnerHTML = safeSetInnerHTML;
    window.escapeHTML = escapeHTML;
    window.showSessionExpired = showSessionExpired;
}

// Exportar para módulos (se suportado)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sanitizeHTML, safeSetInnerHTML, escapeHTML };
}
