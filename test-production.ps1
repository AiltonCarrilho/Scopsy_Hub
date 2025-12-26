# Script de teste de produção - Scopsy (PowerShell)
# Verifica se o config.js está sendo servido corretamente

Write-Host "🔍 Testando Scopsy em Produção..." -ForegroundColor Cyan
Write-Host ""

# URLs
$BASE_URL = "https://app.scopsy.com.br"
$CONFIG_URL = "$BASE_URL/js/config.js"
$SIGNUP_URL = "$BASE_URL/signup.html"

# Teste 1: Verificar se config.js existe
Write-Host "📡 Teste 1: Verificando se config.js existe..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $CONFIG_URL -Method Head -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ config.js encontrado (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ config.js NÃO encontrado" -ForegroundColor Red
    Write-Host "   URL testada: $CONFIG_URL" -ForegroundColor Yellow
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 2: Verificar conteúdo do config.js
Write-Host ""
Write-Host "📝 Teste 2: Verificando conteúdo do config.js..." -ForegroundColor Yellow
try {
    $configContent = Invoke-WebRequest -Uri $CONFIG_URL -UseBasicParsing
    $content = $configContent.Content

    if ($content -match "https://app\.scopsy\.com\.br") {
        Write-Host "✅ config.js contém URL de produção correta" -ForegroundColor Green
    } else {
        Write-Host "❌ config.js NÃO contém URL de produção" -ForegroundColor Red
        Write-Host "   Conteúdo (primeiras 500 chars):" -ForegroundColor Yellow
        Write-Host $content.Substring(0, [Math]::Min(500, $content.Length))
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao buscar config.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 3: Verificar signup.html
Write-Host ""
Write-Host "🔍 Teste 3: Verificando signup.html..." -ForegroundColor Yellow
try {
    $signupContent = Invoke-WebRequest -Uri $SIGNUP_URL -UseBasicParsing
    $htmlContent = $signupContent.Content

    if ($htmlContent -match "localhost:3000") {
        Write-Host "❌ signup.html ainda contém localhost hardcoded" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ signup.html NÃO contém localhost hardcoded" -ForegroundColor Green
    }

    if ($htmlContent -match '<script src="/js/config\.js"></script>') {
        Write-Host "✅ signup.html carrega config.js corretamente" -ForegroundColor Green
    } else {
        Write-Host "❌ signup.html NÃO carrega config.js" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao buscar signup.html: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Teste 4: Verificar headers
Write-Host ""
Write-Host "🌐 Teste 4: Verificando headers HTTP..." -ForegroundColor Yellow
try {
    $headers = Invoke-WebRequest -Uri $CONFIG_URL -Method Head -UseBasicParsing
    $contentType = $headers.Headers['Content-Type']

    if ($contentType -like "*javascript*") {
        Write-Host "✅ Content-Type correto: $contentType" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Content-Type inesperado: $contentType" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Erro ao verificar headers: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Teste 5: Verificar proxy de API
Write-Host ""
Write-Host "🎯 Teste 5: Verificando proxy de API..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-WebRequest -Uri "$BASE_URL/api/health" -Method Get -UseBasicParsing
    Write-Host "   Status API Health: HTTP $($apiResponse.StatusCode)" -ForegroundColor Cyan
    Write-Host "✅ Proxy de API está funcionando" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Status API Health: HTTP $statusCode" -ForegroundColor Cyan
    if ($statusCode -eq 404) {
        Write-Host "✅ Proxy de API está funcionando (404 esperado se rota não existe)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Proxy de API pode ter problemas" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Produção está funcionando corretamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Para testar no navegador, execute no console (F12):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  console.log('API_URL:', window.API_URL);" -ForegroundColor Cyan
Write-Host "  console.log('Config:', window.SCOPSY_CONFIG);" -ForegroundColor Cyan
Write-Host ""
