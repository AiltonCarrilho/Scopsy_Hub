require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const APPROVED_DIR = path.join(__dirname, '../content-pipeline/4-approved');
const ARCHIVE_DIR = path.join(__dirname, '../content-pipeline/5-archived');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('🚀 Iniciando Deploy de Casos Aprovados...\n');

    if (!fs.existsSync(APPROVED_DIR)) {
        console.error(`❌ Diretório de aprovados não encontrado: ${APPROVED_DIR}`);
        return;
    }

    const files = fs.readdirSync(APPROVED_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
        console.log('⚠️  Nenhum arquivo JSON encontrado em content-pipeline/4-approved/');
        console.log('   (Mova os arquivos da pasta 3-review para 4-approved após revisar)');
        return;
    }

    console.log(`📂 Encontrados ${files.length} casos aprovados para deploy.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(APPROVED_DIR, file);

        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const caseData = JSON.parse(content);

            // Validação mínima
            if (!caseData.case_content || !caseData.vignette) {
                throw new Error('Campos obrigatórios case_content ou vignette ausentes.');
            }

            console.log(`📤 Enviando: ${caseData.case_title || file}...`);

            const { data, error } = await supabase
                .from('cases')
                .insert({
                    case_title: caseData.case_title || 'Caso Sem Título',
                    disorder: caseData.disorder || 'Não informado',
                    difficulty_level: caseData.difficulty_level || 'intermediate',
                    moment_type: caseData.moment_type || 'clinical_moment', // Default
                    case_content: caseData.case_content,
                    vignette: caseData.vignette,
                    status: 'active', // Já entra ativo pois foi aprovado manualmente
                    created_by: 'smart_pipeline',
                    quality_score: 5.0 // Assume qualidade máxima pois foi revisado
                })
                .select();

            if (error) throw error;

            console.log(`   ✅ Sucesso! ID: ${data[0].id}`);
            successCount++;

            // Mover para archived
            const archivePath = path.join(ARCHIVE_DIR, file);
            fs.renameSync(filePath, archivePath);
            console.log(`   📦 Arquivado em: 5-archived/${file}\n`);

        } catch (err) {
            console.error(`   ❌ Falha ao processar ${file}:`, err.message);
            failCount++;
        }
    }

    console.log('=====================================');
    console.log(`📊 RESUMO DEPLOY:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Falhas: ${failCount}`);
    console.log('=====================================');
}

main();
