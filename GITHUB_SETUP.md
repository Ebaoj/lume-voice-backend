# 🚀 Criar Repositório no GitHub - Passo a Passo

## Opção 1: Via GitHub Web (Mais Fácil)

### 1. Criar o repositório
1. Abra: https://github.com/new
2. Preencha:
   - **Repository name**: `lume-voice-backend`
   - **Description**: `Backend WebSocket para Lume Voice AI (Deepgram + GPT-4 + ElevenLabs)`
   - **Visibility**: ✅ **Public** (necessário para free tier do Render)
   - ❌ **NÃO marque** "Add a README file"
   - ❌ **NÃO marque** "Add .gitignore"
   - ❌ **NÃO marque** "Choose a license"
3. Clique em **"Create repository"**

### 2. Conectar repositório local
Na página que aparecer após criar o repo, você verá comandos. Use estes:

```bash
cd /Users/joabecornelio/voice-mvp

# Adicionar remote (substitua SEU_USERNAME pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USERNAME/lume-voice-backend.git

# Renomear branch para main (se necessário)
git branch -M main

# Fazer push
git push -u origin main
```

**Exemplo**: Se seu usuário é `Ebaoj`, use:
```bash
git remote add origin https://github.com/Ebaoj/lume-voice-backend.git
git branch -M main
git push -u origin main
```

## Opção 2: Via GitHub CLI (gh)

Se você tem o GitHub CLI instalado:

```bash
cd /Users/joabecornelio/voice-mvp

# Criar repo e fazer push automaticamente
gh repo create lume-voice-backend --public --source=. --remote=origin --push
```

## ✅ Verificar se funcionou

Após fazer o push, acesse:
```
https://github.com/SEU_USERNAME/lume-voice-backend
```

Você deve ver:
- ✅ README.md
- ✅ server.js
- ✅ package.json
- ✅ RENDER_DEPLOY.md
- ✅ .gitignore
- ✅ .env.example

## 🎯 Próximo Passo

Depois que o repositório estiver criado, você pode fazer o deploy no Render.com!

Siga as instruções em: `RENDER_DEPLOY.md`
