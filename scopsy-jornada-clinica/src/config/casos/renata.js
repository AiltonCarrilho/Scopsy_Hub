/**
 * ============================================================================
 * SCOPSY - CONFIGURAÇÃO DO CASO CLÍNICO: RENATA
 * ============================================================================
 * 
 * Este arquivo contém toda a configuração do caso clínico "Renata".
 * Ele serve como MODELO para criar novos casos no futuro.
 * 
 * ============================================================================
 * COMO CRIAR UM NOVO CASO (PASSO A PASSO):
 * ============================================================================
 * 
 * 1. CRIAR O ASSISTANT NA OPENAI:
 *    - Acesse: https://platform.openai.com/assistants
 *    - Clique em "+ Create"
 *    - Nome: "[Nome do Paciente] - Paciente Simulada"
 *    - Model: gpt-4o
 *    - Temperature: 0.85
 *    - Instructions: Cole o prompt do paciente (veja docs/prompt_renata_openai.md como referência)
 *    - Salve e copie o ID (asst_xxx...)
 * 
 * 2. CRIAR O ARQUIVO DE CONFIGURAÇÃO:
 *    - Copie este arquivo (renata.js)
 *    - Renomeie para o novo caso (ex: marcos.js, julia.js)
 *    - Substitua TODOS os dados pelo novo paciente
 *    - Mantenha a mesma estrutura
 * 
 * 3. REGISTRAR NO INDEX:
 *    - Abra src/config/casos/index.js
 *    - Importe o novo arquivo
 *    - Adicione ao objeto CASOS
 * 
 * 4. CRIAR OS MOMENTOS DE VERDADE:
 *    - Cada caso deve ter seus próprios momentos
 *    - Use o formato documentado abaixo
 *    - Momentos são os pontos críticos onde o terapeuta precisa decidir
 * 
 * 5. CRIAR OS FEEDBACKS:
 *    - Cada momento tem 4 tipos de feedback (erro, ok, boa, excelente)
 *    - Escreva feedbacks específicos para cada momento
 * 
 * ============================================================================
 * ESTRUTURA DESTE ARQUIVO:
 * ============================================================================
 * 
 * - IDENTIFICACAO: Dados básicos do paciente
 * - ASSISTANT: Configuração do OpenAI Assistant
 * - ESTADO_INICIAL: Como o paciente começa o tratamento
 * - HISTORICO_REVELADO: O que já foi/pode ser revelado
 * - PROGRESSO: Marcos de evolução terapêutica
 * - MOMENTOS_DE_VERDADE: Pontos críticos de decisão
 * - FEEDBACKS: Respostas para cada classificação
 * - FRASES_LOADING: Mensagens enquanto IA processa
 * 
 * ============================================================================
 */

/**
 * CONFIGURAÇÃO COMPLETA DO CASO RENATA
 * 
 * @description Caso-piloto do Scopsy. Mulher de 34 anos com padrão de
 * autossacrifício e burnout. Excelente para treinar acolhida, validação,
 * e identificação de padrões de cuidar do outro antes de si.
 */
const RENATA = {
  
  // ==========================================================================
  // IDENTIFICAÇÃO DO CASO
  // ==========================================================================
  /**
   * Dados básicos do paciente virtual.
   * Esses dados aparecem na interface e ajudam o terapeuta a contextualizar.
   */
  identificacao: {
    id: 'renata',                              // ID único (usado na URL e banco)
    nome: 'Renata Moreira Lima',               // Nome completo
    idade: 34,                                 // Idade em anos
    profissao: 'Coordenadora administrativa',  // Profissão atual
    estadoCivil: 'Casada há 6 anos',          // Estado civil
    filhos: 'Beatriz (5) e Pedro (2)',        // Filhos se houver
    
    // Resumo curto para cards/listagens (máx 100 caracteres)
    resumoCurto: 'Burnout e autossacrifício. Não consegue pedir ajuda.',
    
    // Descrição completa para tela de briefing
    descricaoCompleta: `Renata é coordenadora administrativa em uma escola particular. 
    Casada há 6 anos com Marcos, engenheiro, tem dois filhos pequenos. 
    Chega à terapia relatando exaustão, dificuldade de "dar conta de tudo" 
    e um episódio recente de choro no trabalho que a assustou.`,
    
    // Queixa inicial (o que ela diz na primeira sessão)
    queixaInicial: `"Eu não estou dando conta de nada. Acordo cansada, durmo cansada. 
    Semana passada chorei no banheiro da escola por quinze minutos e não sei nem por quê. 
    Acho que estou com burnout, ou talvez precise de um remédio. 
    Vim aqui pra você me ajudar a voltar a funcionar direito."`,
    
    // Tags para filtros e busca
    tags: ['burnout', 'autossacrifício', 'parentalização', 'TCC', 'intermediário'],
    
    // Nível de dificuldade: 'basico', 'intermediario', 'avancado'
    dificuldade: 'intermediario',
    
    // Abordagem principal: 'TCC', 'ACT', 'DBT'
    abordagem: 'TCC',
    
    // Número de sessões do caso completo
    totalSessoes: 18
  },

  // ==========================================================================
  // CONFIGURAÇÃO DO OPENAI ASSISTANT
  // ==========================================================================
  /**
   * Dados de conexão com o OpenAI Assistant.
   * O Assistant deve ser criado previamente no painel da OpenAI.
   * 
   * IMPORTANTE: O prompt completo do Assistant está em:
   * docs/prompt_renata_openai.md
   */
  assistant: {
    // ID do Assistant (obtido ao criar no painel OpenAI)
    id: 'asst_5Qu5AoYGaL2TpADYphlcmY3L',
    
    // Modelo utilizado
    modelo: 'gpt-4o',
    
    // Configurações de geração
    temperature: 0.85,  // 0.0 = determinístico, 1.0 = criativo
    topP: 0.95,
    
    // Timeout em milissegundos para aguardar resposta
    timeoutMs: 30000,
    
    // Máximo de tentativas em caso de erro
    maxRetries: 3
  },

  // ==========================================================================
  // ESTADO INICIAL DO PACIENTE
  // ==========================================================================
  /**
   * Estado emocional/relacional no início do tratamento.
   * Esses valores mudam conforme as intervenções do terapeuta.
   * 
   * ESCALA: 0 a 10
   * 
   * - alianca: Confiança no terapeuta. Começa médio-baixo.
   * - profundidadePermitida: Quanto material profundo ela permite acessar.
   * - defesasAtivas: Quão "fechada" ela está. Alto = muito defendida.
   */
  estadoInicial: {
    alianca: 4.0,              // Ainda não confia totalmente
    profundidadePermitida: 3.0, // Só permite superfície inicialmente
    defesasAtivas: 7.0          // Bastante defendida no começo
  },

  // ==========================================================================
  // HISTÓRICO REVELÁVEL
  // ==========================================================================
  /**
   * Temas que podem ser revelados ao longo do tratamento.
   * Começam como 'false' e viram 'true' quando emergem na sessão.
   * 
   * COMO USAR PARA NOVOS CASOS:
   * Liste todos os temas importantes da história do paciente.
   * Organize do mais superficial ao mais profundo.
   * O sistema usa isso para:
   * 1. Rastrear o que já foi abordado
   * 2. Calibrar o contexto para o Assistant
   * 3. Determinar o que ainda pode emergir
   */
  historicoRevelado: {
    // Nível 1 - Superfície (emerge fácil)
    queixaInicial: true,           // Já vem na primeira fala
    sintomasFisicos: false,        // Insônia, dor de cabeça, tensão
    rotinaSobrecarregada: false,   // Trabalho + casa + filhos
    
    // Nível 2 - Intermediário (precisa de alguma aliança)
    infanciaDificil: false,        // Mãe depressiva, pai ausente
    papelDeCuidadora: false,       // Cuidou dos irmãos desde cedo
    ressentimentoMarcos: false,    // "Tenho que pedir ajuda"
    culpaMaternidade: false,       // Grita com os filhos, sente culpa
    
    // Nível 3 - Profundo (só com alta aliança e segurança)
    historiaOvoMexido: false,      // Memória nuclear: queimou a mão
    medoDeParar: false,            // "Se eu parar, tudo desmorona"
    nuncaCuidaramDela: false       // Nunca foi cuidada de verdade
  },

  // ==========================================================================
  // MARCOS DE PROGRESSO
  // ==========================================================================
  /**
   * Indicadores de evolução terapêutica.
   * Começam 'false' e viram 'true' quando observados.
   * 
   * COMO USAR PARA NOVOS CASOS:
   * Liste os sinais de progresso esperados para este paciente.
   * Cada caso terá progressos diferentes baseados em sua problemática.
   */
  progresso: {
    // Progressos de insight
    reconhecePadroes: false,       // Consegue ver os próprios padrões
    nomeiaEmocoes: false,          // Diz "estou triste" não "estou cansada"
    questionouCrenca: false,       // "Será que eu preciso fazer tudo?"
    
    // Progressos comportamentais
    toleraSilencio: false,         // Aguenta pausas sem preencher
    pediuAjuda: false,             // Pediu algo a alguém
    disseNao: false,               // Recusou uma demanda
    
    // Progressos emocionais
    expressouRaiva: false,         // Admitiu raiva/frustração
    chorouSemDesculpar: false,     // Chorou sem dizer "desculpa"
    faloudeSi: false               // Falou de si sem mencionar outros
  },

  // ==========================================================================
  // MOMENTOS DE VERDADE
  // ==========================================================================
  /**
   * CONCEITO:
   * Momentos de Verdade são pontos críticos na sessão onde o paciente
   * faz ou diz algo que exige uma decisão clínica do terapeuta.
   * A qualidade da resposta determina se a sessão avança ou estagna.
   * 
   * ESTRUTURA DE CADA MOMENTO:
   * - id: Identificador único (usado para tracking e feedback)
   * - nome: Nome descritivo do momento
   * - fase: Em qual fase do tratamento ocorre
   * - descricao: Explicação clínica do que está acontecendo
   * - gatilhos: Palavras/frases que indicam que o momento ocorreu
   * - oQueEstaEmJogo: Por que este momento é importante
   * - exemplosResposta: O que seria erro, ok, bom, excelente
   * 
   * COMO CRIAR MOMENTOS PARA NOVOS CASOS:
   * 1. Pense: "Quais são os pontos onde terapeutas costumam errar?"
   * 2. Para cada ponto, defina os gatilhos (o que o paciente diz)
   * 3. Defina as respostas possíveis e suas classificações
   * 4. Escreva o que está em jogo clinicamente
   */
  momentosDeVerdade: [
    {
      id: 'minimizacao',
      nome: 'A Minimização',
      fase: 'acolhida', // 'acolhida', 'avaliacao', 'conceitualizacao', 'intervencao', 'consolidacao', 'alta'
      sessoes: [1, 2, 3], // Em quais sessões pode ocorrer
      
      descricao: `Renata minimiza o próprio sofrimento, comparando-se com outros 
      que "têm problemas de verdade". Este é um padrão central dela - invalidar 
      suas próprias necessidades.`,
      
      // Palavras/frases que ativam este momento (lowercase para comparação)
      gatilhos: [
        'não é tão grave',
        'tem gente com problema pior',
        'tem gente com problema de verdade',
        'reclamando de barriga cheia',
        'besteira minha',
        'não quero dramatizar',
        'exagerando'
      ],
      
      oQueEstaEmJogo: `Renata está testando se o terapeuta vai concordar 
      (confirmando que ela não merece cuidado) ou se vai validar seu sofrimento. 
      Este momento define o tom da aliança terapêutica.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "É verdade, você tem muita coisa boa na vida. Mas vamos ver o que podemos fazer.",
          porqueEErro: "Concordou com a minimização. Confirmou que o sofrimento dela não é válido.",
          impacto: { alianca: -0.5, defesas: +1, profundidade: -0.3 }
        },
        ok: {
          exemplo: "Entendo. Me conta mais sobre esse cansaço.",
          porqueEOk: "Não concordou, mas também não explorou a minimização.",
          impacto: { alianca: +0.2 }
        },
        boa: {
          exemplo: "O que te faz pensar que seu sofrimento não é 'de verdade'?",
          porqueEBoa: "Explorou a crença por trás da minimização sem confrontar.",
          impacto: { alianca: +0.5, profundidade: +0.3, defesas: -0.5 }
        },
        excelente: {
          exemplo: "Percebo que você está cuidando de mim agora — se preocupando em não parecer ingrata. Mas aqui você não precisa fazer isso.",
          porqueEExcelente: "Nomeou o padrão em tempo real. Criou espaço seguro.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'celular',
      nome: 'O Celular / Interrupção',
      fase: 'acolhida',
      sessoes: [1, 2, 3, 4],
      
      descricao: `O celular vibra ou Renata menciona demandas do trabalho 
      invadindo seu espaço. O padrão de "ser indispensável" acontece ao vivo.`,
      
      gatilhos: [
        'celular',
        'mensagem da escola',
        'secretária não resolve',
        'deixa eu só ver',
        'pode ser urgente',
        'escola ligando'
      ],
      
      oQueEstaEmJogo: `O padrão está acontecendo AO VIVO na sessão. 
      É oportunidade de trabalhar em tempo real, não apenas falar sobre.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "Pode ver, sem problema.",
          porqueEErro: "Perdeu oportunidade de ouro. O padrão aconteceu e não foi notado.",
          impacto: { alianca: 0 }
        },
        ok: {
          exemplo: "Tudo bem. Podemos continuar depois.",
          porqueEOk: "Acomodou, mas não explorou.",
          impacto: { alianca: +0.1 }
        },
        boa: {
          exemplo: "Posso te fazer uma pergunta sobre isso que acabou de acontecer?",
          porqueEBoa: "Sinalizou que percebeu. Abre espaço para explorar.",
          impacto: { alianca: +0.5, profundidade: +0.3, defesas: -0.5 }
        },
        excelente: {
          exemplo: "Eu percebi sua expressão quando viu a mensagem. Mesmo sendo 'nada', seu corpo reagiu. O que aconteceu dentro de você nesse momento?",
          porqueEExcelente: "Traz para o corpo, para o presente. Ensina Renata a perceber os próprios sinais.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'sorriso_triste',
      nome: 'O Sorriso Triste',
      fase: 'acolhida',
      sessoes: [1, 2, 3, 4, 5],
      
      descricao: `Renata sorri ao falar de coisas difíceis. 
      Incongruência entre expressão e conteúdo.`,
      
      gatilhos: [
        '*sorri*',
        '*sorriso*',
        '*risada*',
        'rio pra não chorar',
        '*olhos tristes*'
      ],
      
      oQueEstaEmJogo: `A defesa dissociativa está ativa. 
      Oportunidade de conectar ao afeto real por trás do sorriso.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "[Ignora e continua a conversa]",
          porqueEErro: "Perdeu a incongruência. Sessão fica no intelectual.",
          impacto: { alianca: 0 }
        },
        ok: {
          exemplo: "Você parece estar sentindo muita coisa agora.",
          porqueEOk: "Nota algo, mas não especifica a incongruência.",
          impacto: { alianca: +0.2 }
        },
        boa: {
          exemplo: "Você sorriu agora, mas o que você descreveu não parece motivo para sorrir.",
          porqueEBoa: "Aponta a incongruência gentilmente.",
          impacto: { alianca: +0.5, profundidade: +0.3, defesas: -0.5 }
        },
        excelente: {
          exemplo: "Você sorriu agora, mas seus olhos me dizem outra coisa. O que esse sorriso está guardando?",
          porqueEExcelente: "Confrontação gentil e convite ao afeto.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'defesa_marido',
      nome: 'A Defesa do Marido',
      fase: 'avaliacao',
      sessoes: [2, 3, 4, 5],
      
      descricao: `Renata defende Marcos antes de qualquer crítica, 
      mas deixa escapar mágoa na frase "tenho que pedir".`,
      
      gatilhos: [
        'bom marido',
        'ele trabalha muito',
        'ajuda quando pode',
        'tenho que pedir',
        'quando eu peço',
        'coitado'
      ],
      
      oQueEstaEmJogo: `Mágoa encoberta. A frase "tenho que pedir" revela 
      expectativa de ser vista sem precisar falar.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "Como é a divisão de tarefas entre vocês?",
          porqueEErro: "Pergunta razoável mas intelectualiza. Perde o afeto.",
          impacto: { alianca: +0.1 }
        },
        ok: {
          exemplo: "Parece que você gostaria de mais ajuda dele.",
          porqueEOk: "Capta algo, mas não vai fundo.",
          impacto: { alianca: +0.3 }
        },
        boa: {
          exemplo: "'O problema é que eu tenho que pedir.' Me fala mais sobre esse problema.",
          porqueEBoa: "Repete as palavras dela, convida a expandir.",
          impacto: { alianca: +0.5, profundidade: +0.3, defesas: -0.5 }
        },
        excelente: {
          exemplo: "O que aconteceu dentro de você quando você disse 'eu tenho que pedir'?",
          porqueEExcelente: "Captura o momento vivo. Acessa a dor de não ser vista.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'historia_mae',
      nome: 'A História da Infância',
      fase: 'avaliacao',
      sessoes: [3, 4, 5, 6],
      
      descricao: `Renata conta sobre a infância — mãe depressiva, 
      pai ausente, cuidar dos irmãos. Material nuclear.`,
      
      gatilhos: [
        'minha mãe',
        'depressão',
        'meus irmãos',
        'cuidava deles',
        'meu pai viajava',
        'desde pequena',
        'ovo mexido',
        'queimei a mão'
      ],
      
      oQueEstaEmJogo: `Material nuclear. Origem dos esquemas. 
      Requer presença, não análise. Silêncio pode ser a melhor intervenção.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "Deve ter sido difícil. Como você vê a relação entre essa história e o que você vive hoje?",
          porqueEErro: "Intelectualizou rápido demais. Pulou do sentir para o analisar.",
          impacto: { alianca: -0.3, profundidade: -0.3 }
        },
        ok: {
          exemplo: "Isso parece ter sido muito pesado pra você.",
          porqueEOk: "Valida, mas genérico.",
          impacto: { alianca: +0.3 }
        },
        boa: {
          exemplo: "O que você sente enquanto me conta isso agora?",
          porqueEBoa: "Retorna ao presente, ancora no corpo.",
          impacto: { alianca: +0.5, profundidade: +0.5, defesas: -0.5 }
        },
        excelente: {
          exemplo: "[Silêncio de 5-8 segundos com presença] ou 'Você nunca contou pra ninguém... até agora.'",
          porqueEExcelente: "Honra o peso. Comunica 'eu aguento estar aqui com você'.",
          impacto: { alianca: +1, profundidade: +1, defesas: -1 }
        }
      }
    },
    
    {
      id: 'resistencia_tarefa',
      nome: 'Resistência à Tarefa',
      fase: 'intervencao',
      sessoes: [6, 7, 8, 9, 10],
      
      descricao: `Terapeuta propõe experimento e Renata resiste sutilmente, 
      com justificativas "razoáveis".`,
      
      gatilhos: [
        'posso tentar',
        'essa semana é difícil',
        'semana que vem',
        'ele chega cansado',
        'não sei se consigo',
        'vou ver se dá'
      ],
      
      oQueEstaEmJogo: `Resistência disfarçada de razoabilidade. 
      Aceitar collude com evitação. Confrontar bruscamente rompe aliança.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "Tudo bem, fazemos semana que vem então.",
          porqueEErro: "Colludiu com a evitação. Padrão permanece protegido.",
          impacto: { alianca: 0, defesas: +0.5 }
        },
        erro_alt: {
          exemplo: "Você vai adiar suas necessidades de novo.",
          porqueEErro: "Confrontação sem aliança. Rompe vínculo.",
          impacto: { alianca: -1, defesas: +1 }
        },
        ok: {
          exemplo: "O que te preocupa em fazer isso essa semana?",
          porqueEOk: "Explora, mas não conecta ao padrão maior.",
          impacto: { alianca: +0.2 }
        },
        boa: {
          exemplo: "Eu ouvi você dizer 'posso tentar' e depois várias razões para não ser agora. O que está acontecendo?",
          porqueEBoa: "Descreve sem julgar. Convida reflexão.",
          impacto: { alianca: +0.5, profundidade: +0.3, defesas: -0.5 }
        },
        excelente: {
          exemplo: "Percebe que você acabou de cuidar do cansaço do Marcos, das preocupações dele... e sua necessidade ficou pro final da fila de novo?",
          porqueEExcelente: "Conecta ao padrão central. Compassivo E preciso.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'alta_prematura',
      nome: 'Querer Encerrar Antes',
      fase: 'intervencao',
      sessoes: [8, 9, 10, 11, 12],
      
      descricao: `Renata diz que está melhor e sugere encerrar. 
      A frase "não quero tomar seu tempo" revela crença ainda ativa.`,
      
      gatilhos: [
        'acho que estou melhor',
        'não quero tomar seu tempo',
        'já posso encerrar',
        'você tem outros pacientes',
        'não preciso mais vir'
      ],
      
      oQueEstaEmJogo: `Melhora sintomática é real, mas crença central 
      ainda governa. Alta prematura = trabalho incompleto.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "Que bom! Podemos espaçar as sessões.",
          porqueEErro: "Alta prematura. Sintomas podem voltar.",
          impacto: { alianca: 0, profundidade: -0.5 }
        },
        ok: {
          exemplo: "Fico feliz que você esteja melhor. Vamos avaliar juntos.",
          porqueEOk: "Não aceita imediatamente, mas não explora.",
          impacto: { alianca: +0.2 }
        },
        boa: {
          exemplo: "Você está melhor sim. E o que te fez pensar em 'não tomar meu tempo'?",
          porqueEBoa: "Celebra E continua investigando.",
          impacto: { alianca: +0.5, profundidade: +0.3 }
        },
        excelente: {
          exemplo: "Eu também percebo sua melhora, e é real. Mas me conta: o que te fez dizer que não quer 'tomar meu tempo'?",
          porqueEExcelente: "Valida, celebra, E usa a fala como material clínico.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -0.5 }
        }
      }
    },
    
    {
      id: 'tarefa_nao_feita',
      nome: 'A Tarefa Não Feita',
      fase: 'intervencao',
      sessoes: [7, 8, 9, 10, 11, 12],
      
      descricao: `Renata não fez a tarefa e se antecipa para manejar 
      a suposta decepção do terapeuta.`,
      
      gatilhos: [
        'desculpa, não deu tempo',
        'você deve estar chateado',
        'eu sei que eu deveria',
        'não consegui fazer',
        'me perdoa'
      ],
      
      oQueEstaEmJogo: `Ela está cuidando da emoção do terapeuta antes 
      da própria. Padrão ativo na transferência.`,
      
      exemplosResposta: {
        erro: {
          exemplo: "O que te impediu de fazer?",
          porqueEErro: "Pode soar como cobrança disfarçada.",
          impacto: { alianca: -0.2, defesas: +0.3 }
        },
        ok: {
          exemplo: "Sem problema, vamos entender o que aconteceu.",
          porqueEOk: "Gentil, mas perde a oportunidade.",
          impacto: { alianca: +0.2 }
        },
        boa: {
          exemplo: "Antes de falar da tarefa — o que te fez pensar que eu ficaria chateado?",
          porqueEBoa: "Prioriza o padrão sobre a tarefa.",
          impacto: { alianca: +0.5, profundidade: +0.3 }
        },
        excelente: {
          exemplo: "Percebi que você já está tentando descobrir se eu estou chateado. Primeiro: não estou. Segundo: o que te fez pensar que eu ficaria?",
          porqueEExcelente: "Trabalha transferência. Expõe padrão de antecipar.",
          impacto: { alianca: +1, profundidade: +0.5, defesas: -1 }
        }
      }
    },
    
    {
      id: 'solucao_prematura',
      nome: 'Terapeuta Pula para Solução',
      fase: 'intervencao',
      sessoes: [1, 2, 3, 4, 5, 6, 7, 8],
      
      descricao: `ERRO DO TERAPEUTA: Oferece estratégias antes de 
      explorar suficientemente o sofrimento.`,
      
      // Este momento é diferente - detectamos pelo comportamento do TERAPEUTA
      gatilhos: [
        'vamos pensar em estratégias',
        'que tal fazer uma lista',
        'você poderia tentar',
        'uma técnica que funciona'
      ],
      
      oQueEstaEmJogo: `Quando terapeuta pula para solução, Renata se fecha. 
      Respostas ficam curtas e concordantes. Material profundo fica inacessível.`,
      
      // Neste caso, qualquer gatilho é erro
      reacaoRenata: {
        verbal: [
          "Ah, sim, claro.",
          "Tá, pode ser.",
          "É, posso tentar."
        ],
        naoVerbal: [
          "*se ajeita na cadeira*",
          "*sorri de forma forçada*",
          "*resposta mais curta*"
        ],
        impacto: { alianca: -0.3, defesas: +0.5, profundidade: -0.5 }
      }
    }
  ],

  // ==========================================================================
  // FEEDBACKS PRÉ-ESCRITOS
  // ==========================================================================
  /**
   * Feedbacks que aparecem após cada momento de verdade.
   * Organizados por momento_id e classificação.
   * 
   * ESTRUTURA:
   * - titulo: Headline do feedback
   * - corpo: Explicação detalhada
   * - alternativa: O que seria uma resposta melhor (se aplicável)
   * - reflexao: Pergunta para o terapeuta pensar
   */
  feedbacks: {
    minimizacao: {
      erro: {
        titulo: "⚠️ Cuidado: Você concordou com a minimização",
        corpo: `Quando Renata disse que "tem gente com problema pior", ela estava 
        testando se você validaria o sofrimento dela. Ao concordar, mesmo que 
        parcialmente, você confirmou a crença de que ela não merece atenção.
        
        Note que após sua resposta, Renata provavelmente ficou mais curta, 
        mais "eficiente". Isso indica que ela se fechou.`,
        alternativa: `Uma alternativa seria: "O que te faz pensar que seu 
        sofrimento não é 'de verdade'?" — Isso explora a crença sem concordar 
        nem discordar.`,
        reflexao: "Quando você ouve alguém minimizar o próprio sofrimento, qual é seu primeiro impulso?"
      },
      boa: {
        titulo: "✅ Boa exploração",
        corpo: `Você não caiu na armadilha de concordar com a minimização. 
        Ao explorar o que está por trás dessa fala, você abriu espaço para 
        Renata questionar a própria crença.`,
        alternativa: `Para ir ainda mais fundo, você poderia nomear o padrão: 
        "Percebo que você está cuidando de mim agora — se preocupando em não 
        parecer ingrata."`,
        reflexao: "O que você observou na reação dela após sua pergunta?"
      },
      excelente: {
        titulo: "🌟 Intervenção excelente",
        corpo: `Você nomeou o padrão em tempo real. Isso é TCC encarnada — 
        não apenas falar sobre padrões, mas percebê-los e nomeá-los quando 
        acontecem.
        
        Note a reação de Renata: provavelmente houve uma pausa, talvez 
        emoção. Você criou um momento de insight.`,
        alternativa: null,
        reflexao: "Como você percebeu que ela estava 'cuidando de você' naquele momento?"
      }
    },
    
    sorriso_triste: {
      erro: {
        titulo: "⚠️ Oportunidade perdida: O sorriso incongruente",
        corpo: `Renata sorriu ao falar de algo doloroso. Essa incongruência 
        entre expressão e conteúdo é uma defesa — ela aprendeu a sorrir para 
        não preocupar os outros.
        
        Ao não comentar, você perdeu a chance de ajudá-la a perceber essa 
        desconexão entre o que sente e o que mostra.`,
        alternativa: `Você poderia dizer: "Você sorriu agora, mas o que você 
        descreveu não parece motivo para sorrir. O que esse sorriso está 
        guardando?"`,
        reflexao: "Você notou o sorriso? O que te impediu de comentar?"
      },
      boa: {
        titulo: "✅ Boa percepção da incongruência",
        corpo: `Você notou e apontou a incongruência entre o sorriso e o 
        conteúdo. Isso ajuda Renata a perceber suas próprias defesas.`,
        alternativa: `Para aprofundar: "O que acontece se você não sorrir 
        agora?"`,
        reflexao: "O que mudou na sessão após você nomear essa incongruência?"
      },
      excelente: {
        titulo: "🌟 Confrontação gentil perfeita",
        corpo: `Você confrontou a incongruência de forma gentil e curiosa, 
        não julgadora. A pergunta "o que esse sorriso está guardando" convida 
        Renata a olhar para a função da defesa.
        
        Esse tipo de intervenção frequentemente leva a emoção genuína ou 
        insight profundo.`,
        alternativa: null,
        reflexao: "Como você equilibra confrontar e acolher ao mesmo tempo?"
      }
    },
    
    // ... adicionar feedbacks para outros momentos conforme necessário
    
    solucao_prematura: {
      erro: {
        titulo: "⚠️ Solução prematura detectada",
        corpo: `Você ofereceu estratégias antes de Renata se sentir 
        completamente ouvida. Note a resposta dela: "Ah, sim, claro" — 
        isso é concordância vazia.
        
        Quando pulamos para solução cedo demais, comunicamos que sentir 
        é menos importante que resolver. Para alguém como Renata, que passou 
        a vida "resolvendo" sem nunca ter espaço para sentir, isso confirma 
        o padrão.`,
        alternativa: `Antes de qualquer estratégia, explore: "Me conta como 
        é acordar todos os dias sentindo esse peso." Deixe-a ser ouvida 
        primeiro.`,
        reflexao: "O que te levou a oferecer soluções nesse momento? Algum desconforto com o silêncio ou com a dor dela?"
      }
    }
  },

  // ==========================================================================
  // FRASES DE LOADING
  // ==========================================================================
  /**
   * Mensagens exibidas enquanto a IA processa a resposta.
   * Transformam a espera em momento de aprendizado.
   * 
   * COMO PERSONALIZAR PARA NOVOS CASOS:
   * Crie frases relacionadas aos temas específicos do paciente.
   */
  frasesLoading: [
    {
      texto: "Observe: pausas do paciente podem indicar acesso a material emocional...",
      categoria: "observacao"
    },
    {
      texto: "Renata está refletindo sobre sua pergunta...",
      categoria: "contexto"
    },
    {
      texto: "Dica: silêncios são intervenções poderosas na TCC.",
      categoria: "dica"
    },
    {
      texto: "Reflita: o que você observou na linguagem corporal descrita?",
      categoria: "reflexao"
    },
    {
      texto: "Pacientes como Renata frequentemente testam se o terapeuta vai 'aguentar' suas emoções.",
      categoria: "clinica"
    },
    {
      texto: "O padrão de minimização costuma aparecer quando o paciente começa a confiar.",
      categoria: "clinica"
    },
    {
      texto: "Lembre-se: validar não é concordar. É reconhecer a experiência.",
      categoria: "dica"
    },
    {
      texto: "A pressa em resolver pode comunicar que sentir não é bem-vindo aqui.",
      categoria: "dica"
    }
  ],

  // ==========================================================================
  // CONFIGURAÇÕES DA SESSÃO
  // ==========================================================================
  /**
   * Parâmetros de funcionamento de cada sessão.
   */
  configuracoesSessao: {
    // Duração estimada de cada sessão em minutos
    duracaoEstimadaMin: 20,
    
    // Número de trocas de mensagem antes de sugerir encerramento
    trocasParaSugerirEncerramento: 15,
    
    // Intervalo para mostrar frases de loading (ms)
    intervaloFrasesLoading: 3000
  }
};

// =============================================================================
// EXPORTAÇÃO
// =============================================================================
/**
 * Exporta a configuração completa do caso.
 * 
 * IMPORTANTE: Não modifique esta linha ao criar novos casos.
 * Cada caso deve exportar seu próprio objeto.
 */
module.exports = RENATA;
