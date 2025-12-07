# 🎙️ Lume Voice AI - Backend

Backend WebSocket para o sistema de Voice AI do Lume. Processa conversas de voz usando:

- **Deepgram** (Speech-to-Text)
- **OpenAI GPT-4** (LLM conversacional)
- **ElevenLabs** (Text-to-Speech)

## 🚀 Deploy no Render.com

Veja o guia completo em: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Servidor rodará em: http://localhost:3001
```

## 📦 Dependências

- express - Servidor HTTP
- ws - WebSocket server
- @deepgram/sdk - Speech-to-Text
- openai - LLM conversacional
- axios - HTTP client
- dotenv - Variáveis de ambiente

## 🔧 Variáveis de Ambiente

Não há variáveis de ambiente obrigatórias. As API keys são enviadas pelo frontend via WebSocket.

Opcional:
- `PORT` - Porta do servidor (padrão: 3000)
- `ELEVENLABS_VOICE_ID` - ID da voz do ElevenLabs (padrão: 21m00Tcm4TlvDq8ikWAM)

## 📡 Endpoints

- `GET /health` - Health check (retorna status, uptime, memória)
- `GET /metrics` - Métricas do servidor (conexões ativas, uptime)
- `WS /` - WebSocket endpoint principal

## 🏗️ Arquitetura

1. Cliente conecta via WebSocket
2. Frontend envia API keys via mensagem `configure`
3. Backend inicia streaming do Deepgram
4. Áudio do usuário → Deepgram → Transcrição
5. Transcrição → GPT-4 (streaming) → Resposta
6. Resposta (frase por frase) → ElevenLabs → Áudio
7. Áudio retorna ao cliente via WebSocket

## 🔒 Segurança

- Rate limiting: Máximo 5 conexões por IP
- Graceful shutdown: Avisa clientes antes de desligar
- Backpressure: Pausa streaming se buffer do WebSocket encher
- Timeout: 15s para OpenAI, 10s para ElevenLabs

## 📝 Licença

MIT
