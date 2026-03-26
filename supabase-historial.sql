-- ===== HISTORIAL DE ESCUCHA =====
-- Tracks what users listen to (anonymous via session_id, or authenticated via usuario_id)

CREATE TABLE IF NOT EXISTS historial_escucha (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID DEFAULT NULL,
  session_id TEXT NOT NULL,
  contenido_id UUID NOT NULL REFERENCES contenido(id) ON DELETE CASCADE,
  artista_id UUID REFERENCES artistas(id) ON DELETE SET NULL,
  genero TEXT,
  energia TEXT,
  categoria TEXT,
  duracion_escuchada INTEGER DEFAULT 0, -- seconds
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_historial_session_id ON historial_escucha(session_id);
CREATE INDEX IF NOT EXISTS idx_historial_contenido_id ON historial_escucha(contenido_id);
CREATE INDEX IF NOT EXISTS idx_historial_created_at ON historial_escucha(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_escucha(usuario_id) WHERE usuario_id IS NOT NULL;

-- RLS policies (public insert and select for now)
ALTER TABLE historial_escucha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_insert_public" ON historial_escucha
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "historial_select_public" ON historial_escucha
  FOR SELECT TO anon, authenticated
  USING (true);


-- ===== PREFERENCIAS DE USUARIO =====
-- Aggregated preference profile built from listening history

CREATE TABLE IF NOT EXISTS preferencias_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID DEFAULT NULL,
  session_id TEXT NOT NULL,
  generos_favoritos TEXT[] DEFAULT '{}',
  artistas_favoritos UUID[] DEFAULT '{}',
  energia_preferida TEXT DEFAULT 'media',
  categorias_favoritas TEXT[] DEFAULT '{}',
  ultima_actualizacion TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_preferencias_session_id ON preferencias_usuario(session_id);
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario_id ON preferencias_usuario(usuario_id) WHERE usuario_id IS NOT NULL;

-- RLS policies (public insert, select, update for now)
ALTER TABLE preferencias_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferencias_insert_public" ON preferencias_usuario
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "preferencias_select_public" ON preferencias_usuario
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "preferencias_update_public" ON preferencias_usuario
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);
