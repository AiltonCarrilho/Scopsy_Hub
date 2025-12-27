/**
 * Script para testar webhook do Kiwify manualmente
 * Simula uma compra aprovada
 */

const fetch = require('node-fetch');

const webhookURL = 'https://scopsy-hub.onrender.com/api/webhooks/kiwify';

// Dados de teste - SUBSTITUA com o email real da compra
const testEvent = {
  event: 'order.approved',
  order_id: 'TEST_' + Date.now(),
  customer: {
    email: 'SEU_EMAIL_AQUI@example.com', // ← TROCAR AQUI
    name: 'Cliente Teste'
  },
  subscription_id: 'SUB_TEST_' + Date.now(),
  product: {
    id: 'PROD_TEST',
    name: 'Scopsy Premium'
  }
};

async function testWebhook() {
  console.log('🧪 Testando webhook do Kiwify...\n');
  console.log('📤 Enviando evento:', JSON.stringify(testEvent, null, 2));
  console.log('\n🔗 URL:', webhookURL);
  console.log('\n⏳ Aguardando resposta...\n');

  try {
    const response = await fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEvent)
    });

    const data = await response.text();

    console.log('📥 Resposta:');
    console.log('   Status:', response.status);
    console.log('   Body:', data);

    if (response.status === 200) {
      console.log('\n✅ Webhook processado com sucesso!');
      console.log('   Verifique no banco de dados se o usuário foi atualizado para Premium.');
    } else {
      console.log('\n❌ Erro no webhook!');
      console.log('   Verifique os logs do Render para mais detalhes.');
    }
  } catch (error) {
    console.error('\n❌ Erro na requisição:', error.message);
  }
}

// Executar teste
testWebhook();
