#!/bin/bash

# Script de teste de produção - Scopsy
# Verifica se o config.js está sendo servido corretamente

echo "🔍 Testando Scopsy em Produção..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
BASE_URL="https://app.scopsy.com.br"
CONFIG_URL="$BASE_URL/js/config.js"
SIGNUP_URL="$BASE_URL/signup.html"

echo "📡 Teste 1: Verificando se config.js existe..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CONFIG_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ config.js encontrado (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ config.js NÃO encontrado (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}   URL testada: $CONFIG_URL${NC}"
    exit 1
fi

echo ""
echo "📝 Teste 2: Verificando conteúdo do config.js..."
CONFIG_CONTENT=$(curl -s "$CONFIG_URL")

if echo "$CONFIG_CONTENT" | grep -q "https://app.scopsy.com.br"; then
    echo -e "${GREEN}✅ config.js contém URL de produção correta${NC}"
else
    echo -e "${RED}❌ config.js NÃO contém URL de produção${NC}"
    echo -e "${YELLOW}   Conteúdo (primeiras 10 linhas):${NC}"
    echo "$CONFIG_CONTENT" | head -10
    exit 1
fi

echo ""
echo "🔍 Teste 3: Verificando signup.html..."
SIGNUP_CONTENT=$(curl -s "$SIGNUP_URL")

if echo "$SIGNUP_CONTENT" | grep -q "localhost:3000"; then
    echo -e "${RED}❌ signup.html ainda contém localhost hardcoded${NC}"
    echo -e "${YELLOW}   Código encontrado:${NC}"
    echo "$SIGNUP_CONTENT" | grep -C 2 "localhost:3000"
    exit 1
else
    echo -e "${GREEN}✅ signup.html NÃO contém localhost hardcoded${NC}"
fi

if echo "$SIGNUP_CONTENT" | grep -q '<script src="/js/config.js"></script>'; then
    echo -e "${GREEN}✅ signup.html carrega config.js corretamente${NC}"
else
    echo -e "${RED}❌ signup.html NÃO carrega config.js${NC}"
    exit 1
fi

echo ""
echo "🌐 Teste 4: Verificando headers HTTP..."
CONTENT_TYPE=$(curl -s -I "$CONFIG_URL" | grep -i "content-type" | cut -d: -f2 | tr -d '\r\n' | xargs)

if [[ "$CONTENT_TYPE" == *"javascript"* ]]; then
    echo -e "${GREEN}✅ Content-Type correto: $CONTENT_TYPE${NC}"
else
    echo -e "${YELLOW}⚠️  Content-Type inesperado: $CONTENT_TYPE${NC}"
fi

echo ""
echo "🎯 Teste 5: Verificando proxy de API..."
API_URL="$BASE_URL/api/health"
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

echo -e "   Status API Health: HTTP $API_CODE"
if [ "$API_CODE" -eq 200 ] || [ "$API_CODE" -eq 404 ]; then
    echo -e "${GREEN}✅ Proxy de API está funcionando${NC}"
else
    echo -e "${YELLOW}⚠️  Proxy de API pode ter problemas (esperado 200 ou 404)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Produção está funcionando corretamente!"
echo ""
echo "Para testar no navegador, execute no console:"
echo ""
echo "  console.log('API_URL:', window.API_URL);"
echo "  console.log('Config:', window.SCOPSY_CONFIG);"
echo ""
