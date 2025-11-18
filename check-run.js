const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function checkRun() {
  const threadId = 'thread_UNdcvKCvAG54LaHtlYlUkUFX'; // Do teste anterior
  
  try {
    // Listar runs deste thread
    const runs = await openai.beta.threads.runs.list(threadId);
    
    console.log('📋 Runs neste thread:\n');
    
    for (const run of runs.data) {
      console.log('Run ID:', run.id);
      console.log('Status:', run.status);
      console.log('Criado:', new Date(run.created_at * 1000).toLocaleString());
      
      if (run.last_error) {
        console.log('❌ Erro:', run.last_error.message);
      }
      
      console.log('---');
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkRun();