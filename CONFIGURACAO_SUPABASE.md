# 🔧 Configuração Completa do Supabase - Lume Voice MVP

## ✅ Checklist de Configuração

### 1️⃣ Executar Migration Fish Audio (JÁ FEITO ✅)
- [x] Colunas `fishaudio_cost`, `fishaudio_characters`, `tts_provider` adicionadas
- [x] Índices criados

### 2️⃣ Configurar Políticas RLS (FAZER AGORA)

**O que é RLS?**
Row Level Security garante que cada usuário só pode acessar seus próprios dados.

**Como configurar:**

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/xzmnkbqirbyxdheuvuna/sql/new
   ```

2. **Cole o conteúdo do arquivo `setup_rls_policies.sql`** (está na raiz do projeto)

3. **Clique em RUN** para executar

4. **Verifique o resultado:**
   - Deve mostrar as políticas criadas
   - Deve mostrar RLS habilitado nas 3 tabelas

### 3️⃣ Verificar Variáveis no Render

**Acesse o Render:**
```
https://dashboard.render.com/
```

**Verifique se estas variáveis existem:**

1. Clique no seu serviço (lume-voice-backend)
2. Vá em **Environment** → **Environment Variables**
3. Confirme que existem:

```bash
SUPABASE_URL=https://xzmnkbqirbyxdheuvuna.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bW5rYnFpcmJ5eGRoZXV2dW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjE0MjMsImV4cCI6MjA4MDA5NzQyM30.hMD5jNuzGelXsaQugbdSPYrEyNkW0zJFoFcY72u_jcg
```

**Se não existirem, adicione-as clicando em "Add Environment Variable"**

### 4️⃣ Verificar Deploy

1. No Render, verifique se o deploy está **Live** (verde)
2. Se estiver em "Building", aguarde terminar
3. Se falhar, verifique os logs em **Logs**

---

## 📊 O que cada política RLS faz:

### Tabela `profiles`:
- ✅ Usuário pode criar seu próprio perfil
- ✅ Usuário pode ver apenas seu perfil
- ✅ Usuário pode atualizar apenas seu perfil
- ✅ Usuário pode deletar apenas seu perfil

### Tabela `simulations`:
- ✅ Usuário pode criar simulações
- ✅ Usuário pode ver apenas suas simulações
- ✅ Usuário pode atualizar apenas suas simulações
- ✅ Usuário pode deletar apenas suas simulações

### Tabela `cost_sessions`:
- ✅ Backend pode inserir cost sessions (via anon key)
- ✅ Usuário pode ver apenas seus próprios custos
- ✅ Backend pode atualizar sessions (para finalizar)

---

## ⚠️ Problemas Comuns

### Erro: "new row violates row-level security policy"
**Causa:** RLS não configurado ou políticas incorretas
**Solução:** Execute o script `setup_rls_policies.sql`

### Erro: "Could not connect to database"
**Causa:** Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas no Render
**Solução:** Adicione as variáveis conforme passo 3️⃣

### Frontend não conecta ao backend
**Causa:** Backend no Render não deployado ou variável VITE_WS_URL errada no frontend
**Solução:**
- Verifique deploy no Render
- No frontend, certifique-se que o `.env.local` aponta para produção:
  ```
  VITE_WS_URL=wss://lume-voice-backend.onrender.com
  ```

---

## 🎯 Após configurar tudo:

1. ✅ RLS configurado no Supabase
2. ✅ Variáveis configuradas no Render
3. ✅ Deploy concluído no Render
4. ✅ Frontend aponta para o Render (não localhost)

**Teste:**
- Acesse o frontend em produção
- Faça login
- Tente criar uma simulação
- Deve funcionar sem erros!

---

## 📞 Need Help?

Se algo não funcionar:
1. Verifique os logs do Render (tab "Logs")
2. Verifique o console do navegador (F12)
3. Verifique se o RLS está habilitado nas tabelas do Supabase
