#!/bin/bash
# Test DNS Configuration - Scopsy
# Execute após configurar DNS no Cloudflare

echo "================================================"
echo "🧪 TESTANDO CONFIGURAÇÃO DNS - SCOPSY"
echo "================================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Teste 1: DNS Resolution
echo "📡 Teste 1: Resolução DNS de lab.scopsy.com.br"
echo "------------------------------------------------"
nslookup lab.scopsy.com.br
echo ""

# Teste 2: Health Check Webhook Kiwify
echo "🏥 Teste 2: Health Check Webhook Kiwify"
echo "------------------------------------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" https://lab.scopsy.com.br/api/webhooks/kiwify/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Status: $HTTP_CODE OK${NC}"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ Status: $HTTP_CODE ERRO${NC}"
    echo "Response: $BODY"
fi
echo ""

# Teste 3: Backend API Geral
echo "🔌 Teste 3: Backend API (deve retornar erro de auth)"
echo "------------------------------------------------"
API_RESPONSE=$(curl -s -w "\n%{http_code}" https://lab.scopsy.com.br/api/auth/me)
API_CODE=$(echo "$API_RESPONSE" | tail -1)
API_BODY=$(echo "$API_RESPONSE" | head -n -1)

if [ "$API_CODE" = "401" ] || [ "$API_CODE" = "403" ]; then
    echo -e "${GREEN}✅ Status: $API_CODE (esperado - sem token)${NC}"
    echo "Response: $API_BODY"
elif [ "$API_CODE" = "404" ]; then
    echo -e "${RED}❌ Status: 404 - Backend não está respondendo${NC}"
else
    echo -e "${YELLOW}⚠️  Status: $API_CODE${NC}"
    echo "Response: $API_BODY"
fi
echo ""

# Teste 4: CORS Headers
echo "🌐 Teste 4: CORS Headers"
echo "------------------------------------------------"
CORS_RESPONSE=$(curl -s -I -H "Origin: https://scopsy.com.br" https://lab.scopsy.com.br/api/auth/login)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS configurado corretamente${NC}"
    echo "$CORS_RESPONSE" | grep "Access-Control"
else
    echo -e "${RED}❌ CORS não encontrado nos headers${NC}"
fi
echo ""

# Teste 5: Verificar se está respondendo do Render (não Vercel)
echo "🖥️  Teste 5: Verificar origem da resposta"
echo "------------------------------------------------"
SERVER_HEADER=$(curl -s -I https://lab.scopsy.com.br/api/webhooks/kiwify/health | grep -i "server:")
if echo "$SERVER_HEADER" | grep -q "Vercel"; then
    echo -e "${RED}❌ PROBLEMA: Respondendo do VERCEL (deveria ser Render)${NC}"
    echo "$SERVER_HEADER"
elif echo "$SERVER_HEADER" | grep -q "cloudflare"; then
    echo -e "${GREEN}✅ Respondendo via Cloudflare (proxy para Render)${NC}"
    echo "$SERVER_HEADER"
else
    echo -e "${GREEN}✅ Respondendo do Render${NC}"
    echo "$SERVER_HEADER"
fi
echo ""

# Resumo
echo "================================================"
echo "📊 RESUMO"
echo "================================================"
if [ "$HTTP_CODE" = "200" ] && [ "$API_CODE" = "401" ]; then
    echo -e "${GREEN}✅ CONFIGURAÇÃO OK! Backend funcionando corretamente.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Testar compra no Kiwify"
    echo "2. Verificar se webhook chega"
    echo "3. Verificar se email é enviado"
else
    echo -e "${RED}❌ CONFIGURAÇÃO COM PROBLEMAS${NC}"
    echo ""
    echo "Verifique:"
    echo "1. DNS no Cloudflare (lab → scopsy-hub.onrender.com)"
    echo "2. Proxy DESATIVADO (nuvem cinza)"
    echo "3. Aguardar propagação (5-10 min)"
fi
echo "================================================"
