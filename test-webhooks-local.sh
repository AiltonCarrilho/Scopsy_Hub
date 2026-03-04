#!/bin/bash

# ========================================
# TEST LOCAL WEBHOOKS - GUIA INTERATIVO
# ========================================
# Este script ajuda a testar webhooks localmente

cd "D:\projetos.vscode\SCOPSY-CLAUDE-CODE"

echo "=================================================="
echo "🧪 TESTE LOCAL DE WEBHOOKS P0.3"
echo "=================================================="
echo ""
echo "Escolha uma opção:"
echo ""
echo "1) Rodar Unit Tests (5 min)"
echo "2) Rodar servidor local (npm run dev)"
echo "3) Rodar integration tests com mock (precisa servidor rodando em outro terminal)"
echo "4) Health check (curl - precisa servidor rodando)"
echo ""
read -p "Escolha (1-4): " choice

case $choice in
  1)
    echo "▶️ Rodando unit tests..."
    npm run test:webhooks
    ;;
  2)
    echo "▶️ Iniciando servidor local..."
    echo "Aguarde: 'Server running on port 3000'"
    echo "Pressione Ctrl+C para parar"
    npm run dev
    ;;
  3)
    echo "▶️ Rodando integration tests com mock..."
    echo "IMPORTANTE: O servidor deve estar rodando em outro terminal (opção 2)"
    sleep 2
    node tests/integration-webhook-mock.js
    ;;
  4)
    echo "▶️ Testando health check..."
    sleep 1
    curl -s http://localhost:3000/api/webhooks/kiwify/health | jq .
    ;;
  *)
    echo "❌ Opção inválida"
    exit 1
    ;;
esac

echo ""
echo "✅ Teste completo!"
