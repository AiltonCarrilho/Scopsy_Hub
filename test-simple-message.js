require('dotenv').config({ path: '.env.local' });

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testSimple() {
  try {
    console.log('🧪 Teste simples OpenAI\n');
    
    // Criar thread
    console.log('1. Criando thread...');
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread:', thread.id);
    console.log('');
    
    // Adicionar mensagem
    console.log('2. Enviando mensagem...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Olá! Pode me dar as boas-vindas em uma frase curta?'
    });
    
    // Criar run com polling automático
    console.log('3. Aguardando resposta (até 60 segundos)...');
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: 'asst_gF2t61jT43Kgwx6mb6pDEty3' // Scopsy Case
    });
    
    console.log('Status:', run.status);
    console.log('');
    
    if (run.status === 'completed') {
      // Pegar resposta
      const messages = await openai.beta.threads.messages.list(thread.id);
      const response = messages.data[0].content[0].text.value;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ RESPOSTA DO ASSISTENTE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(response);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
    } else if (run.status === 'failed') {
      console.log('❌ Run falhou!');
      if (run.last_error) {
        console.log('Erro:', run.last_error.message);
      }
    } else {
      console.log('⚠️ Status inesperado:', run.status);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSimple();