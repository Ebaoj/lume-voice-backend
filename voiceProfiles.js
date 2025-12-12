/**
 * Voice Profiles for Fish Audio
 *
 * Perfis de voz pré-configurados para diferentes cenários
 * de simulação de atendimento.
 *
 * Cada perfil define:
 * - Voz (voice ID)
 * - Prosódia (velocidade, volume)
 * - Emoção padrão
 * - Configurações de variabilidade
 */

// IDs das vozes PT-BR testadas
const PT_BR_VOICES = {
  // Femininas
  isabela: '5661bf8cb97740fcb10d2f756abf7779',
  josi: 'd3b63756081b49c6b3849aa22ec59eb0',
  camila: '5ff77a8b3143479f99f73ae6d2c88b09',
  senhora: '74f28613269e48d19d001f0c39e901dc',

  // Masculinas
  adam: '1a61293f8fa8441f804deb10d0b2bc95',
  narrador: 'df1fa6d2ae194b3ebcbae60df48fde35',
};

/**
 * Perfis de voz para diferentes cenários
 */
const VOICE_PROFILES = {
  // ===== ATENDIMENTO AO CLIENTE =====

  /**
   * Atendente calma e profissional
   * Ideal para: SAC, reclamações, problemas
   */
  customer_service_calm: {
    name: 'Atendente Calma',
    description: 'Voz feminina calma e profissional para atendimento',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.1,      // Levemente mais rápida que normal
      volume: 0        // Volume normal
    },
    defaultEmotion: ['calm', 'empathetic'],
    temperature: 0.85,  // Menos variação para consistência
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'customer_service'
  },

  /**
   * Atendente confiante e resolutiva
   * Ideal para: Resolução de problemas, soluções
   */
  customer_service_confident: {
    name: 'Atendente Confiante',
    description: 'Voz feminina confiante para resolver problemas',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.15,     // Um pouco mais rápida
      volume: 1        // Levemente mais alta
    },
    defaultEmotion: ['confident', 'determined'],
    temperature: 0.9,
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'customer_service'
  },

  /**
   * Atendente urgente
   * Ideal para: Situações de prioridade, emergências
   */
  customer_service_urgent: {
    name: 'Atendente Urgente',
    description: 'Voz feminina com tom de urgência controlada',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.2,      // Mais rápida
      volume: 2        // Mais alta
    },
    defaultEmotion: ['determined', 'in a hurry tone'],
    temperature: 0.9,
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'customer_service'
  },

  /**
   * Atendente empática
   * Ideal para: Clientes irritados, reclamações graves
   */
  customer_service_empathetic: {
    name: 'Atendente Empática',
    description: 'Voz feminina empática e acolhedora',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.05,     // Levemente mais lenta (mais cuidadosa)
      volume: -1       // Levemente mais baixa (mais íntima)
    },
    defaultEmotion: ['empathetic', 'soft tone'],
    temperature: 0.8,   // Mais consistente
    top_p: 0.85,
    latency: 'balanced',
    scenarioType: 'customer_service'
  },

  // ===== VENDAS =====

  /**
   * Vendedor entusiasmado
   * Ideal para: Pitches, apresentações de produto
   */
  sales_enthusiastic: {
    name: 'Vendedor Entusiasmado',
    description: 'Voz feminina animada para vendas',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.15,
      volume: 3        // Mais energia
    },
    defaultEmotion: ['excited', 'confident'],
    temperature: 0.95,  // Mais variação para soar natural
    top_p: 0.95,
    latency: 'balanced',
    scenarioType: 'sales'
  },

  /**
   * Vendedor consultivo
   * Ideal para: Vendas complexas, B2B
   */
  sales_consultative: {
    name: 'Vendedor Consultivo',
    description: 'Voz feminina profissional para vendas consultivas',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.1,
      volume: 0
    },
    defaultEmotion: ['confident', 'curious'],
    temperature: 0.85,
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'sales'
  },

  // ===== SUPORTE TÉCNICO =====

  /**
   * Suporte técnico paciente
   * Ideal para: Instruções passo-a-passo
   */
  technical_support_patient: {
    name: 'Suporte Paciente',
    description: 'Voz feminina calma para suporte técnico',
    voiceId: PT_BR_VOICES.isabela,
    model: 's1',
    prosody: {
      speed: 1.0,      // Velocidade normal para clareza
      volume: 0
    },
    defaultEmotion: ['calm', 'confident'],
    temperature: 0.8,   // Mais consistente para instruções
    top_p: 0.85,
    latency: 'normal',  // Prioriza qualidade sobre velocidade
    scenarioType: 'technical_support'
  },

  // ===== VOZES MASCULINAS =====

  /**
   * Atendente masculino profissional
   */
  male_professional: {
    name: 'Atendente Masculino',
    description: 'Voz masculina profissional',
    voiceId: PT_BR_VOICES.adam,
    model: 's1',
    prosody: {
      speed: 1.1,
      volume: 0
    },
    defaultEmotion: ['confident'],
    temperature: 0.9,
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'customer_service'
  },

  // ===== CLIENTES (para simulação) =====

  /**
   * Cliente irritado
   * Para simular cliente com problema
   */
  customer_angry: {
    name: 'Cliente Irritado',
    description: 'Voz para simular cliente irritado',
    voiceId: PT_BR_VOICES.adam,  // Voz masculina para cliente
    model: 's1',
    prosody: {
      speed: 1.2,      // Fala mais rápida (irritado)
      volume: 3        // Mais alto
    },
    defaultEmotion: ['angry', 'frustrated'],
    temperature: 0.95,
    top_p: 0.95,
    latency: 'balanced',
    scenarioType: 'neutral'
  },

  /**
   * Cliente confuso
   */
  customer_confused: {
    name: 'Cliente Confuso',
    description: 'Voz para simular cliente confuso',
    voiceId: PT_BR_VOICES.adam,
    model: 's1',
    prosody: {
      speed: 0.95,     // Mais lento (pensando)
      volume: -1
    },
    defaultEmotion: ['confused', 'uncertain'],
    temperature: 0.9,
    top_p: 0.9,
    latency: 'balanced',
    scenarioType: 'neutral'
  },

  /**
   * Cliente apressado
   */
  customer_rushed: {
    name: 'Cliente Apressado',
    description: 'Voz para simular cliente com pressa',
    voiceId: PT_BR_VOICES.adam,
    model: 's1',
    prosody: {
      speed: 1.25,     // Bem mais rápido
      volume: 2
    },
    defaultEmotion: ['in a hurry tone', 'anxious'],
    temperature: 0.95,
    top_p: 0.95,
    latency: 'balanced',
    scenarioType: 'neutral'
  }
};

/**
 * Classe para gerenciar perfis de voz
 */
class VoiceProfileManager {
  constructor() {
    this.profiles = { ...VOICE_PROFILES };
    this.currentProfile = null;

    console.log(`✓ VoiceProfileManager inicializado com ${Object.keys(this.profiles).length} perfis`);
  }

  /**
   * Lista todos os perfis disponíveis
   */
  listProfiles() {
    return Object.entries(this.profiles).map(([key, profile]) => ({
      id: key,
      name: profile.name,
      description: profile.description,
      scenarioType: profile.scenarioType
    }));
  }

  /**
   * Obtém um perfil por ID
   *
   * @param {string} profileId - ID do perfil
   * @returns {object|null} - Configurações do perfil
   */
  getProfile(profileId) {
    return this.profiles[profileId] || null;
  }

  /**
   * Define o perfil atual
   *
   * @param {string} profileId - ID do perfil
   */
  setCurrentProfile(profileId) {
    if (!this.profiles[profileId]) {
      console.warn(`Perfil '${profileId}' não encontrado`);
      return false;
    }

    this.currentProfile = this.profiles[profileId];
    console.log(`✓ Perfil ativo: ${this.currentProfile.name}`);
    return true;
  }

  /**
   * Obtém o perfil atual
   */
  getCurrentProfile() {
    return this.currentProfile;
  }

  /**
   * Obtém configurações para Fish Audio do perfil atual
   */
  getFishAudioConfig() {
    if (!this.currentProfile) {
      return null;
    }

    return {
      voiceId: this.currentProfile.voiceId,
      model: this.currentProfile.model,
      prosody: this.currentProfile.prosody,
      temperature: this.currentProfile.temperature,
      top_p: this.currentProfile.top_p,
      latency: this.currentProfile.latency
    };
  }

  /**
   * Obtém perfis por tipo de cenário
   *
   * @param {string} scenarioType - Tipo de cenário
   */
  getProfilesByScenario(scenarioType) {
    return Object.entries(this.profiles)
      .filter(([_, profile]) => profile.scenarioType === scenarioType)
      .map(([key, profile]) => ({
        id: key,
        ...profile
      }));
  }

  /**
   * Adiciona um perfil customizado
   *
   * @param {string} id - ID único do perfil
   * @param {object} config - Configurações do perfil
   */
  addProfile(id, config) {
    if (this.profiles[id]) {
      console.warn(`Perfil '${id}' já existe, sobrescrevendo...`);
    }

    this.profiles[id] = {
      ...config,
      model: config.model || 's1',
      latency: config.latency || 'balanced'
    };

    console.log(`✓ Perfil '${id}' adicionado`);
  }

  /**
   * Remove um perfil
   *
   * @param {string} id - ID do perfil
   */
  removeProfile(id) {
    if (this.profiles[id]) {
      delete this.profiles[id];
      console.log(`✓ Perfil '${id}' removido`);
      return true;
    }
    return false;
  }

  /**
   * Recomenda perfil baseado no contexto
   *
   * @param {object} context - Contexto da simulação
   * @returns {string} - ID do perfil recomendado
   */
  recommendProfile(context = {}) {
    const { scenarioType, customerMood, urgency } = context;

    // Baseado em cenário
    if (scenarioType === 'sales') {
      return urgency ? 'sales_enthusiastic' : 'sales_consultative';
    }

    if (scenarioType === 'technical_support') {
      return 'technical_support_patient';
    }

    // Atendimento ao cliente (default)
    if (customerMood === 'angry' || customerMood === 'frustrated') {
      return 'customer_service_empathetic';
    }

    if (urgency) {
      return 'customer_service_urgent';
    }

    // Default
    return 'customer_service_confident';
  }
}

// Exportar
module.exports = VoiceProfileManager;
module.exports.VOICE_PROFILES = VOICE_PROFILES;
module.exports.PT_BR_VOICES = PT_BR_VOICES;
