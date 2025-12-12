const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://xzmnkbqirbyxdheuvuna.supabase.co';
// Usando service role key para ter permissões de ALTER TABLE
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bW5rYnFpcmJ5eGRoZXV2dW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDUyMTQyMywiZXhwIjoyMDgwMDk3NDIzfQ.F6xZHcf_9kbKu9t3EYDEqrLQGFATlrmyj4PCtJFYkpw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🔧 Executando migration Fish Audio...\n');

  const migrationSQL = fs.readFileSync('migrations/add_fishaudio_cost_tracking.sql', 'utf8');

  // Dividir em statements individuais
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executando: ${statement.substring(0, 80)}...`);

    const { data, error } = await supabase.rpc('exec', { sql: statement });

    if (error) {
      console.error('❌ Erro:', error.message);
      // Tentar método alternativo com postgrest
      continue;
    }

    console.log('✅ OK\n');
  }

  console.log('✅ Migration concluída!');
}

runMigration().catch(console.error);
