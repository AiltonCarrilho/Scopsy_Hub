/**
 * RESET E POPULAR SÉRIES
 * Deleta séries antigas e cria novas com episódios
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAndPopulate() {
  try {
    console.log('🗑️  ETAPA 1: Deletando séries antigas...\n');

    const { data, error } = await supabase
      .from('case_series')
      .delete()
      .in('series_slug', ['marcos_tag_completa', 'ana_depressao_completa', 'carlos_panico_completa'])
      .select();

    if (error) {
      console.error('❌ Erro ao deletar:', error.message);
      process.exit(1);
    }

    console.log(`✅ Deletadas ${data.length} séries\n`);
    console.log('⏳ Aguardando 2 segundos...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📚 ETAPA 2: Populando séries...\n');
    console.log('=====================================\n');

    // Executar script de população
    execSync('node populate-case-series.js', {
      stdio: 'inherit',
      cwd: __dirname
    });

  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

resetAndPopulate();
