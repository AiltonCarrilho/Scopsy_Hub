#!/bin/bash

# ========================================
# SCOPSY - Deploy Script
# Versão: 1.0.0
# ========================================

set -e  # Exit on error

echo "🚀 SCOPSY DEPLOY SCRIPT"
echo "======================="
echo ""

# Colors
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ========================================
# 1. PRE-DEPLOY CHECKS
# ========================================
echo "📋 Executando verificações pré-deploy..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "   Copie .env.example e configure as variáveis."
    exit 1
fi

# Check critical env vars
echo "🔐 Verificando variáveis de ambiente..."

if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo -e "${RED}❌ OPENAI_API_KEY não configurada!${NC}"
    exit 1
fi

if grep -q "YOUR_NEW_OPENAI_KEY_HERE" .env; then
    echo -e "${RED}❌ OPENAI_API_KEY ainda é placeholder!${NC}"
    echo "   Configure a chave real antes do deploy."
    exit 1
fi

if ! grep -q "JWT_SECRET=" .env; then
    echo -e "${RED}❌ JWT_SECRET não configurada!${NC}"
    exit 1
fi

if ! grep -q "SUPABASE_URL=" .env; then
    echo -e "${RED}❌ SUPABASE_URL não configurada!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variáveis de ambiente OK${NC}"
echo ""

# Check Node version
NODE_VERSION=$(node -v)
echo "📦 Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18" ]]; then
    echo -e "${YELLOW}⚠️  Node.js < 18 detectado. Recomendado: v20+${NC}"
fi

# Check npm dependencies
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
fi

# Check if express-rate-limit is installed
if ! npm list express-rate-limit &> /dev/null; then
    echo -e "${YELLOW}⚠️  express-rate-limit não instalado. Instalando...${NC}"
    npm install express-rate-limit --save
fi

echo -e "${GREEN}✅ Dependências OK${NC}"
echo ""

# ========================================
# 2. SECURITY CHECKS
# ========================================
echo "🔒 Verificações de segurança..."

# Check if .env is in .gitignore
if ! grep -q "^\.env$" .gitignore; then
    echo -e "${YELLOW}⚠️  .env não está no .gitignore!${NC}"
    echo "   Adicionando..."
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
fi

# Check for hardcoded secrets in frontend
echo "🔍 Procurando segredos hardcoded no frontend..."

SECRETS_FOUND=0

if grep -r "sk-proj-" frontend/ 2>/dev/null | grep -v "node_modules" | grep -v ".git"; then
    echo -e "${RED}❌ Chave OpenAI encontrada no frontend!${NC}"
    SECRETS_FOUND=1
fi

if grep -r "sk_live_" frontend/ 2>/dev/null | grep -v "node_modules" | grep -v ".git"; then
    echo -e "${RED}❌ Chave Stripe LIVE encontrada no frontend!${NC}"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 1 ]; then
    echo -e "${RED}❌ Segredos encontrados no frontend! Remova antes do deploy.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nenhum segredo hardcoded detectado${NC}"
echo ""

# ========================================
# 3. RUN TESTS (if available)
# ========================================
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    echo "🧪 Executando testes..."
    npm test || {
        echo -e "${RED}❌ Testes falharam!${NC}"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
    echo -e "${GREEN}✅ Testes passaram${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhum teste configurado${NC}"
fi

echo ""

# ========================================
# 4. BUILD (if needed)
# ========================================
echo "🏗️  Build do projeto..."

# Se houver script de build, executar
if grep -q "\"build\"" package.json; then
    npm run build
    echo -e "${GREEN}✅ Build concluído${NC}"
else
    echo "   Nenhum script de build encontrado (pulando)"
fi

echo ""

# ========================================
# 5. DEPLOY CHECKLIST
# ========================================
echo "📋 CHECKLIST PRÉ-DEPLOY"
echo "======================="
echo ""

echo "Por favor, confirme manualmente:"
echo ""
echo "🔐 Segurança:"
echo "  [ ] Nova chave OpenAI gerada e configurada"
echo "  [ ] Chave antiga revogada no painel OpenAI"
echo "  [ ] JWT_SECRET é seguro (256 bits)"
echo "  [ ] Variáveis de ambiente NÃO estão no Git"
echo ""
echo "🚀 Infraestrutura:"
echo "  [ ] Servidor VPS configurado e acessível"
echo "  [ ] HTTPS/SSL configurado (Let's Encrypt)"
echo "  [ ] Firewall configurado (portas 80, 443, 22)"
echo "  [ ] PM2 instalado no servidor"
echo "  [ ] Nginx configurado como reverse proxy"
echo ""
echo "🗄️  Banco de Dados:"
echo "  [ ] Supabase configurado e acessível"
echo "  [ ] Tabelas criadas conforme schema"
echo "  [ ] Boost.space funcionando (opcional)"
echo ""
echo "💳 Pagamentos (se aplicável):"
echo "  [ ] Stripe em modo LIVE (não TEST)"
echo "  [ ] Webhooks configurados"
echo "  [ ] Produtos/preços criados no Stripe"
echo ""

read -p "Todos os itens acima foram verificados? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deploy cancelado pelo usuário${NC}"
    exit 1
fi

echo ""

# ========================================
# 6. DEPLOY TO SERVER
# ========================================
echo "🚀 Iniciando deploy..."
echo ""

# Perguntar método de deploy
echo "Escolha o método de deploy:"
echo "  1) Deploy local (PM2)"
echo "  2) Deploy remoto (SSH + rsync)"
echo "  3) Deploy manual (apenas instruções)"
read -p "Opção (1/2/3): " -n 1 -r DEPLOY_METHOD
echo
echo ""

case $DEPLOY_METHOD in
  1)
    echo "📦 Deploy local com PM2..."

    # Kill processo anterior se existir
    pm2 stop scopsy 2>/dev/null || true
    pm2 delete scopsy 2>/dev/null || true

    # Iniciar com PM2
    pm2 start src/server.js --name scopsy --env production
    pm2 save

    echo -e "${GREEN}✅ Deploy concluído!${NC}"
    echo ""
    echo "📊 Monitoramento:"
    echo "   pm2 logs scopsy"
    echo "   pm2 monit"
    ;;

  2)
    read -p "Usuário SSH: " SSH_USER
    read -p "Host SSH: " SSH_HOST
    read -p "Diretório remoto: " REMOTE_DIR

    echo "📤 Sincronizando arquivos..."

    rsync -avz --exclude 'node_modules' \
                --exclude '.git' \
                --exclude '.env.local' \
                --exclude 'logs' \
                ./ $SSH_USER@$SSH_HOST:$REMOTE_DIR

    echo "🔧 Instalando dependências no servidor..."
    ssh $SSH_USER@$SSH_HOST "cd $REMOTE_DIR && npm install --production"

    echo "🔄 Reiniciando PM2..."
    ssh $SSH_USER@$SSH_HOST "cd $REMOTE_DIR && pm2 restart scopsy || pm2 start src/server.js --name scopsy"

    echo -e "${GREEN}✅ Deploy remoto concluído!${NC}"
    ;;

  3)
    echo "📝 INSTRUÇÕES DE DEPLOY MANUAL"
    echo "=============================="
    echo ""
    echo "1. No servidor, crie o diretório:"
    echo "   mkdir -p /var/www/scopsy"
    echo ""
    echo "2. Envie os arquivos (exceto node_modules):"
    echo "   rsync -avz --exclude 'node_modules' ./ user@server:/var/www/scopsy"
    echo ""
    echo "3. SSH no servidor:"
    echo "   ssh user@server"
    echo ""
    echo "4. Instale dependências:"
    echo "   cd /var/www/scopsy"
    echo "   npm install --production"
    echo ""
    echo "5. Configure variáveis de ambiente:"
    echo "   nano .env"
    echo "   (Cole suas variáveis de produção)"
    echo ""
    echo "6. Inicie com PM2:"
    echo "   pm2 start src/server.js --name scopsy"
    echo "   pm2 save"
    echo "   pm2 startup"
    echo ""
    echo "7. Configure Nginx:"
    echo "   sudo nano /etc/nginx/sites-available/scopsy"
    echo "   sudo ln -s /etc/nginx/sites-available/scopsy /etc/nginx/sites-enabled/"
    echo "   sudo nginx -t"
    echo "   sudo systemctl reload nginx"
    echo ""
    echo "8. Configure SSL:"
    echo "   sudo certbot --nginx -d scopsy.com.br"
    echo ""
    ;;

  *)
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "========================================="
echo ""
echo "🔗 Próximos passos:"
echo "   1. Verificar logs: pm2 logs scopsy"
echo "   2. Testar API: curl https://scopsy.com.br/api/health"
echo "   3. Monitorar erros nas primeiras 24h"
echo "   4. Configurar alertas de custo OpenAI"
echo ""
echo "📚 Documentação:"
echo "   - DEPLOY_SECURITY_AUDIT.md"
echo "   - MIDDLEWARE_USAGE_GUIDE.md"
echo "   - SECURITY_ALERT.md (se aplicável)"
echo ""
echo "✅ Tudo pronto!"
