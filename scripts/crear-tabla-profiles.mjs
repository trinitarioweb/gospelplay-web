#!/usr/bin/env node
/**
 * Crea la tabla user_profiles en Supabase para el sistema de auth
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unuxjxryyxdfmngdhnju.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yt669oTk8lGBgANprEoCXA_H9JKJauq';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('Creando tabla user_profiles...');

  // Try to create the table by inserting a test record and checking
  // Since we use anon key, we need to use the SQL editor in Supabase Dashboard
  // This script will just verify the table exists

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    console.log('\n❌ La tabla user_profiles NO existe.');
    console.log('\nVe al Supabase Dashboard → SQL Editor y ejecuta:\n');
    console.log(`
-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  nombre TEXT NOT NULL DEFAULT '',
  avatar TEXT DEFAULT '',
  spotify_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Politicas RLS: usuarios pueden ver y editar su propio perfil
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indice
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
    `);
  } else if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✅ La tabla user_profiles ya existe!');
  }
}

main().catch(console.error);
