/**
 * config.js - Configuração centralizada do Frontend
 * Scopsy v4.0
 *
 * Este arquivo detecta automaticamente o ambiente (desenvolvimento/produção)
 * e configura as URLs da API de acordo.
 *
 * IMPORTANTE: Este arquivo deve ser carregado ANTES de todos os outros scripts
 * nas páginas HTML.
 */

(function () {
    'use strict';

    /**
     * Detecta o ambiente baseado no hostname
     * @returns {string} 'development' ou 'production'
     */
    function detectEnvironment() {
        const hostname = window.location.hostname;

        // Ambientes de desenvolvimento
        const devHosts = ['localhost', '127.0.0.1', ''];

        if (devHosts.includes(hostname)) {
            return 'development';
        }

        return 'production';
    }

    /**
     * Configurações por ambiente
     */
    const configs = {
        development: {
            API_URL: 'http://localhost:3000',
            WS_URL: 'ws://localhost:3000',
            ENVIRONMENT: 'development'
        },
        production: {
            // Em produção, usa o mesmo domínio da aplicação
            API_URL: window.location.origin,
            WS_URL: window.location.origin.replace(/^http/, 'ws'),
            ENVIRONMENT: 'production'
        }
    };

    // Detectar ambiente
    const env = detectEnvironment();
    const config = configs[env];

    // Expor configuração globalmente
    window.SCOPSY_CONFIG = {
        ...config,
        VERSION: '4.0',
        DEBUG: env === 'development'
    };

    // Para compatibilidade com código existente, manter API_URL global
    window.API_URL = config.API_URL;

    // Log de inicialização (apenas em desenvolvimento)
    if (window.SCOPSY_CONFIG.DEBUG) {
        console.log('🔧 Scopsy Config Loaded:', {
            environment: env,
            apiUrl: config.API_URL,
            wsUrl: config.WS_URL
        });
    }

})();
