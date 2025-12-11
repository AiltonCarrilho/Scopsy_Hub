const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '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'
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