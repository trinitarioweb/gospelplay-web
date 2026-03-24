-- =============================================
-- GOSPELPLAY - ESQUEMA DE BASE DE DATOS
-- Copia y pega esto en Supabase > SQL Editor
-- =============================================

-- 1. TABLA DE CONTENIDO (corazón de la app)
CREATE TABLE contenido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  plataforma TEXT NOT NULL CHECK (plataforma IN ('spotify', 'youtube', 'apple_music')),

  -- Metadata básica
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  duracion TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',

  -- Clasificación IA
  tipo TEXT NOT NULL CHECK (tipo IN ('musica', 'predicacion', 'estudio_biblico', 'podcast', 'testimonio', 'oracion')),
  categoria TEXT NOT NULL CHECK (categoria IN ('adoracion', 'alabanza', 'evangelistico', 'motivacional', 'doctrina', 'profetico', 'intercesion', 'infantil', 'devocional')),
  genero_musical TEXT,
  es_congregacional BOOLEAN DEFAULT false,
  tiene_mensaje BOOLEAN DEFAULT false,
  es_instrumental BOOLEAN DEFAULT false,
  momento_del_culto TEXT,
  energia TEXT DEFAULT 'media' CHECK (energia IN ('baja', 'media', 'alta')),
  nivel TEXT DEFAULT 'basico' CHECK (nivel IN ('basico', 'intermedio', 'avanzado')),

  -- Evaluación teológica
  eval_cristocentrico INTEGER DEFAULT 0 CHECK (eval_cristocentrico BETWEEN 0 AND 100),
  eval_fidelidad_biblica INTEGER DEFAULT 0 CHECK (eval_fidelidad_biblica BETWEEN 0 AND 100),
  eval_profundidad INTEGER DEFAULT 0 CHECK (eval_profundidad BETWEEN 0 AND 100),
  eval_edificante INTEGER DEFAULT 0 CHECK (eval_edificante BETWEEN 0 AND 100),
  eval_doctrina_sana INTEGER DEFAULT 0 CHECK (eval_doctrina_sana BETWEEN 0 AND 100),
  eval_puntuacion_total INTEGER DEFAULT 0 CHECK (eval_puntuacion_total BETWEEN 0 AND 100),
  eval_aprobado BOOLEAN DEFAULT false,
  eval_notas TEXT DEFAULT '',

  -- Contenido bíblico (arrays)
  pasajes TEXT[] DEFAULT '{}',
  versiculos_clave TEXT[] DEFAULT '{}',
  temas TEXT[] DEFAULT '{}',
  personajes TEXT[] DEFAULT '{}',
  doctrina TEXT[] DEFAULT '{}',

  -- Recomendaciones
  apto_para TEXT[] DEFAULT '{}',
  audiencia TEXT[] DEFAULT '{}',

  -- Social
  likes INTEGER DEFAULT 0,
  guardados INTEGER DEFAULT 0,
  compartidos INTEGER DEFAULT 0,

  -- Control
  creado_por UUID REFERENCES auth.users(id),
  revisado_por_ia BOOLEAN DEFAULT false,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE GUÍAS DE ESTUDIO
CREATE TABLE guias_estudio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pasaje_principal TEXT NOT NULL,
  titulo TEXT NOT NULL,
  contexto TEXT DEFAULT '',
  versiculos_clave TEXT[] DEFAULT '{}',
  temas_relacionados TEXT[] DEFAULT '{}',
  pasajes_conectados TEXT[] DEFAULT '{}',
  preguntas_reflexion TEXT[] DEFAULT '{}',
  aplicacion_practica TEXT[] DEFAULT '{}',
  generada_por_ia BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PASOS DE GUÍA (relación con contenido)
CREATE TABLE guia_pasos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guia_id UUID REFERENCES guias_estudio(id) ON DELETE CASCADE,
  contenido_id UUID REFERENCES contenido(id) ON DELETE SET NULL,
  orden INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. COMUNIDADES
CREATE TABLE comunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  imagen TEXT DEFAULT '⛪',
  tipo TEXT DEFAULT 'iglesia' CHECK (tipo IN ('iglesia', 'grupo_estudio', 'banda', 'oracion', 'jovenes')),
  creado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. MIEMBROS DE COMUNIDAD
CREATE TABLE comunidad_miembros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comunidad_id UUID REFERENCES comunidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT DEFAULT 'miembro' CHECK (rol IN ('admin', 'moderador', 'miembro')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comunidad_id, usuario_id)
);

-- 6. FAVORITOS DEL USUARIO
CREATE TABLE favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contenido_id UUID REFERENCES contenido(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, contenido_id)
);

-- 7. PERFILES DE USUARIO
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  iglesia TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. LOG DEL BOT AUTO-CURADOR
CREATE TABLE bot_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('descubrir', 'clasificar', 'generar_guia', 'analizar_tendencias', 'publicar')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'procesando', 'completado', 'error')),
  descripcion TEXT NOT NULL,
  resultado TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 9. BÚSQUEDAS (para analizar tendencias)
CREATE TABLE busquedas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  resultados INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES para búsquedas rápidas
-- =============================================
CREATE INDEX idx_contenido_tipo ON contenido(tipo);
CREATE INDEX idx_contenido_categoria ON contenido(categoria);
CREATE INDEX idx_contenido_aprobado ON contenido(eval_aprobado);
CREATE INDEX idx_contenido_publicado ON contenido(publicado);
CREATE INDEX idx_contenido_temas ON contenido USING GIN(temas);
CREATE INDEX idx_contenido_pasajes ON contenido USING GIN(pasajes);
CREATE INDEX idx_contenido_puntuacion ON contenido(eval_puntuacion_total DESC);
CREATE INDEX idx_favoritos_usuario ON favoritos(usuario_id);
CREATE INDEX idx_busquedas_query ON busquedas(query);
CREATE INDEX idx_busquedas_fecha ON busquedas(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (seguridad)
-- =============================================

-- Contenido: todos pueden leer lo publicado
ALTER TABLE contenido ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contenido público visible" ON contenido FOR SELECT USING (publicado = true AND eval_aprobado = true);
CREATE POLICY "Usuarios pueden crear contenido" ON contenido FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Favoritos: solo el dueño
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver mis favoritos" ON favoritos FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Agregar favorito" ON favoritos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Quitar favorito" ON favoritos FOR DELETE USING (auth.uid() = usuario_id);

-- Perfiles: público lectura, dueño edita
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfiles públicos" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Editar mi perfil" ON perfiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Crear mi perfil" ON perfiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Guías: públicas
ALTER TABLE guias_estudio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guías públicas" ON guias_estudio FOR SELECT USING (true);

ALTER TABLE guia_pasos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pasos públicos" ON guia_pasos FOR SELECT USING (true);

-- Comunidades: públicas
ALTER TABLE comunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comunidades públicas" ON comunidades FOR SELECT USING (true);
CREATE POLICY "Crear comunidad" ON comunidades FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE comunidad_miembros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ver miembros" ON comunidad_miembros FOR SELECT USING (true);
CREATE POLICY "Unirse a comunidad" ON comunidad_miembros FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Salir de comunidad" ON comunidad_miembros FOR DELETE USING (auth.uid() = usuario_id);

-- Bot log: público lectura
ALTER TABLE bot_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bot log público" ON bot_log FOR SELECT USING (true);

-- Búsquedas: insertar si logueado
ALTER TABLE busquedas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Registrar búsqueda" ON busquedas FOR INSERT WITH CHECK (true);

-- =============================================
-- FUNCIÓN: crear perfil al registrarse
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCIÓN: actualizar contadores de likes
-- =============================================
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contenido SET likes = likes + 1 WHERE id = NEW.contenido_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contenido SET likes = likes - 1 WHERE id = OLD.contenido_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_favorito_change
  AFTER INSERT OR DELETE ON favoritos
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();
