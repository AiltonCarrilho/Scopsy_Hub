const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '[REVOKED_OPENAI_KEY]'
});

async function test() {
  try {
    const thread = await openai.beta.threads.create();
    console.log('✅ FUNCIONOU! Thread:', thread.id);
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

test();