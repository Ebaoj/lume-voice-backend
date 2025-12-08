/**
 * AssistantManager - Gerencia OpenAI Assistants API para conversas stateful
 *
 * Benefícios:
 * - 90% economia de tokens (system prompt enviado 1x)
 * - Context caching automático
 * - Suporta streaming
 * - Gerenciamento de conversas por thread
 */

class AssistantManager {
  constructor(openaiClient) {
    this.client = openaiClient;
    this.assistant = null;
    this.thread = null;
    this.currentRun = null;
  }

  /**
   * Criar assistant com system prompt
   * Chamado UMA VEZ no início da simulação
   */
  async createAssistant(systemPrompt, assistantName = 'Voice AI Agent') {
    console.log('→ Criando Assistant...');

    this.assistant = await this.client.beta.assistants.create({
      name: assistantName,
      instructions: systemPrompt,
      model: 'gpt-4o',
      temperature: 0.8,
      tools: [] // Sem tools por enquanto
    });

    console.log('✓ Assistant criado:', this.assistant.id);
    return this.assistant;
  }

  /**
   * Criar thread (conversa)
   * Cada simulação tem seu próprio thread
   */
  async createThread() {
    console.log('→ Criando Thread...');

    this.thread = await this.client.beta.threads.create();

    console.log('✓ Thread criado:', this.thread.id);
    return this.thread;
  }

  /**
   * Enviar mensagem do usuário e obter resposta com streaming
   *
   * @param {string} userMessage - Mensagem do usuário
   * @param {function} onChunk - Callback para cada chunk de texto
   * @param {function} onComplete - Callback quando resposta completa
   * @returns {Promise<{text: string, usage: object}>}
   */
  async sendMessage(userMessage, onChunk, onComplete) {
    if (!this.assistant || !this.thread) {
      throw new Error('Assistant ou Thread não inicializado. Chame createAssistant() e createThread() primeiro.');
    }

    // 1. Adicionar mensagem do usuário ao thread
    await this.client.beta.threads.messages.create(this.thread.id, {
      role: 'user',
      content: userMessage
    });

    console.log(`→ Mensagem adicionada ao thread (${userMessage.length} chars)`);

    // 2. Executar run com streaming
    return new Promise(async (resolve, reject) => {
      try {
        let fullResponse = '';
        let sentenceBuffer = '';
        let firstChunk = true;
        const startTime = Date.now();

        // Criar run com streaming
        const stream = await this.client.beta.threads.runs.create(
          this.thread.id,
          {
            assistant_id: this.assistant.id,
            stream: true,
            max_completion_tokens: 250, // Limite de tokens na resposta
          }
        );

        // Processar eventos do stream
        for await (const event of stream) {
          // Thread Run Created
          if (event.event === 'thread.run.created') {
            this.currentRun = event.data;
            console.log('→ Run iniciado:', event.data.id);
          }

          // Thread Run In Progress
          if (event.event === 'thread.run.in_progress') {
            if (firstChunk) {
              const firstTokenTime = Date.now() - startTime;
              console.log(`⚡ Primeiro token (${firstTokenTime}ms)`);
              firstChunk = false;
            }
          }

          // Text Delta (conteúdo sendo gerado)
          if (event.event === 'thread.message.delta') {
            const delta = event.data.delta;
            if (delta.content && delta.content[0]?.text?.value) {
              const content = delta.content[0].text.value;
              fullResponse += content;
              sentenceBuffer += content;

              // Detectar fim de frase para streaming de TTS
              const sentenceEndMatch = sentenceBuffer.match(/[.!?]\s|[.!?]$|\n/);
              if (sentenceEndMatch && onChunk) {
                const sentence = sentenceBuffer.trim();
                if (sentence.length > 0) {
                  onChunk(sentence);
                  sentenceBuffer = '';
                }
              }
            }
          }

          // Thread Run Completed
          if (event.event === 'thread.run.completed') {
            const runData = event.data;
            console.log('✓ Run completado');

            // Enviar buffer final se houver
            if (sentenceBuffer.trim().length > 0 && onChunk) {
              onChunk(sentenceBuffer.trim());
            }

            // Extrair usage info
            const usage = runData.usage || {
              prompt_tokens: 0,
              completion_tokens: 0,
              total_tokens: 0
            };

            console.log(`📊 Tokens - Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}`);

            if (onComplete) {
              onComplete(fullResponse, usage);
            }

            resolve({
              text: fullResponse,
              usage: usage
            });
          }

          // Thread Run Failed
          if (event.event === 'thread.run.failed') {
            const error = event.data.last_error;
            console.error('❌ Run falhou:', error);
            reject(new Error(`Run failed: ${error?.message || 'Unknown error'}`));
          }

          // Thread Run Cancelled
          if (event.event === 'thread.run.cancelled') {
            console.log('⚠️  Run cancelado');
            reject(new Error('Run was cancelled'));
          }

          // Thread Run Expired
          if (event.event === 'thread.run.expired') {
            console.log('⏱️  Run expirou');
            reject(new Error('Run expired'));
          }
        }
      } catch (error) {
        console.error('❌ Erro no streaming:', error);
        reject(error);
      }
    });
  }

  /**
   * Cancelar run em andamento
   * Útil para interrupções (usuário começou a falar)
   */
  async cancelCurrentRun() {
    if (this.currentRun && this.thread) {
      try {
        await this.client.beta.threads.runs.cancel(
          this.thread.id,
          this.currentRun.id
        );
        console.log('✓ Run cancelado');
        this.currentRun = null;
      } catch (error) {
        console.error('Erro ao cancelar run:', error);
      }
    }
  }

  /**
   * Limpar recursos
   * Chamado no final da simulação
   */
  async cleanup() {
    // Cancelar run em andamento
    await this.cancelCurrentRun();

    // Opcional: Deletar assistant e thread
    // (pode manter para análise posterior)

    this.assistant = null;
    this.thread = null;
    this.currentRun = null;

    console.log('✓ AssistantManager limpo');
  }

  /**
   * Obter histórico completo da conversa
   * Útil para debugging e análise
   */
  async getConversationHistory() {
    if (!this.thread) {
      return [];
    }

    const messages = await this.client.beta.threads.messages.list(
      this.thread.id
    );

    return messages.data.map(msg => ({
      role: msg.role,
      content: msg.content[0]?.text?.value || '',
      timestamp: msg.created_at
    }));
  }

  /**
   * Obter estatísticas do assistant
   */
  getStats() {
    return {
      assistantId: this.assistant?.id,
      threadId: this.thread?.id,
      runId: this.currentRun?.id,
      isActive: !!this.currentRun
    };
  }
}

module.exports = AssistantManager;
