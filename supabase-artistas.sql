-- =============================================
-- GOSPELPLAY - TABLA DE ARTISTAS
-- Ejecuta esto en Supabase > SQL Editor
-- =============================================

-- 1. TABLA DE ARTISTAS
CREATE TABLE artistas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  imagen TEXT DEFAULT '',
  banner TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  pais TEXT DEFAULT '',
  generos TEXT[] DEFAULT '{}',
  tipo TEXT DEFAULT 'artista' CHECK (tipo IN ('artista', 'banda', 'pastor', 'ministerio', 'predicador')),
  youtube_canal TEXT DEFAULT '',
  spotify_id TEXT DEFAULT '',
  artistas_relacionados TEXT[] DEFAULT '{}',
  seguidores INTEGER DEFAULT 0,
  verificado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AGREGAR RELACIÓN artista_id EN CONTENIDO
ALTER TABLE contenido ADD COLUMN IF NOT EXISTS artista_id UUID REFERENCES artistas(id);

-- 3. ÍNDICES
CREATE INDEX idx_artistas_slug ON artistas(slug);
CREATE INDEX idx_artistas_generos ON artistas USING GIN(generos);
CREATE INDEX idx_contenido_artista ON contenido(artista_id);

-- 4. ROW LEVEL SECURITY
ALTER TABLE artistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artistas públicos" ON artistas FOR SELECT USING (activo = true);
CREATE POLICY "Insertar artistas" ON artistas FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar artistas" ON artistas FOR UPDATE USING (true);

-- =============================================
-- SEED: ARTISTAS CRISTIANOS REALES
-- =============================================

INSERT INTO artistas (nombre, slug, bio, pais, generos, tipo, youtube_canal, artistas_relacionados, verificado) VALUES

-- === WORSHIP EN ESPAÑOL ===
('Marcos Witt', 'marcos-witt', 'Pionero de la música cristiana latina. Ganador de múltiples premios Grammy Latino, pastor y líder de adoración con más de 30 años de ministerio.', 'México', ARRAY['worship', 'balada_cristiana', 'pop_cristiano'], 'artista', 'MarcoswittTV', ARRAY['danilo-montero', 'jesus-adrian-romero', 'miel-san-marcos'], true),

('Miel San Marcos', 'miel-san-marcos', 'Ministerio de adoración guatemalteco conocido por sus poderosas canciones congregacionales. Líderes del movimiento de worship en Latinoamérica.', 'Guatemala', ARRAY['worship', 'pop_cristiano'], 'banda', 'MielSanMarcos', ARRAY['marcos-witt', 'barak', 'su-presencia', 'un-corazon'], true),

('Danilo Montero', 'danilo-montero', 'Pastor y adorador costarricense. Reconocido mundialmente por canciones como "Te Alabaré" y décadas de ministerio en adoración.', 'Costa Rica', ARRAY['worship', 'balada_cristiana'], 'artista', 'DaniloMonteroTV', ARRAY['marcos-witt', 'jesus-adrian-romero', 'christine-dclario'], true),

('Jesús Adrián Romero', 'jesus-adrian-romero', 'Cantautor cristiano mexicano. Sus canciones de adoración íntima han marcado generaciones. Conocido por "Mi Universo", "Te Exaltaré".', 'México', ARRAY['worship', 'balada_cristiana', 'pop_cristiano'], 'artista', 'JesusAdrianRomeroVEVO', ARRAY['marcos-witt', 'danilo-montero', 'marcela-gandara'], true),

('Christine D''Clario', 'christine-dclario', 'Adoradora puertorriqueña con una voz poderosa. Conocida por "Admirable", "Como Dijiste", "Gloria en lo Alto".', 'Puerto Rico', ARRAY['worship', 'pop_cristiano'], 'artista', 'ChristineDClario', ARRAY['ingrid-rosario', 'kari-jobe', 'averly-morillo'], true),

('Su Presencia', 'su-presencia', 'Ministerio de adoración de la Iglesia El Lugar de Su Presencia en Bogotá, Colombia. Líderes del worship contemporáneo latino.', 'Colombia', ARRAY['worship', 'pop_cristiano'], 'ministerio', 'supresencia', ARRAY['miel-san-marcos', 'un-corazon', 'barak', 'elevation-worship'], true),

('Un Corazón', 'un-corazon', 'Banda de worship mexicana liderada por Lead. Conocidos por su estilo fresco y canciones como "Cristo es Rey", "Rey de Reyes".', 'México', ARRAY['worship', 'pop_cristiano'], 'banda', 'UnCorazonLead', ARRAY['miel-san-marcos', 'su-presencia', 'barak'], true),

('Barak', 'barak', 'Grupo de adoración hondureño. Su música enérgica y profunda los ha posicionado como referentes del worship latino moderno.', 'Honduras', ARRAY['worship', 'pop_cristiano'], 'banda', 'BarakOficial', ARRAY['miel-san-marcos', 'un-corazon', 'su-presencia'], true),

('Averly Morillo', 'averly-morillo', 'Adoradora dominicana que saltó a la fama con "Mesías". Su estilo fresco conecta adoración profunda con sonidos contemporáneos.', 'República Dominicana', ARRAY['worship', 'pop_cristiano'], 'artista', 'AverlyMorillo', ARRAY['christine-dclario', 'ingrid-rosario', 'su-presencia'], true),

('Ingrid Rosario', 'ingrid-rosario', 'Adoradora y salmista dominicana. Conocida por "Muéstrame Tu Gloria", con un estilo de adoración profunda y reverente.', 'República Dominicana', ARRAY['worship', 'balada_cristiana'], 'artista', 'IngridRosarioOficial', ARRAY['christine-dclario', 'averly-morillo', 'marcela-gandara'], true),

('Marcela Gándara', 'marcela-gandara', 'Cantante mexicana de música cristiana. Reconocida por "Supe Que Me Amabas" y su ministerio de adoración.', 'México', ARRAY['worship', 'balada_cristiana', 'pop_cristiano'], 'artista', 'MarcelaGandara', ARRAY['jesus-adrian-romero', 'christine-dclario', 'ingrid-rosario'], true),

-- === WORSHIP EN INGLÉS ===
('Hillsong Worship', 'hillsong-worship', 'Ministerio de adoración de Hillsong Church, Australia. Responsables de himnos modernos que se cantan en iglesias de todo el mundo.', 'Australia', ARRAY['worship'], 'ministerio', 'hillsongworship', ARRAY['bethel-music', 'elevation-worship', 'chris-tomlin'], true),

('Bethel Music', 'bethel-music', 'Colectivo de worship de Bethel Church, Redding California. Conocidos por crear atmósferas de adoración profunda y soaking.', 'Estados Unidos', ARRAY['worship', 'soaking'], 'ministerio', 'bethelmusic', ARRAY['hillsong-worship', 'elevation-worship', 'maverick-city-music'], true),

('Elevation Worship', 'elevation-worship', 'Ministerio de adoración de Elevation Church, Charlotte NC. Liderados por Chris Brown y otros adoradores talentosos.', 'Estados Unidos', ARRAY['worship', 'pop_cristiano'], 'ministerio', 'elevationworship', ARRAY['hillsong-worship', 'bethel-music', 'maverick-city-music'], true),

('Maverick City Music', 'maverick-city-music', 'Colectivo de adoración multicultural que ha revolucionado el worship con su sonido fresco, gospel y espontáneo.', 'Estados Unidos', ARRAY['worship', 'pop_cristiano'], 'ministerio', 'maverickcitymusic', ARRAY['elevation-worship', 'bethel-music', 'kari-jobe'], true),

('Kari Jobe', 'kari-jobe', 'Adoradora y compositora estadounidense. Conocida por "Revelation Song", "The Blessing" y su corazón de adoración.', 'Estados Unidos', ARRAY['worship', 'pop_cristiano'], 'artista', 'KariJobeVEVO', ARRAY['christine-dclario', 'bethel-music', 'chris-tomlin'], true),

('Chris Tomlin', 'chris-tomlin', 'Uno de los compositores de worship más influyentes. "How Great Is Our God", "Good Good Father" se cantan en todo el mundo.', 'Estados Unidos', ARRAY['worship', 'pop_cristiano'], 'artista', 'christomlinVEVO', ARRAY['hillsong-worship', 'kari-jobe', 'matt-redman'], true),

('CityAlight', 'cityalight', 'Ministerio australiano conocido por himnos modernos con profundidad teológica. "Yet Not I But Through Christ In Me".', 'Australia', ARRAY['worship', 'himnos_clasicos'], 'ministerio', 'CityAlight', ARRAY['keith-and-kristyn-getty', 'hillsong-worship', 'chris-tomlin'], true),

-- === POP CRISTIANO ===
('Lauren Daigle', 'lauren-daigle', 'Cantante estadounidense de pop/worship. "You Say" rompió récords. Su voz única cruza fronteras entre lo secular y lo cristiano.', 'Estados Unidos', ARRAY['pop_cristiano', 'worship'], 'artista', 'LaurenDaigleVEVO', ARRAY['casting-crowns', 'for-king-and-country', 'chris-tomlin'], true),

('Evan Craft', 'evan-craft', 'Cantante estadounidense que canta en español. Puente entre la música cristiana en inglés y español con un estilo pop fresco.', 'Estados Unidos', ARRAY['pop_cristiano', 'worship'], 'artista', 'EvanCraftVEVO', ARRAY['un-corazon', 'miel-san-marcos', 'for-king-and-country'], true),

('for KING & COUNTRY', 'for-king-and-country', 'Dúo australiano-estadounidense de pop cristiano. Ganadores de Grammy con canciones como "God Only Knows", "joy.".', 'Australia', ARRAY['pop_cristiano'], 'banda', 'forKINGandCOUNTRY', ARRAY['lauren-daigle', 'casting-crowns', 'tobymac'], true),

('Casting Crowns', 'casting-crowns', 'Banda de pop/rock cristiano liderada por Mark Hall. Conocidos por "Who Am I", "Voice of Truth", "Just Be Held".', 'Estados Unidos', ARRAY['pop_cristiano', 'rock_cristiano'], 'banda', 'CastingCrownsVEVO', ARRAY['lauren-daigle', 'for-king-and-country', 'chris-tomlin'], true),

('TobyMac', 'tobymac', 'Artista de pop/hip-hop cristiano, ex miembro de DC Talk. Pionero en fusionar géneros urbanos con mensaje cristiano.', 'Estados Unidos', ARRAY['pop_cristiano', 'hip_hop_cristiano'], 'artista', 'tobymacVEVO', ARRAY['lecrae', 'for-king-and-country', 'casting-crowns'], true),

-- === ROCK CRISTIANO ===
('Switchfoot', 'switchfoot', 'Banda de rock alternativo cristiano de San Diego. "Dare You To Move", "Meant to Live". Rock con letras de fe profundas.', 'Estados Unidos', ARRAY['rock_cristiano', 'pop_cristiano'], 'banda', 'switchfoot', ARRAY['skillet', 'casting-crowns', 'rescate'], true),

('Skillet', 'skillet', 'Banda de rock cristiano con elementos de metal. "Monster", "Feel Invincible". Rock pesado con mensaje cristiano poderoso.', 'Estados Unidos', ARRAY['rock_cristiano'], 'banda', 'SkilletVEVO', ARRAY['switchfoot', 'rescate', 'rojo'], true),

('Rescate', 'rescate', 'Banda de rock cristiano argentina. Pioneros del rock cristiano en español con un sonido poderoso y letras bíblicas.', 'Argentina', ARRAY['rock_cristiano'], 'banda', 'RescateOficial', ARRAY['rojo', 'switchfoot', 'skillet'], true),

('Rojo', 'rojo', 'Banda colombiana de rock/pop cristiano. Conocidos por fusionar rock enérgico con adoración congregacional.', 'Colombia', ARRAY['rock_cristiano', 'pop_cristiano'], 'banda', 'RojoOficial', ARRAY['rescate', 'su-presencia', 'evan-craft'], true),

-- === URBANO / REGGAETON CRISTIANO ===
('Funky', 'funky', 'Pionero del reggaetón cristiano puertorriqueño. Ha demostrado que el género urbano puede llevar un mensaje de fe poderoso.', 'Puerto Rico', ARRAY['reggaeton_cristiano', 'hip_hop_cristiano'], 'artista', 'FunkyOficial', ARRAY['redimi2', 'alex-zurdo', 'jay-kalyl'], true),

('Redimi2', 'redimi2', 'Rapero y productor dominicano. Líder del movimiento urbano cristiano en Latinoamérica con "Filipenses 1:6", "Espíritu Santo".', 'República Dominicana', ARRAY['reggaeton_cristiano', 'hip_hop_cristiano'], 'artista', 'Redimi2oficial', ARRAY['funky', 'alex-zurdo', 'manny-montes'], true),

('Alex Zurdo', 'alex-zurdo', 'Rapero cristiano puertorriqueño. Conocido por su lírica profunda y su ministerio a través del hip-hop.', 'Puerto Rico', ARRAY['hip_hop_cristiano', 'reggaeton_cristiano'], 'artista', 'alexzurdoTV', ARRAY['redimi2', 'funky', 'manny-montes'], true),

('Jay Kalyl', 'jay-kalyl', 'Artista urbano cristiano puertorriqueño de nueva generación. Fusiona trap, reggaetón y worship con autenticidad.', 'Puerto Rico', ARRAY['reggaeton_cristiano', 'hip_hop_cristiano'], 'artista', 'JayKalyl', ARRAY['funky', 'redimi2', 'alex-zurdo'], true),

('Manny Montes', 'manny-montes', 'Rapero cristiano puertorriqueño veterano. Una de las voces más respetadas del hip-hop cristiano en español.', 'Puerto Rico', ARRAY['hip_hop_cristiano', 'reggaeton_cristiano'], 'artista', 'MannyMontesOficial', ARRAY['redimi2', 'alex-zurdo', 'funky'], true),

-- === HIP HOP CRISTIANO (INGLÉS) ===
('Lecrae', 'lecrae', 'Rapero cristiano estadounidense, ganador de Grammy. Ha llevado el hip-hop cristiano al mainstream con autenticidad.', 'Estados Unidos', ARRAY['hip_hop_cristiano'], 'artista', 'lecaborhood', ARRAY['andy-mineo', 'tobymac', 'nf'], true),

('NF', 'nf', 'Rapero estadounidense conocido por sus letras profundas y personales. Su música aborda fe, salud mental y superación.', 'Estados Unidos', ARRAY['hip_hop_cristiano', 'pop_cristiano'], 'artista', 'NFVEVO', ARRAY['lecrae', 'andy-mineo', 'tobymac'], true),

-- === PREDICADORES / PASTORES ===
('Andrés Corson', 'andres-corson', 'Pastor principal de la Iglesia El Lugar de Su Presencia en Bogotá. Predicador con profundidad bíblica y aplicación práctica.', 'Colombia', ARRAY[]::TEXT[], 'pastor', 'supresencia', ARRAY['cash-luna', 'danilo-montero'], true),

('Cash Luna', 'cash-luna', 'Pastor guatemalteco fundador de Casa de Dios. Predicador reconocido en Latinoamérica con un ministerio de avivamiento.', 'Guatemala', ARRAY[]::TEXT[], 'pastor', 'casikiuno', ARRAY['andres-corson', 'marcos-witt'], true),

-- === SALSA/TROPICAL CRISTIANA ===
('Samuel Hernández', 'samuel-hernandez', 'Salmista puertorriqueño de salsa cristiana. Ha llevado el mensaje del evangelio a través de ritmos tropicales.', 'Puerto Rico', ARRAY['salsa_cristiana'], 'artista', 'SamuelHernandezTV', ARRAY['funky', 'marcos-witt', 'ingrid-rosario'], true);

-- =============================================
-- LIMPIAR CONTENIDO FICTICIO
-- =============================================
-- Primero eliminamos el contenido de ejemplo
DELETE FROM guia_pasos;
DELETE FROM guias_estudio;
DELETE FROM contenido;
DELETE FROM bot_log;
