# Test DNS Configuration - Scopsy (PowerShell)
# Execute após configurar DNS no Cloudflare

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🧪 TESTANDO CONFIGURAÇÃO DNS - SCOPSY" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Teste 1: DNS Resolution
Write-Host "📡 Teste 1: Resolução DNS de lab.scopsy.com.br" -ForegroundColor Yellow
Write-Host "------------------------------------------------"
nslookup lab.scopsy.com.br
Write-Host ""

# Teste 2: Health Check Webhook Kiwify
Write-Host "🏥 Teste 2: Health Check Webhook Kiwify" -ForegroundColor Yellow
Write-Host "------------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "https://lab.scopsy.com.br/api/webhooks/kiwify/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        Write-Host "Response: $($response.Content)"
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
}
Write-Host ""

# Teste 3: Backend API (deve retornar 401)
Write-Host "🔌 Teste 3: Backend API (deve retornar erro de auth)" -ForegroundColor Yellow
Write-Host "------------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "https://lab.scopsy.com.br/api/auth/me" -UseBasicParsing
    Write-Host "⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "✅ Status: $statusCode (esperado - sem token)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ Status: 404 - Backend não está respondendo" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Status: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Teste 4: Verificar origem da resposta
Write-Host "🖥️  Teste 4: Verificar origem da resposta" -ForegroundColor Yellow
Write-Host "------------------------------------------------"
try {
    $response = Invoke-WebRequest -Uri "https://lab.scopsy.com.br/api/webhooks/kiwify/health" -UseBasicParsing
    $server = $response.Headers["Server"]

    if ($server -match "Vercel") {
        Write-Host "❌ PROBLEMA: Respondendo do VERCEL (deveria ser Render)" -ForegroundColor Red
        Write-Host "Server: $server"
    } elseif ($server -match "cloudflare") {
        Write-Host "✅ Respondendo via Cloudflare (proxy para Render)" -ForegroundColor Green
        Write-Host "Server: $server"
    } else {
        Write-Host "✅ Respondendo do Render" -ForegroundColor Green
        Write-Host "Server: $server"
    }
} catch {
    Write-Host "⚠️  Não foi possível verificar servidor" -ForegroundColor Yellow
}
Write-Host ""

# Resumo
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "📊 RESUMO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se todos os testes passaram:" -ForegroundColor White
Write-Host "✅ Configuração OK! Pode testar Kiwify." -ForegroundColor Green
Write-Host ""
Write-Host "Se houver erros:" -ForegroundColor White
Write-Host "1. Verificar DNS no Cloudflare" -ForegroundColor Yellow
Write-Host "2. Confirmar: lab -> scopsy-hub.onrender.com" -ForegroundColor Yellow
Write-Host "3. Proxy DESATIVADO (nuvem cinza)" -ForegroundColor Yellow
Write-Host "4. Aguardar propagacao (5-10 min)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
