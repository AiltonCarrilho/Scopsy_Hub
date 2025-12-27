# Deploy forçado para Vercel
Write-Host "🚀 Fazendo deploy forçado do commit mais recente..." -ForegroundColor Cyan

cd "D:\projetos.vscode\SCOPSY-CLAUDE-CODE"

# Garantir que está no commit correto
git checkout main
git pull origin main

Write-Host "📦 Último commit:" -ForegroundColor Yellow
git log -1 --oneline

Write-Host ""
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan

# Deploy direto
vercel --prod --yes --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ DEPLOY CONCLUÍDO!" -ForegroundColor Green
    Write-Host "⏳ Aguarde 2 minutos e teste no celular" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Erro no deploy" -ForegroundColor Red
}
