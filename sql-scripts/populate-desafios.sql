-- POPULAÇÃO DE DESAFIOS CLÍNICOS
-- Casos de alta qualidade seguindo formato Scopsy
-- CASO 1: Resistência Técnica (BASIC)
INSERT INTO cases (
        case_title,
        disorder,
        difficulty_level,
        moment_type,
        case_content,
        vignette,
        status,
        created_by
    )
VALUES (
        'Mariana Lopes - Resistência Técnica',
        'Transtorno de Ansiedade Generalizada (DSM-5-TR)',
        'basic',
        'resistencia_tecnica',
        '{
    "tag": "2026.01.15.1432",
    "moment_type": "resistencia_tecnica",
    "difficulty_level": "basic",
    "concept_key": "resistencia_tecnica_validacao_exploracao",
    "skills_trained": ["alianca_terapeutica", "validacao_emocional", "exploracao_colaborativa"],
    "context": {
      "session_number": "Sessão 4",
      "client_name": "Mariana Lopes",
      "client_age": 29,
      "diagnosis": "Transtorno de Ansiedade Generalizada (DSM-5-TR)",
      "what_just_happened": "Você sugeriu registro de preocupações diárias. Ela suspira e empurra o papel de lado."
    },
    "critical_moment": {
      "dialogue": "Mariana: \"Olha, eu sei que você explicou direitinho, mas eu já tentei escrever essas coisas antes e nunca adiantou. Eu começo, até faço um ou dois dias, depois me sinto meio boba… parece que fico ainda mais ansiosa pensando nisso.\"",
      "non_verbal": "Cruza os braços, encosta no encosto da cadeira, olhar desviado. Tom defensivo, mas não agressivo.",
      "emotional_tone": "Ceticismo misturado com frustração e medo de se frustrar de novo."
    },
    "decision_point": "O QUE VOCÊ DIZ OU FAZ AGORA?",
    "options": [
      {"letter": "A", "response": "Faz sentido você ficar desanimada se já tentou antes e não funcionou. O que foi mais difícil nessas tentativas?", "approach": "Validação + Exploração"},
      {"letter": "B", "response": "Entendo, mas esse registro é bem importante no tratamento da ansiedade. Sem ele, a gente perde uma parte essencial.", "approach": "Ênfase técnica"},
      {"letter": "C", "response": "Tudo bem, então vamos pular isso e focar só nas sessões por enquanto.", "approach": "Evitação permissiva"},
      {"letter": "D", "response": "Talvez você não tenha feito do jeito certo antes. Vamos tentar de novo seguindo o modelo.", "approach": "Correção diretiva"}
    ],
    "expert_choice": "A",
    "expert_reasoning": {
      "why_this_works": "A opção A valida a experiência prévia negativa sem concordar que a técnica não funciona. Explorar o que deu errado antes transforma resistência em informação clínica. Isso preserva a aliança e permite adaptar a técnica, aumentando adesão.",
      "why_others_fail": {
        "option_B": "Coloca a técnica acima da experiência da cliente, soando impositivo e aumentando resistência.",
        "option_C": "Reforça evitação e ensina que desconforto leva à retirada da intervenção.",
        "option_D": "Implica erro da cliente, ativando defensividade e vergonha."
      },
      "core_principle": "Resistência é dado clínico, não obstáculo.",
      "what_happens_next": "Mariana explica que escrever tudo a fazia ruminar por horas. Vocês adaptam para anotações curtas, só palavras-chave. Ela concorda em testar por três dias."
    },
    "theoretical_depth": {
      "key_references": [
        "Beck, J. S. (2011). Cognitive Behavior Therapy. Guilford.",
        "Leahy, R. L. (2003). Roadblocks in CBT. Guilford."
      ],
      "related_concepts": ["Resistência em TCC", "Colaboração terapêutica"],
      "clinical_nuance": "Segundo Beck (2011), intervenções devem ser colaborativas e ajustadas à experiência do cliente; resistência costuma sinalizar necessidade de adaptação, não insistência."
    },
    "learning_point": {
      "pattern_to_recognize": "Cliente recusa técnica + histórico de tentativas frustradas → resistência protetiva.",
      "instant_response": "Validar → Explorar experiências passadas → Adaptar técnica.",
      "common_mistake": "Iniciantes insistem na técnica; experientes investigam o significado da recusa."
    }
  }'::jsonb,
        'Mariana: "Olha, eu sei que você explicou direitinho, mas eu já tentei escrever essas coisas antes e nunca adiantou..."',
        'active',
        'sistema_populate'
    );
-- CASO 2: Ruptura de Aliança (INTERMEDIATE)
INSERT INTO cases (
        case_title,
        disorder,
        difficulty_level,
        moment_type,
        case_content,
        vignette,
        status,
        created_by
    )
VALUES (
        'Carlos Eduardo - Ruptura de Aliança',
        'Transtorno Depressivo Maior (DSM-5-TR)',
        'intermediate',
        'ruptura_alianca',
        '{
    "tag": "2026.01.15.1233",
    "moment_type": "ruptura_alianca",
    "difficulty_level": "intermediate",
    "concept_key": "ruptura_alianca_reparacao_imediata",
    "skills_trained": ["reparacao_alianca", "metacomunicacao", "humildade_terapeutica"],
    "context": {
      "session_number": "Sessão 7",
      "client_name": "Carlos Eduardo",
      "client_age": 42,
      "diagnosis": "Transtorno Depressivo Maior (DSM-5-TR)",
      "what_just_happened": "Você interrompeu para corrigir um pensamento distorcido. Ele para de falar abruptamente."
    },
    "critical_moment": {
      "dialogue": "Carlos: \"Sabe, eu tava tentando te explicar uma coisa importante pra mim, mas… deixa pra lá. Acho que você já decidiu o que eu tô sentindo, né? Tipo, você é o psicólogo, você sabe mais que eu sobre mim mesmo.\"",
      "non_verbal": "Mãos tensas no colo, mandíbula apertada. Olha para o relógio. Perna balançando.",
      "emotional_tone": "Mágoa, frustração, ironia defensiva. Testando se você vai validar ou se defender."
    },
    "decision_point": "O QUE VOCÊ DIZ OU FAZ AGORA?",
    "options": [
      {"letter": "A", "response": "Você tem toda razão, eu te cortei. Me desculpa. O que você estava tentando me dizer?", "approach": "Reparação direta + responsabilização"},
      {"letter": "B", "response": "Não foi minha intenção te interromper, mas é importante a gente identificar esses pensamentos.", "approach": "Justificativa técnica"},
      {"letter": "C", "response": "Percebo que você ficou incomodado. Quer falar sobre isso?", "approach": "Validação genérica"},
      {"letter": "D", "response": "Eu só estava tentando te ajudar a ver o padrão. Não precisa reagir assim.", "approach": "Defensiva + minimização"}
    ],
    "expert_choice": "A",
    "expert_reasoning": {
      "why_this_works": "Assume total responsabilidade sem justificativas ou racionalizações. Mostra humildade terapêutica genuína e devolve controle ao cliente. Safran & Muran (2000) demonstram que reparação rápida e autêntica fortalece aliança mais que nunca errar.",
      "why_others_fail": {
        "option_B": "Justifica o erro em vez de repará-lo. Cliente ouve ''minha técnica importa mais que você''.",
        "option_C": "Genérica demais. Não assume responsabilidade direta. Parece deflexão.",
        "option_D": "Culpabiliza o cliente pela própria reação. Ruptura se aprofunda gravemente."
      },
      "core_principle": "Reparação > Perfeição. Errar e consertar constrói mais aliança que nunca errar.",
      "what_happens_next": "Carlos relaxa visivelmente, retoma o que estava dizendo. Conta que ninguém nunca pediu desculpas assim pra ele. A sessão se aprofunda."
    },
    "theoretical_depth": {
      "key_references": [
        "Safran, J. D., & Muran, J. C. (2000). Negotiating the Therapeutic Alliance. Guilford.",
        "Beck, J. S. (2011). Cognitive Behavior Therapy. Guilford."
      ],
      "related_concepts": ["Ruptura de aliança", "Metacomunicação", "Autenticidade terapêutica"],
      "clinical_nuance": "Segundo Safran e Muran (2000), rupturas são oportunidades: clientes testam se terapeutas repetem padrões relacionais antigos ou oferecem experiência corretiva através de reparação autêntica."
    },
    "learning_point": {
      "pattern_to_recognize": "Cliente expressa mágoa/frustração + tom irônico/sarcástico → ruptura de aliança em curso.",
      "instant_response": "Parar tudo → Assumir responsabilidade → Pedir desculpas sinceras → Retomar onde cliente foi interrompido.",
      "common_mistake": "Iniciantes justificam ou defendem; experientes assumem erro sem hesitação e reparam imediatamente."
    }
  }'::jsonb,
        'Carlos: "Sabe, eu tava tentando te explicar uma coisa importante pra mim, mas… deixa pra lá..."',
        'active',
        'sistema_populate'
    );