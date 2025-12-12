-- ============================================
-- SETUP COMPLETO DE RLS PARA LUME VOICE MVP
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/xzmnkbqirbyxdheuvuna/sql/new

-- ============================================
-- 1. TABELA: profiles
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem inserir seu próprio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem visualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Usuários podem deletar seu próprio perfil
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================
-- 2. TABELA: simulations
-- ============================================

-- Habilitar RLS
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem inserir simulações
DROP POLICY IF EXISTS "Users can insert own simulations" ON simulations;
CREATE POLICY "Users can insert own simulations" ON simulations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem visualizar suas próprias simulações
DROP POLICY IF EXISTS "Users can view own simulations" ON simulations;
CREATE POLICY "Users can view own simulations" ON simulations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias simulações
DROP POLICY IF EXISTS "Users can update own simulations" ON simulations;
CREATE POLICY "Users can update own simulations" ON simulations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias simulações
DROP POLICY IF EXISTS "Users can delete own simulations" ON simulations;
CREATE POLICY "Users can delete own simulations" ON simulations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TABELA: cost_sessions
-- ============================================

-- Habilitar RLS
ALTER TABLE cost_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Permitir inserção de cost sessions (backend insere via anon key)
DROP POLICY IF EXISTS "Allow insert cost sessions" ON cost_sessions;
CREATE POLICY "Allow insert cost sessions" ON cost_sessions
  FOR INSERT
  WITH CHECK (true);

-- Política: Usuários podem visualizar seus próprios cost sessions
DROP POLICY IF EXISTS "Users can view own cost sessions" ON cost_sessions;
CREATE POLICY "Users can view own cost sessions" ON cost_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Permitir atualização de cost sessions (para finalizar sessões)
DROP POLICY IF EXISTS "Allow update cost sessions" ON cost_sessions;
CREATE POLICY "Allow update cost sessions" ON cost_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar políticas criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'simulations', 'cost_sessions')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'simulations', 'cost_sessions');
