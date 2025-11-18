require('dotenv').config();
const OpenAI = require('openai');

console.log('🧪 Teste OpenAI Simples\n');

const apiKey = process.env.OPENAI_API_KEY;

console.log('1. API Key carregada?', !!apiKey);
console.log('2. Tamanho:', apiKey?.length);
console.log('3. Primeiros chars:', apiKey?.substring(0, 20));
console.log('');

const openai = new OpenAI({
  apiKey: apiKey
});

async function test() {
  try {
    console.log('4. Criando thread...');
    const thread = await openai.beta.threads.create();
    console.log('✅ SUCESSO!');
    console.log('Thread ID:', thread.id);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('Status:', error.status);
    console.error('Code:', error.code);
  }
}

test();