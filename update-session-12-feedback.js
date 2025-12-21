/**
 * ATUALIZAÇÃO DE FEEDBACKS - SESSÃO 12
 * Melhora feedbacks para serem mais formativos e clínicos
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JOURNEY_ID = 'b438bc8c-8f25-4def-90f5-bca524876366'; // Carolina - TAG

// ========================================
// FEEDBACKS MELHORADOS PARA SESSÃO 12
// ========================================
const IMPROVED_OPTIONS = [
  {
    label: 'A',
    text: 'Encerrar rapidamente para evitar emoções.',
    is_best: false,
    feedback: {
      immediate: 'Carolina parece desconfortável e diz que esperava algo diferente.',
      explanation: `**Por que esta escolha é inadequada:**

• **Evitação de emoções legítimas:** Encerrar rapidamente comunica que emoções sobre o fim da relação terapêutica são indesejadas ou problemáticas. Isso contradiz anos de trabalho validando emoções.

• **Ruptura abrupta:** Encerramento precipitado pode ser vivido como abandono, especialmente para pacientes com padrões de apego ansioso (comum no TAG).

• **Perda de oportunidade consolidatória:** A última sessão é momento privilegiado para integração de ganhos, atribuição de competências ao paciente e reforço de autoeficácia.

• **Impacto no desfecho:** Pesquisas indicam que qualidade do encerramento está associada a manutenção de ganhos terapêuticos a longo prazo (Marx & Gelso, 1987; Quintana & Holahan, 1992).

**O que fazer:**
Reconhecer que despedida é parte natural e saudável do processo. Validar emoções emergentes, revisar jornada e criar ritual de transição.`,
      impact: {
        rapport: -2,
        insight: 0,
        behavioral_change: 0,
        symptom_reduction: -1
      }
    }
  },
  {
    label: 'B',
    text: 'Revisar jornada, reconhecer competências adquiridas e realizar ritual de despedida saudável.',
    is_best: true,
    feedback: {
      immediate: 'Carolina se emociona positivamente, fala sobre gratidão e sobre como se sente mais forte agora.',
      explanation: `**Por que esta é a escolha ideal:**

• **Revisão integrativa:** Resgatar linha do tempo terapêutica (da Sessão 1 até agora) ajuda o paciente a perceber concretamente sua evolução, fortalecendo autoeficácia e senso de agência.

• **Atribuição de competências:** Nomear explicitamente as habilidades desenvolvidas (questionamento socrático, experimentos comportamentais, manejo de preocupação) consolida aprendizado e previne desvalorização pós-alta.

• **Luto terapêutico saudável:** Encerramento bem conduzido permite processamento adaptativo da perda do vínculo. Validar tristeza da despedida sem patologizá-la normaliza transição.

• **Ritual de continuidade:** Metáforas, objetos simbólicos ou carta escrita pelo paciente sobre aprendizados fortalecem sensação de continuidade após alta.

• **Prevenção de recaída:** Última sessão reforça plano de manutenção, sinais de alerta e quando buscar ajuda novamente (já abordado na Sessão 11, mas aqui ganha contorno emocional).

**Base teórica:**
- TCC: Ênfase em atribuição correta de mudança ao esforço do paciente (Beck, 2011)
- Fatores comuns: Aliança terapêutica até o fim previne efeito de "porta giratória" (Horvath et al., 2011)
- Pesquisa de desfecho: Qualidade do encerramento prediz manutenção de ganhos 6-12 meses após alta

**Impacto esperado:**
Paciente sai com senso de competência, gratidão realista, tristeza saudável e clareza sobre continuidade autônoma.`,
      impact: {
        rapport: 5,
        insight: 5,
        behavioral_change: 4,
        symptom_reduction: 4
      }
    }
  },
  {
    label: 'C',
    text: 'Repetir técnicas aprendidas sem discutir vínculo.',
    is_best: false,
    feedback: {
      immediate: 'Ela participa, mas parece estar esperando algo mais significativo.',
      explanation: `**Por que esta escolha é inadequada:**

• **Foco técnico vs. relacional:** Revisar apenas técnicas ignora que terapia também é relação. Pacientes frequentemente sentem que precisam "performar" até o fim, sem espaço para processar a despedida.

• **Perda do aspecto humano:** TCC é frequentemente criticada por ser "fria" — encerramento mecânico reforça esse estereótipo inadequado. Vínculo terapêutico é fator preditivo robusto de desfecho (Lambert & Barley, 2001).

• **Evitação relacional do terapeuta:** Não discutir vínculo pode refletir desconforto do próprio terapeuta com despedidas. Isso modela evitação experiencial — justamente o que tratamos no TAG.

• **Oportunidade perdida:** Última sessão é momento de nomear explicitamente o que a relação significou, validar ambivalência sobre término e celebrar crescimento conjunto.

**Analogia clínica:**
É como terminar uma maratona olhando apenas para o cronômetro, sem reconhecer a jornada, o esforço e as pessoas que correram junto.

**O que fazer:**
Equilibrar revisão técnica com validação relacional. Exemplo: "Antes de revisarmos as técnicas, quero reconhecer que hoje é nossa última sessão. Como você está se sentindo sobre isso?"`,
      impact: {
        rapport: 2,
        insight: 2,
        behavioral_change: 2,
        symptom_reduction: 2
      }
    }
  },
  {
    label: 'D',
    text: 'Evitar despedida explícita para que não seja difícil.',
    is_best: false,
    feedback: {
      immediate: 'Carolina percebe que algo está estranho e sai confusa sobre o que significa o fim.',
      explanation: `**Por que esta escolha é problemática:**

• **Evitação modelada:** Evitar despedida explícita modela evitação experiencial — exatamente o padrão que tratamos no TAG. Terapeuta precisa modelar enfrentamento saudável de emoções difíceis.

• **Confusão sobre término:** Não nomear que é a última sessão gera ambiguidade. Paciente pode não compreender que é realmente o fim, ou sentir que algo foi mal resolvido.

• **Perda de encerramento ritual:** Humanos precisam de rituais de transição. Casamentos têm cerimônias, funerais têm velórios, formaturas têm colação. Terapia também precisa de ritual de fechamento.

• **Risco de regressão sintomática:** Encerramento ambíguo pode gerar ansiedade de separação, especialmente em pacientes com TAG que já lidam com intolerância à incerteza.

• **Contratransferência não resolvida:** Evitar despedida frequentemente reflete dificuldade do terapeuta com perdas. Isso precisa ser processado em supervisão, não atuado na sessão.

**Evidência clínica:**
Estudos qualitativos mostram que pacientes valorizam enormemente despedidas explícitas, mesmo quando difíceis (Knox et al., 2011). Ambiguidade no término é fator de risco para retorno precoce à terapia por motivos não clínicos.

**O que fazer:**
Nomear explicitamente: "Hoje é nossa última sessão. Vamos usar esse tempo para revisar sua jornada e nos despedirmos adequadamente."`,
      impact: {
        rapport: 0,
        insight: 1,
        behavioral_change: 0,
        symptom_reduction: 0
      }
    }
  }
];

// ========================================
// ATUALIZAR SESSÃO 12
// ========================================
async function updateSession12() {
  try {
    console.log('🔄 Atualizando feedbacks da Sessão 12...\n');

    // 1. Buscar sessão 12
    const { data: session, error: fetchError } = await supabase
      .from('journey_sessions')
      .select('*')
      .eq('journey_id', JOURNEY_ID)
      .eq('session_number', 12)
      .single();

    if (fetchError) throw fetchError;

    console.log(`✅ Sessão encontrada: ${session.session_title}`);
    console.log(`   ID: ${session.id}\n`);

    // 2. Atualizar com novos feedbacks
    const { error: updateError } = await supabase
      .from('journey_sessions')
      .update({
        options: IMPROVED_OPTIONS
      })
      .eq('id', session.id);

    if (updateError) throw updateError;

    console.log('✅ Feedbacks atualizados com sucesso!\n');
    console.log('📊 MELHORIAS IMPLEMENTADAS:');
    console.log('   • Explicações teóricas aprofundadas');
    console.log('   • Citações de pesquisa (Marx & Gelso, Lambert & Barley, Knox et al.)');
    console.log('   • Justificativas clínicas detalhadas');
    console.log('   • Analogias e exemplos práticos');
    console.log('   • Orientações sobre "o que fazer"');
    console.log('   • Formatação com markdown para melhor leitura\n');

    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   1. Recarregue a página da jornada');
    console.log('   2. Teste a Sessão 12');
    console.log('   3. Veja feedbacks muito mais ricos!\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erro ao atualizar:', error);
    process.exit(1);
  }
}

// ========================================
// EXECUTAR
// ========================================
updateSession12();
