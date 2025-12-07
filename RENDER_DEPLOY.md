# 🚀 Deploy do Backend no Render.com

Este guia mostra como fazer deploy do servidor WebSocket no Render.com (free tier).

## 📋 Pré-requisitos

- Conta no GitHub (grátis)
- Conta no Render.com (grátis) - https://render.com

## 🔧 Passo 1: Preparar o Repositório no GitHub

### 1.1 Criar repositório no GitHub
1. Acesse https://github.com/new
2. Nome sugerido: `lume-voice-backend`
3. Deixe como **Public** (necessário para free tier do Render)
4. NÃO adicione README, .gitignore ou license (já temos tudo aqui)
5. Clique em "Create repository"

### 1.2 Fazer push do código
```bash
cd /Users/joabecornelio/voice-mvp

# Inicializar git (se ainda não estiver)
git init

# Adicionar remote do GitHub (substitua SEU_USERNAME)
git remote add origin https://github.com/SEU_USERNAME/lume-voice-backend.git

# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Initial commit - Voice AI backend"

# Fazer push
git push -u origin main
```

## 🌐 Passo 2: Deploy no Render.com

### 2.1 Criar Web Service
1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte sua conta do GitHub se ainda não conectou
4. Selecione o repositório `lume-voice-backend`
5. Clique em **"Connect"**

### 2.2 Configurar o serviço
Preencha os campos:

- **Name**: `lume-voice-backend` (ou qualquer nome)
- **Region**: `Oregon (US West)` (mais próximo do Brasil nas opções gratuitas)
- **Branch**: `main`
- **Root Directory**: deixe em branco
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: **Free** (selecione o plano gratuito)

### 2.3 Variáveis de Ambiente (opcional)
Em "Environment Variables", você pode adicionar (mas não é obrigatório):

| Key | Value |
|-----|-------|
| `ELEVENLABS_VOICE_ID` | `21m00Tcm4TlvDq8ikWAM` |

**Nota**: As API keys (Deepgram, OpenAI, ElevenLabs) NÃO são necessárias aqui, pois o frontend envia elas via WebSocket!

### 2.4 Deploy
1. Clique em **"Create Web Service"**
2. Aguarde o deploy (leva ~3-5 minutos)
3. Quando aparecer "Live", copie a URL do serviço

A URL será algo como: `https://lume-voice-backend.onrender.com`

## ✅ Passo 3: Testar o Backend

Teste se o servidor está funcionando:

```bash
# Testar health check
curl https://SUA-URL.onrender.com/health

# Resposta esperada:
# {"uptime":123,"timestamp":1234567890,"activeConnections":0,"memory":{...},"status":"ok"}
```

## 🔗 Passo 4: Configurar Frontend

Agora você precisa adicionar a URL do Render no frontend (Netlify).

### 4.1 Adicionar variável de ambiente no Netlify

1. Acesse https://app.netlify.com
2. Selecione seu site (`projetolume`)
3. Vá em **"Site configuration"** → **"Environment variables"**
4. Clique em **"Add a variable"**
5. Adicione:

| Key | Value |
|-----|-------|
| `VITE_WS_URL` | `wss://SUA-URL.onrender.com` |

**IMPORTANTE**: Use `wss://` (WebSocket seguro), não `https://`!

Exemplo: `wss://lume-voice-backend.onrender.com`

### 4.2 Redeploy no Netlify
1. Vá em **"Deploys"**
2. Clique em **"Trigger deploy"** → **"Clear cache and deploy site"**
3. Aguarde o deploy finalizar (~2 min)

## 🎉 Pronto!

Seu backend agora está rodando no Render.com e o frontend conecta automaticamente!

## ⚠️ Limitações do Free Tier

- **Sleep após inatividade**: O Render coloca o serviço para "dormir" após 15 minutos sem uso
- **Cold start**: Primeira conexão após sleep demora ~30-60 segundos
- **750 horas/mês**: Suficiente para desenvolvimento, mas não para produção 24/7

### Como evitar sleep (opcional)
Use um serviço de ping como **UptimeRobot** (grátis):
1. Acesse https://uptimerobot.com
2. Adicione monitor HTTP(s) para `https://sua-url.onrender.com/health`
3. Intervalo: 5 minutos
4. Isso mantém o serviço acordado durante o dia

## 🔍 Monitoramento

- **Logs**: https://dashboard.render.com → Seu serviço → "Logs"
- **Métricas**: https://dashboard.render.com → Seu serviço → "Metrics"
- **Health check**: `https://sua-url.onrender.com/health`

## 🆘 Troubleshooting

### Erro: "Deploy failed"
- Verifique os logs no Render
- Certifique-se que `package.json` tem `"start": "node server.js"`

### Erro: WebSocket não conecta
- Certifique-se que usou `wss://` no Netlify (não `ws://`)
- Verifique se o serviço está "Live" no Render
- Aguarde ~30s se o serviço estava dormindo (cold start)

### Erro: 503 Service Unavailable
- O serviço está dormindo (cold start)
- Aguarde 30-60 segundos e tente novamente

## 📚 Próximos Passos

Para produção real, considere:
- **Render Paid Plan** ($7/mês): Sem sleep, mais recursos
- **Railway** ($5/mês): Alternativa com $5 de crédito grátis
- **Fly.io** ($5/mês): Melhor latência para Brasil
