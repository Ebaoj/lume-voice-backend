/**
 * Fish Audio TTS Service
 *
 * API Documentation: https://fish.audio/go-api/
 *
 * Preços (91% mais barato que ElevenLabs):
 * - Fish Audio: $0.015 / 1k characters
 * - ElevenLabs: $0.165 / 1k characters
 *
 * Características:
 * - #1 no TTS-Arena (melhor qualidade)
 * - Latência ultra-baixa (<300ms)
 * - Suporta streaming
 * - Vozes naturais em PT-BR
 */

const axios = require('axios');

class FishAudioService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.fish.audio/v1';

    // Voz padrão PT-BR de alta qualidade
    // Você pode encontrar mais vozes em: https://fish.audio/voices
    this.defaultVoiceId = '7355c6476fa549f6ab97a66c9d03c80e'; // Voz natural PT-BR feminina

    console.log('✓ FishAudioService inicializado');
  }

  /**
   * Gerar TTS com streaming
   *
   * @param {string} text - Texto para converter em áudio
   * @param {string} voiceId - ID da voz (opcional)
   * @param {object} options - Opções adicionais
   * @returns {Promise<Stream>} - Stream de áudio em formato MP3
   */
  async textToSpeech(text, voiceId = null, options = {}) {
    const startTime = Date.now();

    try {
      const voice = voiceId || this.defaultVoiceId;

      console.log(`→ Fish Audio TTS: ${text.length} chars, voice: ${voice}`);

      const response = await axios.post(
        `${this.baseURL}/tts`,
        {
          text: text,
          reference_id: voice, // ID da voz de referência
          // Configurações de qualidade
          format: 'mp3', // Formato de saída
          mp3_bitrate: 128, // Qualidade do MP3 (64, 128, 192)
          // Configurações de voz
          latency: 'normal', // 'normal' ou 'balanced' (+ rápido, - qualidade)
          // Streaming
          streaming: true,
          // Normalização de áudio
          normalize: true,
          ...options
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream', // Importante para streaming
          timeout: 10000, // 10s timeout
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
        const message = error.response.data?.message || error.response.data;

        if (status === 401) {
          throw new Error('Fish Audio: API key inválida');
        } else if (status === 429) {
          throw new Error('Fish Audio: Limite de requisições excedido');
        } else if (status === 400) {
          throw new Error(`Fish Audio: Requisição inválida - ${message}`);
        }
      }

      throw new Error(`Fish Audio: ${error.message}`);
    }
  }

  /**
   * Listar vozes disponíveis
   * Útil para descobrir novos voice IDs
   */
  async listVoices() {
    try {
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        params: {
          language: 'pt-BR', // Filtrar por português brasileiro
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao listar vozes:', error.message);
      return [];
    }
  }

  /**
   * Calcular custo estimado
   *
   * @param {number} characterCount - Número de caracteres
   * @returns {number} - Custo em USD
   */
  static calculateCost(characterCount) {
    const COST_PER_1K_CHARS = 0.015; // $0.015 / 1k chars
    return (characterCount / 1000) * COST_PER_1K_CHARS;
  }

  /**
   * Comparar economia vs ElevenLabs
   *
   * @param {number} characterCount - Número de caracteres
   * @returns {object} - Comparação de custos
   */
  static compareWithElevenLabs(characterCount) {
    const fishCost = this.calculateCost(characterCount);
    const elevenLabsCost = (characterCount / 1000) * 0.165;
    const savings = elevenLabsCost - fishCost;
    const savingsPercent = ((savings / elevenLabsCost) * 100).toFixed(1);

    return {
      fishAudio: fishCost.toFixed(4),
      elevenLabs: elevenLabsCost.toFixed(4),
      savings: savings.toFixed(4),
      savingsPercent: `${savingsPercent}%`
    };
  }
}

module.exports = FishAudioService;
