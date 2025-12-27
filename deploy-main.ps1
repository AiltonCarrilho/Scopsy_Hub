# Script para fazer deploy da branch main para Vercel
# Scopsy - Deploy Manual

Write-Host "🚀 Iniciando deploy da branch MAIN para Vercel..." -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na branch main
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "⚠️  Você não está na branch main!" -ForegroundColor Yellow
    Write-Host "   Branch atual: $currentBranch" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Mudando para branch main..." -ForegroundColor Cyan
    git checkout main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao mudar para branch main" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Branch: main" -ForegroundColor Green
Write-Host ""

# Verificar se está atualizado
Write-Host "📡 Verificando atualizações do repositório remoto..." -ForegroundColor Cyan
git fetch origin

$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main

if ($localCommit -ne $remoteCommit) {
    Write-Host "⚠️  Sua branch local está desatualizada!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Puxando atualizações..." -ForegroundColor Cyan
    git pull origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao puxar atualizações" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Branch local sincronizada com origin/main" -ForegroundColor Green
Write-Host ""

# Mostrar último commit
$lastCommit = git log -1 --oneline
Write-Host "📝 Último commit: $lastCommit" -ForegroundColor Cyan
Write-Host ""

# Fazer deploy
Write-Host "🚀 Fazendo deploy para produção..." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE: Se for a primeira vez usando Vercel CLI:" -ForegroundColor Yellow
Write-Host "1. Uma página do navegador vai abrir para login" -ForegroundColor Yellow
Write-Host "2. Faça login na Vercel" -ForegroundColor Yellow
Write-Host "3. Volte para este terminal" -ForegroundColor Yellow
Write-Host "4. Quando perguntar 'Link to existing project?', responda: Y" -ForegroundColor Yellow
Write-Host "5. Selecione o projeto Scopsy da lista" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione ENTER para continuar ou Ctrl+C para cancelar..." -ForegroundColor Yellow
Read-Host

# Deploy para produção
vercel --prod --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Aguarde 1-2 minutos para propagação..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🧪 Para testar, execute:" -ForegroundColor Cyan
    Write-Host "   .\test-after-deploy.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy!" -ForegroundColor Red
    Write-Host "Verifique as mensagens acima para detalhes." -ForegroundColor Yellow
    exit 1
}
