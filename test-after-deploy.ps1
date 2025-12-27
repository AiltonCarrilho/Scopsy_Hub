# Script para testar deploy após conclusão
# Scopsy - Verificação Pós-Deploy

Write-Host ""
Write-Host "🧪 Testando deploy em produção..." -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Teste 1: config.js existe?
Write-Host "📡 Teste 1: Verificando se config.js existe..." -ForegroundColor Yellow
try {
    $config = Invoke-WebRequest -Uri "https://app.scopsy.com.br/js/config.js" -UseBasicParsing
    Write-Host "   ✅ config.js encontrado! (HTTP $($config.StatusCode))" -ForegroundColor Green

    # Verificar conteúdo
    if ($config.Content -match "https://app\.scopsy\.com\.br") {
        Write-Host "   ✅ config.js contém URL de produção correta!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ config.js NÃO contém URL de produção" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ config.js retorna 404" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# Teste 2: signup.html não tem localhost?
Write-Host "📝 Teste 2: Verificando signup.html..." -ForegroundColor Yellow
try {
    $signup = Invoke-WebRequest -Uri "https://app.scopsy.com.br/signup.html" -UseBasicParsing

    if ($signup.Content -match "const API_URL = 'http://localhost:3000'") {
        Write-Host "   ❌ signup.html AINDA tem localhost hardcoded" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "   ✅ signup.html NÃO tem localhost hardcoded!" -ForegroundColor Green
    }

    if ($signup.Content -match '<script src="/js/config\.js"></script>') {
        Write-Host "   ✅ signup.html carrega config.js corretamente!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ signup.html NÃO carrega config.js" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "   ❌ Erro ao buscar signup.html: $($_.Exception.Message)" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Teste 3: index.html (página principal)
Write-Host "🏠 Teste 3: Verificando página principal..." -ForegroundColor Yellow
try {
    $index = Invoke-WebRequest -Uri "https://app.scopsy.com.br/" -UseBasicParsing
    Write-Host "   ✅ Página principal carregada! (HTTP $($index.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao carregar página principal" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Teste 4: Proxy de API
Write-Host "🌐 Teste 4: Verificando proxy de API..." -ForegroundColor Yellow
try {
    $api = Invoke-WebRequest -Uri "https://app.scopsy.com.br/api/health" -UseBasicParsing
    Write-Host "   ✅ Proxy de API funcionando! (HTTP $($api.StatusCode))" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404 -or $statusCode -eq 502) {
        Write-Host "   ⚠️  Proxy retornou $statusCode (pode ser normal se rota não existe no backend)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Erro no proxy: $statusCode" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host ""
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Frontend está funcionando corretamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Teste final no navegador:" -ForegroundColor Cyan
    Write-Host "   1. Abra: https://app.scopsy.com.br/signup.html" -ForegroundColor White
    Write-Host "   2. Pressione F12 → Console" -ForegroundColor White
    Write-Host "   3. Digite: console.log(window.API_URL)" -ForegroundColor White
    Write-Host "   4. Deve mostrar: https://app.scopsy.com.br" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ALGUNS TESTES FALHARAM" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "1. Deploy ainda não propagou (aguarde mais 2-3 minutos)" -ForegroundColor Yellow
    Write-Host "2. Cache do CDN (limpe cache da Vercel no dashboard)" -ForegroundColor Yellow
    Write-Host "3. Branch errada foi deployada (verifique logs do deploy)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Tente executar novamente em 2 minutos:" -ForegroundColor Cyan
    Write-Host "   .\test-after-deploy.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
