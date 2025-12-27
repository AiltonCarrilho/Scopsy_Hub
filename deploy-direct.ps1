# Deploy direto para Vercel sem linkar ao projeto existente
# Isso cria um novo deployment que voce pode promover para producao

Write-Host "Deploy DIRETO para Vercel (sem link ao projeto)" -ForegroundColor Cyan
Write-Host ""

# Remover link existente se houver
if (Test-Path ".vercel") {
    Write-Host "Removendo link antigo..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .vercel
}

Write-Host "Importante: Responda as perguntas assim:" -ForegroundColor Yellow
Write-Host "   - Link to existing project? -> N (NAO)" -ForegroundColor White
Write-Host "   - Project name? -> scopsy-main" -ForegroundColor White
Write-Host "   - Directory? -> ./frontend" -ForegroundColor White
Write-Host ""
Write-Host "Pressione ENTER para continuar..." -ForegroundColor Yellow
Read-Host

# Deploy para producao
vercel --prod

Write-Host ""
Write-Host "Deploy concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "PROXIMO PASSO:" -ForegroundColor Yellow
Write-Host "1. Va para https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Abra o novo projeto scopsy-main" -ForegroundColor White
Write-Host "3. Settings -> Domains" -ForegroundColor White
Write-Host "4. Adicione: app.scopsy.com.br" -ForegroundColor White
Write-Host ""
