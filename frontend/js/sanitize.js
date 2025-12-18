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

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.sanitizeHTML = sanitizeHTML;
    window.safeSetInnerHTML = safeSetInnerHTML;
    window.escapeHTML = escapeHTML;
}

// Exportar para módulos (se suportado)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sanitizeHTML, safeSetInnerHTML, escapeHTML };
}
