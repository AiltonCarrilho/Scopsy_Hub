/**
      * Script para testar webhook do Kiwify manualmente
      * Simula uma compra aprovada
      */
const fetch = require('node-fetch');
const webhookURL = 'https://scopsy-hub.onrender.com/api/webhooks/kiwify';
// Dados de teste - SUBSTITUA com o email real da compra