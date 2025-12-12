/**
 * Emotion Injector for Fish Audio
 *
 * Detecta o contexto/sentimento do texto e injeta
 * as emotion tags apropriadas do Fish Audio.
 *
 * Fish Audio usa sintaxe: (emotion) no início da frase
 * Pode combinar até 3: (confident)(empathetic)(soft tone)
 */

// Mapeamento de contextos para emoções Fish Audio
const CONTEXT_EMOTIONS = {
  // Atendimento ao Cliente
  customer_service: {
    // Respostas empáticas
    empathy: ['empathetic', 'soft tone'],
    // Pedido de desculpas
    apology: ['apologetic', 'soft tone'],
    // Oferecendo solução
    solution: ['confident', 'determined'],
    // Tranquilizando cliente
    reassurance: ['calm', 'soft tone'],
    // Confirmando informação
    confirmation: ['confident'],
    // Despedida/encerramento
    closing: ['grateful', 'soft tone'],
    // Urgência/prioridade
    urgency: ['determined', 'in a hurry tone'],
    // Celebração/sucesso
    success: ['happy', 'satisfied'],
    // Default para atendimento
    default: ['confident', 'empathetic']
  },

  // Vendas
  sales: {
    // Apresentação de produto
    pitch: ['excited', 'confident'],
    // Benefícios
    benefits: ['enthusiastic', 'confident'],
    // Fechamento
    closing: ['confident', 'determined'],
    // Objeção
    objection_handling: ['empathetic', 'confident'],
    // Urgência de oferta
    urgency: ['excited', 'in a hurry tone'],
    // Default para vendas
    default: ['confident', 'excited']
  },

  // Suporte Técnico
  technical_support: {
    // Diagnóstico
    diagnosis: ['curious', 'calm'],
    // Instrução passo-a-passo
    instruction: ['calm', 'confident'],
    // Problema resolvido
    resolved: ['satisfied', 'confident'],
    // Escalação
    escalation: ['empathetic', 'determined'],
    // Default para suporte
    default: ['calm', 'confident']
  },

  // Neutro/Default
  neutral: {
    default: ['confident']
  }
};

// Palavras-chave para detecção de contexto
const KEYWORDS = {
  // Empatia
  empathy: [
    'entendo', 'compreendo', 'sei como', 'imagino', 'percebo',
    'faz sentido', 'é compreensível', 'é natural'
  ],

  // Desculpas
  apology: [
    'desculp', 'sinto muito', 'lamento', 'perdão', 'peço desculpa',
    'nos desculpe', 'pedimos desculpas', 'lamentamos'
  ],

  // Solução
  solution: [
    'vou resolver', 'já identifiquei', 'encontrei', 'a solução',
    'posso fazer', 'vamos', 'irei', 'farei', 'providenciar',
    'já estou', 'imediatamente', 'agora mesmo'
  ],

  // Tranquilização
  reassurance: [
    'fique tranquil', 'não se preocupe', 'pode ficar', 'está tudo',
    'vai dar certo', 'conte conosco', 'estamos aqui', 'garanto'
  ],

  // Confirmação
  confirmation: [
    'confirmo', 'correto', 'exatamente', 'isso mesmo', 'perfeito',
    'certo', 'entendido', 'anotado', 'registrado'
  ],

  // Encerramento
  closing: [
    'mais alguma', 'posso ajudar', 'à disposição', 'bom dia',
    'boa tarde', 'boa noite', 'obrigad', 'agradec', 'foi um prazer'
  ],

  // Urgência
  urgency: [
    'urgente', 'prioridade', 'imediato', 'agora', 'rápido',
    'já já', 'em instantes', 'prioritário'
  ],

  // Sucesso
  success: [
    'sucesso', 'consegui', 'pronto', 'feito', 'resolvido',
    'concluído', 'finalizado', 'perfeito'
  ],

  // Instrução
  instruction: [
    'primeiro', 'segundo', 'depois', 'em seguida', 'passo',
    'clique', 'selecione', 'acesse', 'vá em', 'abra'
  ]
};

class EmotionInjector {
  /**
   * @param {string} scenarioType - Tipo de cenário (customer_service, sales, etc)
   * @param {object} options - Opções adicionais
   */
  constructor(scenarioType = 'customer_service', options = {}) {
    this.scenarioType = scenarioType;
    this.emotions = CONTEXT_EMOTIONS[scenarioType] || CONTEXT_EMOTIONS.neutral;
    this.options = {
      maxEmotions: 2,           // Máximo de emoções combinadas
      alwaysInject: true,       // Sempre injetar (usa default se não detectar)
      ...options
    };

    console.log(`✓ EmotionInjector inicializado para: ${scenarioType}`);
  }

  /**
   * Analisa texto e injeta emoções apropriadas
   *
   * @param {string} text - Texto para processar
   * @param {object} context - Contexto adicional (emoção anterior, etc)
   * @returns {string} - Texto com emotion tags
   */
  injectEmotion(text, context = {}) {
    // Detectar o tipo de resposta
    const detectedContext = this.detectContext(text, context);

    // Pegar emoções para esse contexto
    let emotions = this.emotions[detectedContext] || this.emotions.default;

    // Limitar número de emoções
    emotions = emotions.slice(0, this.options.maxEmotions);

    // Construir tags
    const emotionTags = emotions.map(e => `(${e})`).join('');

    // Se já tem tags no texto, não duplicar
    if (text.trim().startsWith('(')) {
      return text;
    }

    return `${emotionTags} ${text}`;
  }

  /**
   * Detecta o contexto/intenção do texto
   *
   * @param {string} text - Texto para analisar
   * @param {object} context - Contexto adicional
   * @returns {string} - Tipo de contexto detectado
   */
  detectContext(text, context = {}) {
    const lowerText = text.toLowerCase();

    // Verificar cada categoria de keywords
    for (const [contextType, keywords] of Object.entries(KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return contextType;
        }
      }
    }

    // Se há contexto de emoção do cliente, ajustar resposta
    if (context.customerEmotion) {
      if (['angry', 'frustrated', 'upset'].includes(context.customerEmotion)) {
        return 'empathy';
      }
    }

    // Default
    return 'default';
  }

  /**
   * Detecta emoção específica para uso direto
   *
   * @param {string} text - Texto para analisar
   * @returns {string[]} - Array de emoções detectadas
   */
  detectEmotions(text) {
    const context = this.detectContext(text);
    return this.emotions[context] || this.emotions.default;
  }

  /**
   * Processa resposta do LLM e adiciona emoções apropriadas
   * Versão mais inteligente que considera múltiplas frases
   *
   * @param {string} response - Resposta completa do LLM
   * @param {object} context - Contexto da conversa
   * @returns {string} - Resposta com emoções injetadas
   */
  processLLMResponse(response, context = {}) {
    // Dividir em frases
    const sentences = response.split(/(?<=[.!?])\s+/);

    if (sentences.length === 1) {
      // Frase única - injetar normalmente
      return this.injectEmotion(response, context);
    }

    // Múltiplas frases - processar cada uma
    // Mas só a primeira frase recebe a tag principal
    const processed = sentences.map((sentence, index) => {
      if (index === 0) {
        return this.injectEmotion(sentence.trim(), context);
      }
      // Frases subsequentes: verificar se precisa de tag diferente
      const newContext = this.detectContext(sentence);
      if (newContext !== 'default' && newContext !== this.detectContext(sentences[0])) {
        // Mudança de contexto - adicionar nova tag
        const emotions = this.emotions[newContext] || [];
        if (emotions.length > 0) {
          return `(${emotions[0]}) ${sentence.trim()}`;
        }
      }
      return sentence.trim();
    });

    return processed.join(' ');
  }

  /**
   * Ajusta emoção baseado na emoção do cliente
   * Para respostas mais contextuais
   *
   * @param {string} customerEmotion - Emoção detectada do cliente
   * @returns {string[]} - Emoções recomendadas para resposta
   */
  getResponseEmotionForCustomer(customerEmotion) {
    const responseMap = {
      // Cliente irritado -> resposta calma e empática
      angry: ['empathetic', 'calm', 'soft tone'],
      frustrated: ['empathetic', 'calm'],
      upset: ['empathetic', 'soft tone'],

      // Cliente ansioso -> resposta tranquilizadora
      anxious: ['calm', 'reassuring'],
      worried: ['calm', 'confident'],
      nervous: ['calm', 'soft tone'],

      // Cliente feliz -> resposta positiva
      happy: ['happy', 'excited'],
      satisfied: ['satisfied', 'grateful'],
      excited: ['excited', 'happy'],

      // Cliente confuso -> resposta clara e paciente
      confused: ['calm', 'patient'],
      uncertain: ['confident', 'calm'],

      // Cliente neutro -> resposta profissional
      neutral: ['confident'],

      // Default
      default: ['confident', 'empathetic']
    };

    return responseMap[customerEmotion] || responseMap.default;
  }

  /**
   * Atualiza o tipo de cenário em runtime
   *
   * @param {string} newScenario - Novo tipo de cenário
   */
  setScenario(newScenario) {
    this.scenarioType = newScenario;
    this.emotions = CONTEXT_EMOTIONS[newScenario] || CONTEXT_EMOTIONS.neutral;
    console.log(`✓ EmotionInjector atualizado para: ${newScenario}`);
  }

  /**
   * Adiciona mapeamento customizado de emoções
   *
   * @param {string} contextType - Tipo de contexto
   * @param {string[]} emotions - Array de emoções
   */
  addCustomMapping(contextType, emotions) {
    this.emotions[contextType] = emotions;
    console.log(`✓ Mapeamento customizado adicionado: ${contextType}`);
  }

  /**
   * Adiciona keywords customizadas
   *
   * @param {string} contextType - Tipo de contexto
   * @param {string[]} keywords - Array de palavras-chave
   */
  static addCustomKeywords(contextType, keywords) {
    if (!KEYWORDS[contextType]) {
      KEYWORDS[contextType] = [];
    }
    KEYWORDS[contextType].push(...keywords);
  }
}

// Exportar classe e constantes
module.exports = EmotionInjector;
module.exports.CONTEXT_EMOTIONS = CONTEXT_EMOTIONS;
module.exports.KEYWORDS = KEYWORDS;
