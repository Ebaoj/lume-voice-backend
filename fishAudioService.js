/**
 * Fish Audio TTS Service - Enhanced Version
 *
 * API Documentation: https://docs.fish.audio/
 *
 * Preços (70% mais barato que ElevenLabs):
 * - Fish Audio: $15.00 / 1M UTF-8 bytes (~$0.05/min)
 * - ElevenLabs: ~$0.18/min
 *
 * Características:
 * - Modelo S1: 4B parâmetros, #1 TTS-Arena2
 * - 64+ expressões emocionais
 * - Controle de prosódia (velocidade, volume)
 * - Latência ultra-baixa (<300ms modo balanced)
 * - Suporta streaming
 * - 13 idiomas incluindo PT-BR
 */

const axios = require('axios');

// Vozes PT-BR testadas e recomendadas
const PT_BR_VOICES = {
  // Femininas
  isabela: '5661bf8cb97740fcb10d2f756abf7779',      // Natural, precisa speed 1.15
  josi: 'd3b63756081b49c6b3849aa22ec59eb0',         // Locutora profissional
  camila: '5ff77a8b3143479f99f73ae6d2c88b09',       // Tom formal
  senhora: '74f28613269e48d19d001f0c39e901dc',      // Voz madura 50+

  // Masculinas
  adam: '1a61293f8fa8441f804deb10d0b2bc95',         // PT-BR masculina
  narrador: 'df1fa6d2ae194b3ebcbae60df48fde35',     // Estilo locutor
};

// Emoções suportadas pelo Fish Audio S1
const EMOTIONS = {
  // Básicas (24)
  basic: [
    'happy', 'sad', 'angry', 'excited', 'calm', 'nervous', 'confident',
    'surprised', 'satisfied', 'delighted', 'scared', 'worried', 'upset',
    'frustrated', 'depressed', 'empathetic', 'embarrassed', 'disgusted',
    'moved', 'proud', 'relaxed', 'grateful', 'curious', 'sarcastic'
  ],
  // Avançadas (25)
  advanced: [
    'disdainful', 'unhappy', 'anxious', 'hysterical', 'indifferent',
    'uncertain', 'doubtful', 'confused', 'disappointed', 'regretful',
    'guilty', 'ashamed', 'jealous', 'envious', 'hopeful', 'optimistic',
    'pessimistic', 'nostalgic', 'lonely', 'bored', 'contemptuous',
    'sympathetic', 'compassionate', 'determined', 'resigned'
  ],
  // Tons (5)
  tones: ['in a hurry tone', 'shouting', 'screaming', 'whispering', 'soft tone'],
  // Efeitos de áudio (10)
  effects: [
    'laughing', 'chuckling', 'sobbing', 'crying loudly', 'sighing',
    'groaning', 'panting', 'gasping', 'yawning', 'snoring'
  ]
};

class FishAudioService {
  /**
   * @param {string} apiKey - API key do Fish Audio
   * @param {object} options - Configurações padrão
   */
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.fish.audio/v1';

    // Configurações padrão otimizadas para PT-BR
    this.defaults = {
      model: 's1',                                    // Modelo mais avançado
      voiceId: PT_BR_VOICES.isabela,                  // Isabela - mais natural
      format: 'mp3',

      // Prosódia - CRÍTICO para PT-BR
      prosody: {
        speed: 1.15,                                  // 15% mais rápido (evita som "deprimido")
        volume: 0                                     // Volume normal (dB)
      },

      // Variabilidade - para respostas mais naturais
      temperature: 0.9,                               // Aleatoriedade (0-1)
      top_p: 0.9,                                     // Diversidade (0-1)

      // Performance
      latency: 'balanced',                            // 'normal' ou 'balanced' (mais rápido)
      chunk_length: 200,                              // Segmentação de texto (100-300)
      normalize: true,                                // Normalização de áudio

      // IMPORTANTE: Vozes UGC (user-generated) NÃO suportam emotion tags
      // As tags (happy), (sad), etc. serão FALADAS como texto em vozes UGC
      // Para vozes UGC, usar apenas prosody e pontuação para expressividade
      supportsEmotionTags: false,                     // Desabilitado por padrão para vozes UGC

      // Override com opções do usuário
      ...options
    };

    console.log('✓ FishAudioService v2 inicializado');
    console.log(`  → Modelo: ${this.defaults.model}`);
    console.log(`  → Voz padrão: Isabela (${this.defaults.voiceId})`);
    console.log(`  → Velocidade: ${this.defaults.prosody.speed}x`);
    console.log(`  → Latência: ${this.defaults.latency}`);
  }

  /**
   * Gerar TTS com streaming
   *
   * @param {string} text - Texto para converter (pode incluir emotion tags)
   * @param {string} voiceId - ID da voz (opcional, usa default)
   * @param {object} options - Opções para override
   * @returns {Promise<AxiosResponse>} - Response com stream de áudio
   */
  async textToSpeech(text, voiceId = null, options = {}) {
    const startTime = Date.now();

    // Merge das configurações
    const config = {
      ...this.defaults,
      ...options,
      prosody: {
        ...this.defaults.prosody,
        ...(options.prosody || {})
      }
    };

    const voice = voiceId || config.voiceId;

    try {
      console.log(`→ Fish Audio TTS:`);
      console.log(`  Text: ${text.substring(0, 50)}...`);
      console.log(`  Chars: ${text.length}`);
      console.log(`  Voice: ${voice}`);
      console.log(`  Speed: ${config.prosody.speed}x`);
      console.log(`  Model: ${config.model}`);

      const requestBody = {
        text: text,
        reference_id: voice,
        model: config.model,
        format: config.format,

        // Prosódia
        prosody: config.prosody,

        // Variabilidade
        temperature: config.temperature,
        top_p: config.top_p,

        // Performance
        latency: config.latency,
        chunk_length: config.chunk_length,
        normalize: config.normalize
      };

      const response = await axios.post(
        `${this.baseURL}/tts`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
          timeout: 15000, // 15s timeout
        }
      );

      const elapsed = Date.now() - startTime;
      console.log(`✓ Fish Audio stream iniciado (${elapsed}ms)`);

      return response;

    } catch (error) {
      console.error('✗ Erro Fish Audio:', error.response?.data || error.message);

      // Tratamento de erros específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Tentar ler o erro do stream se necessário
        let errorMessage = '';
        if (typeof data === 'object' && data.pipe) {
          // É um stream, precisamos ler
          const chunks = [];
          for await (const chunk of data) {
            chunks.push(chunk);
          }
          errorMessage = Buffer.concat(chunks).toString();
        } else {
          errorMessage = data?.message || data?.detail || JSON.stringify(data);
        }

        if (status === 401) {
          throw new Error('Fish Audio: API key inválida');
        } else if (status === 402) {
          throw new Error('Fish Audio: Créditos insuficientes');
        } else if (status === 422) {
          throw new Error(`Fish Audio: Erro de validação - ${errorMessage}`);
        } else if (status === 429) {
          throw new Error('Fish Audio: Rate limit excedido');
        } else {
          throw new Error(`Fish Audio (${status}): ${errorMessage}`);
        }
      }

      throw new Error(`Fish Audio: ${error.message}`);
    }
  }

  /**
   * Gerar TTS com emoção específica
   *
   * @param {string} text - Texto base (sem emotion tags)
   * @param {string|string[]} emotions - Emoção(ões) a aplicar
   * @param {string} voiceId - ID da voz
   * @param {object} options - Opções extras
   */
  async textToSpeechWithEmotion(text, emotions, voiceId = null, options = {}) {
    // Converter emoções para tags
    const emotionTags = this.buildEmotionTags(emotions);
    const textWithEmotion = `${emotionTags} ${text}`;

    return this.textToSpeech(textWithEmotion, voiceId, options);
  }

  /**
   * Constrói tags de emoção no formato Fish Audio
   *
   * @param {string|string[]} emotions - Emoção ou array de emoções
   * @returns {string} - Tags formatadas, ex: "(confident)(empathetic)"
   */
  buildEmotionTags(emotions) {
    if (!emotions) return '';

    const emotionArray = Array.isArray(emotions) ? emotions : [emotions];

    // Limitar a 3 emoções (recomendação Fish Audio)
    const limitedEmotions = emotionArray.slice(0, 3);

    return limitedEmotions.map(e => `(${e})`).join('');
  }

  /**
   * Validar se emoção é suportada
   *
   * @param {string} emotion - Nome da emoção
   * @returns {boolean}
   */
  isValidEmotion(emotion) {
    const allEmotions = [
      ...EMOTIONS.basic,
      ...EMOTIONS.advanced,
      ...EMOTIONS.tones,
      ...EMOTIONS.effects
    ];
    return allEmotions.includes(emotion.toLowerCase());
  }

  /**
   * Listar todas as emoções disponíveis
   */
  getAvailableEmotions() {
    return EMOTIONS;
  }

  /**
   * Listar vozes PT-BR pré-configuradas
   */
  getPTBRVoices() {
    return PT_BR_VOICES;
  }

  /**
   * Buscar vozes disponíveis na API
   *
   * @param {object} filters - Filtros de busca
   */
  async searchVoices(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.language) params.append('languages', filters.language);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.limit) params.append('page_size', filters.limit);

      const response = await axios.get(
        `${this.baseURL}/models?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar vozes:', error.message);
      return { items: [] };
    }
  }

  /**
   * Atualizar configurações padrão em runtime
   *
   * @param {object} newDefaults - Novas configurações
   */
  updateDefaults(newDefaults) {
    this.defaults = {
      ...this.defaults,
      ...newDefaults,
      prosody: {
        ...this.defaults.prosody,
        ...(newDefaults.prosody || {})
      }
    };
    console.log('✓ Configurações Fish Audio atualizadas');
  }

  /**
   * Criar preset de voz para cenário específico
   *
   * @param {string} scenario - Nome do cenário
   * @param {object} config - Configurações do preset
   */
  createPreset(scenario, config) {
    if (!this.presets) {
      this.presets = {};
    }
    this.presets[scenario] = config;
    console.log(`✓ Preset '${scenario}' criado`);
  }

  /**
   * Usar preset de voz
   *
   * @param {string} text - Texto para TTS
   * @param {string} presetName - Nome do preset
   */
  async textToSpeechWithPreset(text, presetName) {
    if (!this.presets || !this.presets[presetName]) {
      console.warn(`Preset '${presetName}' não encontrado, usando defaults`);
      return this.textToSpeech(text);
    }

    const preset = this.presets[presetName];
    return this.textToSpeech(text, preset.voiceId, preset);
  }

  /**
   * Calcular custo estimado
   *
   * @param {string} text - Texto para calcular
   * @returns {object} - Custo e métricas
   */
  static calculateCost(text) {
    // Fish Audio cobra por UTF-8 bytes, não caracteres
    const bytes = Buffer.byteLength(text, 'utf8');
    const COST_PER_MILLION_BYTES = 15.00; // $15 / 1M bytes

    const cost = (bytes / 1_000_000) * COST_PER_MILLION_BYTES;

    return {
      bytes,
      characters: text.length,
      costUSD: cost,
      costBRL: cost * 5.5, // Aproximado
      formatted: `$${cost.toFixed(6)}`
    };
  }

  /**
   * Comparar economia vs ElevenLabs
   *
   * @param {string} text - Texto para comparar
   * @returns {object} - Comparação de custos
   */
  static compareWithElevenLabs(text) {
    const fishCost = this.calculateCost(text);

    // ElevenLabs cobra ~$0.30 / 1k chars (tier básico)
    const elevenLabsCost = (text.length / 1000) * 0.30;

    const savings = elevenLabsCost - fishCost.costUSD;
    const savingsPercent = elevenLabsCost > 0
      ? ((savings / elevenLabsCost) * 100).toFixed(1)
      : 0;

    return {
      fishAudio: fishCost.formatted,
      elevenLabs: `$${elevenLabsCost.toFixed(6)}`,
      savings: `$${savings.toFixed(6)}`,
      savingsPercent: `${savingsPercent}%`
    };
  }
}

// Exportar classe e constantes úteis
module.exports = FishAudioService;
module.exports.PT_BR_VOICES = PT_BR_VOICES;
module.exports.EMOTIONS = EMOTIONS;
