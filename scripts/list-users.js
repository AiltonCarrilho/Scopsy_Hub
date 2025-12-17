const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

async function listUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, name, plan')
        .limit(10);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('Usuários disponíveis:');
    console.log(JSON.stringify(data, null, 2));
}

listUsers();
