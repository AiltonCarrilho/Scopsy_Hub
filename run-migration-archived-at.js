require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🔄 EXECUTANDO MIGRAÇÃO: Adicionar coluna archived_at\n');

  try {
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, 'sql-scripts', '10-add-archived-at.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL a executar:');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log();

    // Executar SQL
    console.log('⚡ Executando migração...');
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Se não tiver a função exec_sql, tentar executar diretamente
      console.log('⚠️  Função exec_sql não encontrada, tentando método alternativo...');

      // Método alternativo: executar via SQL direto
      const { error: directError } = await supabase
        .from('user_journey_progress')
        .select('archived_at')
        .limit(1);

      if (directError && directError.code === '42703') {
        console.log('\n❌ A coluna ainda não existe. Por favor, execute o SQL manualmente:');
        console.log('\n1. Abra o Supabase Dashboard');
        console.log('2. Vá em SQL Editor');
        console.log('3. Cole e execute o conteúdo do arquivo:');
        console.log(`   ${sqlPath}`);
        console.log('\n4. Depois execute este script novamente para verificar.');
        process.exit(1);
      }
    }

    // Verificar se a coluna foi criada
    console.log('\n✅ Verificando se a coluna foi criada...');
    const { data: testData, error: testError } = await supabase
      .from('user_journey_progress')
      .select('id, archived_at')
      .limit(1);

    if (testError) {
      throw testError;
    }

    console.log('✅ Coluna archived_at criada com sucesso!');
    console.log('\n📊 Teste de query:');
    console.log(`   - Registros encontrados: ${testData ? testData.length : 0}`);
    if (testData && testData.length > 0) {
      console.log(`   - Primeiro registro: ID=${testData[0].id}, archived_at=${testData[0].archived_at || 'NULL'}`);
    }

    console.log('\n🎉 Migração completa!');
    console.log('✅ Agora você pode reiniciar o servidor e testar a jornada clínica.');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📝 Stack trace:', error);

    console.log('\n💡 SOLUÇÃO MANUAL:');
    console.log('1. Abra o Supabase Dashboard (https://app.supabase.com)');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em "SQL Editor" no menu lateral');
    console.log('4. Clique em "New Query"');
    console.log('5. Cole o seguinte SQL:');
    console.log('\n─'.repeat(60));
    console.log(`
ALTER TABLE user_journey_progress
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_journey_progress_archived_at
ON user_journey_progress(archived_at);
    `.trim());
    console.log('─'.repeat(60));
    console.log('\n6. Clique em "RUN" para executar');
    console.log('7. Reinicie o servidor Node.js');

    process.exit(1);
  }
}

runMigration();
