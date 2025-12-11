/**
 * Teste OpenAI - Scopsy Case Assistant
 */

require('dotenv').config();
const { getOrCreateThread, sendMessage } = require('./src/services/openai-service');

async function testOpenAI() {
  console.log('🧪 Iniciando teste OpenAI...\n');

  try {
    // 1. Criar thread
    console.log('📝 Criando thread...');
    const threadId = await getOrCreateThread('test-user-123', 'case');
    console.log('✅ Thread criado:', threadId);
    console.log('');

    // 2. Enviar mensagem START
    console.log('💬 Enviando mensagem: START');
    console.log('⏳ Aguardando resposta (pode demorar 10-30 segundos)...\n');
    
    const response = await sendMessage(threadId, 'case', 'START', 'test-user-123');

    // 3. Mostrar resposta
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 RESPOSTA DO ASSISTENTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(response.response);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 METADADOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🪪 Thread ID:', response.threadId);
    console.log('🔢 Tokens usados:', response.tokensUsed);
    console.log('🤖 Assistente:', response.assistantType);
    console.log('⏰ Timestamp:', response.timestamp);
    console.log('');

    // 4. Calcular custo aproximado
    const custoPorMilTokens = 0.015; // $0.015 por 1K tokens (aproximado)
    const custoReais = (response.tokensUsed / 1000) * custoPorMilTokens * 5; // Conversão USD→BRL
    console.log('💰 Custo aproximado:', custoReais.toFixed(4), 'R$');
    console.log('');

    console.log('✅ TESTE CONCLUÍDO COM SUCESSO! 🎉');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:');
    console.error(error.message);
    console.error('');
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testOpenAI();