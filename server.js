/**
 * Voice AI MVP Server
 *
 * Fluxo:
 * 1. Cliente envia áudio via WebSocket
 * 2. Streaming para Deepgram (STT)
 * 3. Transcrição enviada para ChatGPT (LLM)
 * 4. Resposta do ChatGPT enviada para ElevenLabs (TTS)
 * 5. Áudio sintetizado retorna ao cliente
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { createClient } = require('@deepgram/sdk');
const OpenAI = require('openai');
const axios = require('axios');

// ===== Configuração =====
const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir arquivos estáticos (HTML/CSS/JS do cliente)
app.use(express.static('public'));

// System prompt para o personagem "Beto"
const SYSTEM_PROMPT = `Você é Beto, atendente de uma cafeteria.
Seja muito breve e natural (1-2 frases). Ajude o cliente a escolher bebidas.
Fale como em uma conversa rápida, sem formalidades.`;

// FIX #11: Limite de mensagens no histórico (evita estouro de tokens)
const MAX_CONVERSATION_HISTORY = 10;

// ===== WebSocket Handler =====
wss.on('connection', (ws) => {
  console.log('✓ Novo cliente conectado');

  let deepgramLive = null;
  let conversationHistory = [];
  let isProcessing = false;
  let lastFinalTranscript = ''; // Guardar última transcrição final
  let processingTimeout = null; // Timeout para processar após silêncio
  let currentTTSAbortController = null; // FIX #12: Para cancelar TTS em andamento

  // API Keys serão fornecidas pelo cliente
  let apiKeys = {
    deepgram: null,
    openai: null,
    elevenlabs: null
  };

  // Clientes dos SDKs (criados após receber as keys)
  let deepgramClient = null;
  let openaiClient = null;

  // System prompt customizado (vem do frontend)
  let customSystemPrompt = null;

  // Voice ID customizado para ElevenLabs (vem do frontend)
  let customVoiceId = null;

  ws.on('message', async (message) => {
    try {
      // Converter Buffer para string se necessário
      let messageStr = message;
      if (Buffer.isBuffer(message)) {
        messageStr = message.toString('utf8');
      }

      // Mensagens podem ser comandos (string) ou áudio (buffer binário)
      // Verificar se é JSON válido
      let data;
      try {
        data = JSON.parse(messageStr);
      } catch (e) {
        // Não é JSON, então é áudio binário
        if (deepgramLive) {
          deepgramLive.send(message);
        }
        return;
      }

      // Se chegou aqui, é um comando JSON
      if (data && data.type) {

        // Comando: configurar API keys
        if (data.type === 'configure') {
          console.log('→ Configurando API keys');

          // Limpar e validar keys
          apiKeys.deepgram = (data.keys.deepgram || '').trim();
          apiKeys.openai = (data.keys.openai || '').trim();
          apiKeys.elevenlabs = (data.keys.elevenlabs || '').trim();

          // Capturar system prompt customizado
          if (data.systemPrompt) {
            customSystemPrompt = data.systemPrompt;
            console.log('→ System prompt customizado recebido:', customSystemPrompt.substring(0, 100) + '...');
          }

          // Capturar voice ID customizado para ElevenLabs
          if (data.voiceId) {
            customVoiceId = data.voiceId;
            console.log('→ Voice ID ElevenLabs recebido:', customVoiceId);
          }

          console.log('→ Deepgram key:', apiKeys.deepgram.substring(0, 8) + '...' + apiKeys.deepgram.substring(apiKeys.deepgram.length - 4));
          console.log('→ Deepgram key length:', apiKeys.deepgram.length);

          // Inicializar clientes com as keys fornecidas
          try {
            // Criar cliente Deepgram (sem config adicional, igual ao test-deepgram.js que funciona)
            deepgramClient = createClient(apiKeys.deepgram);

            openaiClient = new OpenAI({
              apiKey: apiKeys.openai,
            });

            ws.send(JSON.stringify({
              type: 'configured',
              message: 'APIs configuradas com sucesso!'
            }));
            console.log('✓ APIs configuradas');
          } catch (error) {
            console.error('✗ Erro ao criar clientes:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Erro ao configurar APIs: ' + error.message
            }));
          }
          return;
        }

        // Comando: iniciar streaming de áudio
        if (data.type === 'start') {
          console.log('→ Iniciando sessão de áudio');

          // Verificar se as APIs foram configuradas
          if (!deepgramClient || !openaiClient) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Configure as API keys primeiro!'
            }));
            return;
          }

          // Verificar se a key do Deepgram está válida
          if (!apiKeys.deepgram || apiKeys.deepgram.length < 10) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'API key do Deepgram inválida!'
            }));
            return;
          }

          // FIX #1: MEMORY LEAK - Limpar listeners antigos antes de criar nova conexão
          if (deepgramLive) {
            console.log('→ Limpando conexão Deepgram anterior...');
            deepgramLive.removeAllListeners();
            deepgramLive.finish();
            deepgramLive = null;
          }

          // Criar conexão de streaming com Deepgram
          console.log('→ Criando conexão Deepgram...');
          try {
            deepgramLive = deepgramClient.listen.live({
              model: 'nova-2',
              language: 'pt-BR',
              encoding: 'linear16',
              sample_rate: 16000,
              interim_results: true,
              vad_events: true,
              // Configurações para evitar interrupções prematuras
              endpointing: 800, // Esperar 800ms de silêncio antes de considerar fim de fala
              utterance_end_ms: 1200, // Tempo extra para pausas longas (pensando)
            });
            console.log('✓ Conexão Deepgram criada');
          } catch (error) {
            console.error('✗ Erro ao criar conexão live:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Erro ao criar conexão com Deepgram: ' + error.message
            }));
            return;
          }

          // ===== Deepgram Event Handlers =====
          console.log('→ Registrando event handlers do Deepgram...');

          // Quando Deepgram estiver pronto
          deepgramLive.on('open', () => {
            console.log('✅ ✅ ✅ Deepgram OPEN event disparado! Conexão estabelecida!');
            // Só agora avisar o cliente que pode começar a enviar áudio
            ws.send(JSON.stringify({ type: 'deepgram_ready' }));
          });

          // Resultado de transcrição (parcial ou final)
          deepgramLive.on('Results', async (data) => {
            console.log('📊 Results event recebido');
            const transcript = data.channel?.alternatives[0]?.transcript;

            if (transcript && transcript.trim().length > 0) {
              const isFinal = data.is_final;

              // Enviar transcrição para o cliente (para debug visual)
              ws.send(JSON.stringify({
                type: 'transcript',
                text: transcript,
                isFinal: isFinal
              }));

              console.log(`${isFinal ? '✓' : '...'} Transcrição: ${transcript}`);

              // Se é final, guardar e agendar processamento
              if (isFinal) {
                lastFinalTranscript = transcript;

                // Limpar timeout anterior
                if (processingTimeout) {
                  clearTimeout(processingTimeout);
                }

                // Agendar processamento após 1000ms de silêncio (dar tempo para pensar)
                processingTimeout = setTimeout(async () => {
                  if (!isProcessing && lastFinalTranscript && lastFinalTranscript.trim().length > 0) {
                    const transcriptToProcess = lastFinalTranscript;
                    lastFinalTranscript = '';

                    isProcessing = true;
                    ws.send(JSON.stringify({ type: 'status', message: 'Processando...' }));

                    console.log(`📝 Processando transcrição: "${transcriptToProcess}"`);
                    await processWithGPT(transcriptToProcess, ws);
                    isProcessing = false;
                  }
                }, 1000);
              }
            }
          });

          // Utterance End - usuário parou de falar
          deepgramLive.on('UtteranceEnd', async () => {
            console.log('→ Fim de fala detectado');

            if (isProcessing) {
              console.log('⚠ Já processando uma resposta, ignorando...');
              return;
            }

            // Usar a última transcrição final guardada
            if (lastFinalTranscript && lastFinalTranscript.trim().length > 0) {
              const transcriptToProcess = lastFinalTranscript;
              lastFinalTranscript = ''; // Limpar para não processar novamente

              isProcessing = true;
              ws.send(JSON.stringify({ type: 'status', message: 'Processando...' }));

              console.log(`📝 Processando transcrição: "${transcriptToProcess}"`);

              // Processar com ChatGPT e gerar resposta em voz
              await processWithGPT(transcriptToProcess, ws);

              isProcessing = false;
            } else {
              console.log('⚠ Nenhuma transcrição final para processar');
            }
          });

          // Erros do Deepgram
          deepgramLive.on('error', (error) => {
            console.error('❌ ❌ ❌ ERRO DEEPGRAM:', {
              type: typeof error,
              message: error.message,
              error: JSON.stringify(error, null, 2),
              keys: Object.keys(error),
              errorString: error.toString(),
              stack: error.stack
            });

            // Tentar extrair mais informações
            if (error.event) {
              console.error('  Error event:', error.event);
            }
            if (error.reason) {
              console.error('  Reason:', error.reason);
            }

            ws.send(JSON.stringify({
              type: 'error',
              message: `Erro no STT: ${error.message || error.reason || 'Verifique sua API key do Deepgram'}`
            }));
          });

          deepgramLive.on('close', (closeEvent) => {
            console.error('🔴 DEEPGRAM CLOSE EVENT:', {
              type: closeEvent.type,
              code: closeEvent.code,
              reason: closeEvent.reason,
              wasClean: closeEvent.wasClean,
              timestamp: closeEvent.timeStamp,
              all: JSON.stringify(closeEvent, null, 2)
            });
          });

          deepgramLive.on('warning', (warning) => {
            console.warn('⚠️ ⚠️ WARNING DEEPGRAM:', warning);
          });

          deepgramLive.on('Metadata', (metadata) => {
            console.log('ℹ️ ℹ️ METADATA DEEPGRAM:', metadata);
          });

          // Tentar capturar eventos de mensagem
          if (deepgramLive._ws) {
            console.log('→ WebSocket interno encontrado, adicionando listeners...');
            deepgramLive._ws.on('message', (msg) => {
              console.log('📨 WS Message:', msg.toString());
            });
          }

          console.log('✓ Todos os event handlers registrados');
        }

        // FIX #12: Comando: interromper bot (usuário começou a falar)
        if (data.type === 'interrupt') {
          console.log('⚠️  Interrupção detectada - cancelando TTS em andamento');

          // Cancelar TTS em andamento
          if (currentTTSAbortController) {
            currentTTSAbortController.abort();
            currentTTSAbortController = null;
          }

          // Avisar cliente para limpar fila de áudio
          ws.send(JSON.stringify({ type: 'clear_audio_queue' }));

          isProcessing = false;
          return;
        }

        // Comando: parar streaming
        if (data.type === 'stop') {
          console.log('→ Encerrando sessão de áudio');
          if (processingTimeout) {
            clearTimeout(processingTimeout);
            processingTimeout = null;
          }
          if (currentTTSAbortController) {
            currentTTSAbortController.abort();
            currentTTSAbortController = null;
          }
          if (deepgramLive) {
            deepgramLive.finish();
            deepgramLive = null;
          }
          conversationHistory = [];
          lastFinalTranscript = '';
          isProcessing = false;
        }
      }
    } catch (error) {
      console.error('✗ Erro ao processar mensagem:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  // Cliente desconectou
  ws.on('close', () => {
    console.log('✗ Cliente desconectado');
    if (deepgramLive) {
      deepgramLive.finish();
    }
  });

  // ===== Função: Processar com ChatGPT STREAMING e gerar TTS =====
  async function processWithGPT(userMessage, ws) {
    const startTime = Date.now();

    try {
      // FIX #9: SANITIZAR LOGS - não logar conteúdo das mensagens (pode ter PII)
      console.log(`→ Enviando para ChatGPT (length: ${userMessage.length})`);

      // Adicionar mensagem do usuário ao histórico
      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // FIX #11: Limitar histórico (evita estouro de contexto e custo alto)
      if (conversationHistory.length > MAX_CONVERSATION_HISTORY) {
        conversationHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);
        console.log(`⚠️  Histórico limitado a ${MAX_CONVERSATION_HISTORY} mensagens`);
      }

      // Preparar mensagens incluindo system prompt
      const messages = [
        {
          role: 'system',
          content: customSystemPrompt || SYSTEM_PROMPT // Usar prompt customizado ou fallback para padrão
        },
        ...conversationHistory
      ];

      // FIX #6: TIMEOUTS - Chamar OpenAI com timeout (evita travar se API ficar lenta)
      const gptStart = Date.now();

      // Timeout manual (OpenAI SDK não tem timeout configurável no streaming)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI timeout após 15s')), 15000);
      });

      const streamPromise = openaiClient.chat.completions.create({
        model: 'gpt-4o', // Modelo mais inteligente para personagens mais profundos
        max_tokens: 250, // Mais espaço para respostas elaboradas
        temperature: 0.8, // Um pouco mais criativo
        messages: messages,
        stream: true,
        stream_options: { include_usage: true }, // Incluir informações de token usage
      });

      const stream = await Promise.race([streamPromise, timeoutPromise]);

      let fullResponse = '';
      let sentenceBuffer = '';
      let firstChunk = true;
      let sentenceCount = 0;
      let tokenUsage = null; // Armazenar info de usage

      // Processar stream chunk por chunk
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';

        // Capturar usage info (vem no último chunk)
        if (chunk.usage) {
          tokenUsage = chunk.usage;
        }

        if (content) {
          if (firstChunk) {
            const firstTokenTime = Date.now() - gptStart;
            console.log(`⚡ Primeiro token ChatGPT (${firstTokenTime}ms)`);
            firstChunk = false;
          }

          fullResponse += content;
          sentenceBuffer += content;

          // Detectar fim de frase (., ?, !, \n)
          const sentenceEndMatch = sentenceBuffer.match(/[.!?]\s|[.!?]$|\n/);
          if (sentenceEndMatch) {
            const sentence = sentenceBuffer.trim();
            if (sentence.length > 0) {
              sentenceCount++;
              // FIX #9: Não logar conteúdo da frase (PII)
              console.log(`📤 Frase ${sentenceCount} (${sentence.length} chars)`);

              // Enviar frase para o cliente (debug visual)
              ws.send(JSON.stringify({
                type: 'response_partial',
                text: sentence
              }));

              // 🚀 INOVAÇÃO: Gerar TTS da frase imediatamente (await para sequencial)
              await generateTTS(sentence, ws).catch(err => {
                console.error('Erro TTS frase:', err);
              });

              sentenceBuffer = ''; // Limpar buffer
            }
          }
        }
      }

      // Processar último pedaço se sobrou
      if (sentenceBuffer.trim().length > 0) {
        console.log(`📤 Frase final: "${sentenceBuffer.trim()}"`);
        ws.send(JSON.stringify({
          type: 'response_partial',
          text: sentenceBuffer.trim()
        }));
        await generateTTS(sentenceBuffer.trim(), ws);
      }

      const gptTime = Date.now() - gptStart;
      // FIX #9: Não logar resposta completa (PII)
      console.log(`✓ ChatGPT completo (${gptTime}ms, ${fullResponse.length} chars)`);

      // Adicionar resposta ao histórico
      conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      // Enviar resposta completa
      ws.send(JSON.stringify({
        type: 'response',
        text: fullResponse
      }));

      // Enviar informações de token usage para o frontend
      if (tokenUsage) {
        ws.send(JSON.stringify({
          type: 'token_usage',
          usage: {
            prompt_tokens: tokenUsage.prompt_tokens,
            completion_tokens: tokenUsage.completion_tokens,
            total_tokens: tokenUsage.total_tokens
          }
        }));
        console.log(`📊 Tokens: ${tokenUsage.prompt_tokens} input + ${tokenUsage.completion_tokens} output = ${tokenUsage.total_tokens} total`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Tempo total pipeline: ${totalTime}ms`);

    } catch (error) {
      console.error('✗ Erro ao processar com ChatGPT:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro ao processar com LLM'
      }));
    }
  }

  // ===== Função: Gerar TTS com ElevenLabs (Streaming) =====
  async function generateTTS(text, ws) {
    const ttsStart = Date.now();

    try {
      console.log(`→ Gerando áudio com ElevenLabs (${text.length} chars)...`);

      // Usar voice ID customizado do frontend, ou fallback para env var ou padrão
      const voiceId = customVoiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      console.log(`→ Usando Voice ID: ${voiceId}`);
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

      // FIX #12: AbortController para cancelar TTS se usuário interromper
      currentTTSAbortController = new AbortController();

      // FIX #6: Timeout para ElevenLabs (evita travar)
      const response = await axios.post(url, {
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        },
        optimize_streaming_latency: 4
      }, {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKeys.elevenlabs,
          'Content-Type': 'application/json'
        },
        responseType: 'stream',
        timeout: 10000, // 10s timeout
        signal: currentTTSAbortController.signal // Permitir cancelamento
      });

      const ttsTime = Date.now() - ttsStart;
      console.log(`✓ Stream de áudio iniciado (${ttsTime}ms)`);

      // Enviar sinal de início
      ws.send(JSON.stringify({ type: 'audio_start' }));

      // FIX #8: Fazer streaming dos chunks de áudio com BACKPRESSURE
      let firstChunk = true;
      response.data.on('data', (chunk) => {
        if (firstChunk) {
          const firstChunkTime = Date.now() - ttsStart;
          console.log(`🎵 Primeiro chunk de áudio (${firstChunkTime}ms)`);
          firstChunk = false;
        }

        // Verificar backpressure (buffer do WebSocket)
        if (ws.bufferedAmount > 1024 * 1024) { // 1MB
          console.warn('⚠️  Backpressure detectada, pausando stream');
          response.data.pause();

          // Retomar quando buffer diminuir
          const checkBuffer = setInterval(() => {
            if (ws.bufferedAmount < 512 * 1024) { // 512KB
              console.log('✓ Buffer liberado, retomando stream');
              response.data.resume();
              clearInterval(checkBuffer);
            }
          }, 100);
        }

        ws.send(chunk);
      });

      // Quando terminar
      response.data.on('end', () => {
        const totalTtsTime = Date.now() - ttsStart;
        console.log(`✓ Áudio completo gerado (${totalTtsTime}ms)`);
        ws.send(JSON.stringify({ type: 'audio_end' }));
      });

      response.data.on('error', (error) => {
        console.error('✗ Erro no stream:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Erro no stream de áudio' }));
      });

    } catch (error) {
      console.error('✗ Erro ao gerar TTS:', error.response?.data || error.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro ao gerar áudio'
      }));
    }
  }
});

// ===== Função auxiliar: Pegar última transcrição final =====
function getLastFinalTranscript(deepgramConnection) {
  return new Promise((resolve) => {
    let lastFinal = '';

    const handler = (data) => {
      const transcript = data.channel?.alternatives[0]?.transcript;
      if (transcript && data.is_final) {
        lastFinal = transcript;
      }
    };

    deepgramConnection.on('Results', handler);

    // Aguardar um pouco para coletar resultados finais
    setTimeout(() => {
      deepgramConnection.off('Results', handler);
      resolve(lastFinal);
    }, 500);
  });
}

// FIX #5: HEALTH CHECKS - Endpoint para monitoramento
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    activeConnections: wss.clients.size,
    memory: process.memoryUsage(),
    status: 'ok'
  };

  res.json(health);
});

app.get('/metrics', (req, res) => {
  res.json({
    activeConnections: wss.clients.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

// FIX #4: RATE LIMITING básico - limite de conexões por IP
const connectionsByIP = new Map();
const MAX_CONNECTIONS_PER_IP = 5;

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;

  // Verificar limite de conexões
  const currentConnections = connectionsByIP.get(ip) || 0;
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    console.warn(`⚠️  IP ${ip} excedeu limite de conexões (${currentConnections})`);
    ws.close(1008, 'Too many connections from this IP');
    return;
  }

  connectionsByIP.set(ip, currentConnections + 1);

  ws.on('close', () => {
    const count = connectionsByIP.get(ip) || 0;
    if (count > 0) {
      connectionsByIP.set(ip, count - 1);
    }
  });
});

// ===== Iniciar servidor =====
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🎙️  Voice AI MVP Server           ║
║                                       ║
║   Rodando em: http://localhost:${PORT}   ║
║                                       ║
║   Stack:                              ║
║   • Deepgram (STT)                    ║
║   • ChatGPT (LLM)                     ║
║   • ElevenLabs (TTS)                  ║
╚═══════════════════════════════════════╝
  `);
});

// FIX #10: GRACEFUL SHUTDOWN - lidar com SIGTERM/SIGINT
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;

  console.log(`\n⚠️  ${signal} received, iniciando graceful shutdown...`);
  isShuttingDown = true;

  // Parar de aceitar novas conexões
  server.close(() => {
    console.log('✓ HTTP server fechado');
  });

  // Avisar todos os clientes
  console.log(`→ Avisando ${wss.clients.size} clientes ativos...`);
  wss.clients.forEach((ws) => {
    try {
      ws.send(JSON.stringify({
        type: 'server_shutdown',
        message: 'Server está reiniciando, por favor reconecte em alguns segundos'
      }));
    } catch (error) {
      // Cliente já desconectou, ok
    }
  });

  // Aguardar conexões terminarem (max 30s)
  const shutdownTimeout = setTimeout(() => {
    console.log('⚠️  Timeout atingido, forçando shutdown');
    process.exit(0);
  }, 30000);

  const checkInterval = setInterval(() => {
    if (wss.clients.size === 0) {
      console.log('✓ Todas conexões fechadas');
      clearTimeout(shutdownTimeout);
      clearInterval(checkInterval);
      process.exit(0);
    } else {
      console.log(`→ Aguardando ${wss.clients.size} conexões terminarem...`);
    }
  }, 1000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
