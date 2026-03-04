const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  console.log('✅ Webhook recebido:');
  console.log(JSON.stringify(data[0], null, 2));
}

check();
