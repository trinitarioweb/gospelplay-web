'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { obtenerMusica, obtenerTodoContenido, obtenerArtistas } from '@/lib/database';
import { useFavorites } from '@/context/FavoritesContext';
import type { Contenido, Artista } from '@/types/content';
import Navbar from '@/components/Navbar';
import HeroBanner from '@/components/HeroBanner';
import ContentRow from '@/components/ContentRow';
import { useRouter } from 'next/navigation';

// Curated movies
const PELICULAS = [
  { id: 'sound-of-freedom', titulo: 'Sound of Freedom', subtitulo: 'Angel Studios | 2023', imagen: 'https://image.tmdb.org/t/p/w500/qA5kPYZA7FkVvqcEfJRoOy4kpHg.jpg', url: 'https://www.angel.com/watch/sound-of-freedom', plataforma: 'angel_studios', tipo: 'pelicula', valoracion: 95 },
  { id: 'milagros-del-cielo', titulo: 'Milagros del Cielo', subtitulo: 'Drama | 2016', imagen: 'https://image.tmdb.org/t/p/w500/o0UugVkLIrRoNYkqfJHg1tvfQyW.jpg', url: 'https://www.netflix.com/search?q=miracles+from+heaven', plataforma: 'netflix', tipo: 'pelicula', valoracion: 85 },
  { id: 'war-room', titulo: 'Cuarto de Guerra', subtitulo: 'Drama | 2015', imagen: 'https://image.tmdb.org/t/p/w500/k0YaAJmXKyNAdT9i3pLGDRmcQOz.jpg', url: 'https://www.netflix.com/search?q=war+room', plataforma: 'netflix', tipo: 'pelicula', valoracion: 88 },
  { id: 'gods-not-dead', titulo: 'God is Not Dead', subtitulo: 'Drama | 2014', imagen: 'https://image.tmdb.org/t/p/w500/p0r8TPSggJxbxwW0PBx7jdZftRm.jpg', url: 'https://www.youtube.com/results?search_query=gods+not+dead+pelicula', plataforma: 'youtube', tipo: 'pelicula', valoracion: 80 },
  { id: 'i-can-only-imagine', titulo: 'I Can Only Imagine', subtitulo: 'Biografico | 2018', imagen: 'https://image.tmdb.org/t/p/w500/a0cwb0MHWK7pxbFQxwsZHNaXnpB.jpg', url: 'https://www.youtube.com/results?search_query=i+can+only+imagine+movie', plataforma: 'youtube', tipo: 'pelicula', valoracion: 90 },
  { id: 'overcomer', titulo: 'Overcomer', subtitulo: 'Drama | 2019', imagen: 'https://image.tmdb.org/t/p/w500/qjOQhq8uOYjKUdElI0gPGhkSZRp.jpg', url: 'https://www.youtube.com/results?search_query=overcomer+movie+kendrick', plataforma: 'youtube', tipo: 'pelicula', valoracion: 85 },
  { id: 'courageous', titulo: 'Courageous', subtitulo: 'Drama | 2011', imagen: 'https://image.tmdb.org/t/p/w500/1hZD5QDRIG5njAQmwo7YFOZ1uCL.jpg', url: 'https://www.youtube.com/results?search_query=courageous+pelicula', plataforma: 'youtube', tipo: 'pelicula', valoracion: 82 },
  { id: 'facing-giants', titulo: 'Facing the Giants', subtitulo: 'Drama | 2006', imagen: 'https://image.tmdb.org/t/p/w500/4ZaIXLFFjfpP8iB7fVNwvFSeILp.jpg', url: 'https://www.youtube.com/results?search_query=facing+the+giants', plataforma: 'youtube', tipo: 'pelicula', valoracion: 78 },
];

// Curated series
const SERIES = [
  { id: 'the-chosen', titulo: 'The Chosen', subtitulo: 'Angel Studios | 2017-', imagen: 'https://image.tmdb.org/t/p/w500/jA9y5M4ax5HfO2nrWfQPwp9jz5A.jpg', url: 'https://watch.angelstudios.com/thechosen', plataforma: 'angel_studios', tipo: 'serie', valoracion: 98 },
  { id: 'the-bible', titulo: 'The Bible', subtitulo: 'History | 2013', imagen: 'https://image.tmdb.org/t/p/w500/u2YpV1BoDJdGZcNXXGkX1VSBYW0.jpg', url: 'https://www.netflix.com/search?q=the+bible+series', plataforma: 'netflix', tipo: 'serie', valoracion: 90 },
  { id: 'ad-bible', titulo: 'A.D. The Bible Continues', subtitulo: 'NBC | 2015', imagen: 'https://image.tmdb.org/t/p/w500/rWiR9LY7vKvqDeJgEHS8W7SkL5W.jpg', url: 'https://www.netflix.com/search?q=ad+the+bible+continues', plataforma: 'netflix', tipo: 'serie', valoracion: 85 },
  { id: 'david', titulo: 'David', subtitulo: 'Wonder Project | 2025', imagen: 'https://image.tmdb.org/t/p/w500/ghjDrlEYFczDxmSTzM5V8bXs6yV.jpg', url: 'https://www.angel.com/watch/david', plataforma: 'angel_studios', tipo: 'serie', valoracion: 92 },
];

// Curated podcasts
const PODCASTS = [
  { id: 'bible-project-es', titulo: 'The Bible Project', subtitulo: 'Espanol', imagen: 'https://yt3.googleusercontent.com/ytc/AIdro_kqmVwUGfvXvpA4P2p3LHbL3cM5GWN5vWxKqzaCKw=s900-c-k-c0x00ffffff-no-rj', url: 'https://www.youtube.com/@BibleProjectEspanol', plataforma: 'youtube', tipo: 'podcast' },
  { id: 'desiring-god-es', titulo: 'Desiring God', subtitulo: 'John Piper', imagen: 'https://yt3.googleusercontent.com/ytc/AIdro_n0m4bX8PzQV3rVX5D9TJ9PKdVdFRVLcwHmwiHF9A=s900-c-k-c0x00ffffff-no-rj', url: 'https://www.youtube.com/@desiringgodespanol', plataforma: 'youtube', tipo: 'podcast' },
  { id: 'coalicion', titulo: 'Coalicion por el Evangelio', subtitulo: 'Teologia reformada', imagen: 'https://yt3.googleusercontent.com/ytc/AIdro_lR3mFj_OkdWz3JcJ1zV0J0zYR7cUJPZMnxhDKe=s900-c-k-c0x00ffffff-no-rj', url: 'https://www.youtube.com/@CoalicionporelEvangelio', plataforma: 'youtube', tipo: 'podcast' },
  { id: 'soldados', titulo: 'Soldados de Jesus', subtitulo: 'Teologia y vida', imagen: 'https://yt3.googleusercontent.com/ytc/AIdro_nDXvN8fBmqQE1ZKhB0xhBJ3sDwKJwHp8n8yGBI=s900-c-k-c0x00ffffff-no-rj', url: 'https://www.youtube.com/@SoldadosdeJesus', plataforma: 'youtube', tipo: 'podcast' },
];

// Hero featured items
const HERO_ITEMS = [
  {
    titulo: 'The Chosen',
    descripcion: 'La vida de Jesus a traves de los ojos de quienes lo conocieron. La serie mas vista de Angel Studios que ha transformado millones de vidas.',
    imagen: 'https://image.tmdb.org/t/p/original/pdVHUwb8Dhy70ynMyXaEpf8YgRh.jpg',
    url: 'https://watch.angelstudios.com/thechosen',
    tags: ['Drama biblico', 'Serie', '2017'],
    tipo: 'Serie destacada',
    plataforma: 'angel_studios',
  },
  {
    titulo: 'Sound of Freedom',
    descripcion: 'La historia real de Tim Ballard, un agente que arriesga todo para rescatar ninos de traficantes. Una de las peliculas mas impactantes del ano.',
    imagen: 'https://image.tmdb.org/t/p/original/a2jWeGDpRKD7Z9gqmTjn2Wdvz3d.jpg',
    url: 'https://www.angel.com/watch/sound-of-freedom',
    tags: ['Drama', 'Basada en hechos reales'],
    tipo: 'Pelicula destacada',
    plataforma: 'angel_studios',
  },
];

type Section = 'home' | 'musica' | 'peliculas' | 'series' | 'podcasts' | 'artistas' | 'favoritos';

export default function HomePage() {
  const router = useRouter();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const [musica, setMusica] = useState<Contenido[]>([]);
  const [todoContenido, setTodoContenido] = useState<Contenido[]>([]);
  const [artistas, setArtistas] = useState<Artista[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const [m, t, a] = await Promise.all([
        obtenerMusica(),
        obtenerTodoContenido(),
        obtenerArtistas(),
      ]);
      setMusica(m);
      setTodoContenido(t);
      setArtistas(a);
      setCargando(false);
    }
    cargar();
  }, []);

  // Transform Contenido to ContentRow item
  const toContentItem = (c: Contenido) => ({
    id: c.id,
    titulo: c.titulo,
    subtitulo: c.artista,
    imagen: c.thumbnail,
    url: c.url,
    plataforma: c.plataforma,
    tipo: c.clasificacion?.tipo,
    valoracion: c.evaluacion?.puntuacionTotal,
  });

  const toArtistaItem = (a: Artista) => ({
    id: a.id,
    titulo: a.nombre,
    subtitulo: a.tipo === 'banda' ? 'Banda' : a.tipo === 'pastor' ? 'Pastor' : 'Artista',
    imagen: a.imagen,
    url: `/artista/${a.slug}`,
  });

  // Filter by search
  const filteredContent = searchQuery
    ? todoContenido.filter(c =>
        c.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.artista.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (cargando) {
    return (
      <div className="flex h-screen bg-[#0a0a0a] text-white items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-amber-500" size={48} />
          <p className="font-bold text-lg">Cargando GospelPlay...</p>
        </div>
      </div>
    );
  }

  // Derive lists
  const worship = musica.filter(m => m.clasificacion?.generoMusical === 'worship').slice(0, 20);
  const popCristiano = musica.filter(m => m.clasificacion?.generoMusical === 'pop_cristiano').slice(0, 20);
  const rockCristiano = musica.filter(m => m.clasificacion?.generoMusical === 'rock_cristiano').slice(0, 20);
  const hipHop = musica.filter(m => m.clasificacion?.generoMusical === 'hip_hop_cristiano').slice(0, 20);
  const urbano = musica.filter(m => ['reggaeton_cristiano', 'salsa_cristiana'].includes(m.clasificacion?.generoMusical || '')).slice(0, 20);
  const himnos = musica.filter(m => m.clasificacion?.generoMusical === 'himnos_clasicos').slice(0, 20);
  const topRated = [...musica].sort((a, b) => (b.evaluacion?.puntuacionTotal || 0) - (a.evaluacion?.puntuacionTotal || 0)).slice(0, 20);
  const topArtistas = [...artistas].sort((a, b) => b.seguidores - a.seguidores).slice(0, 20);
  const favoritesContent = todoContenido.filter(c => isFavorite(c.id));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar
        onNavigate={(s) => setActiveSection(s as Section)}
        activeSection={activeSection}
        onSearch={setSearchQuery}
        favoritesCount={favorites.size}
      />

      <main className="pt-16">
        {/* Search results */}
        {searchQuery && (
          <div className="px-4 sm:px-6 md:px-12 py-8">
            <h2 className="text-2xl font-bold mb-6">Resultados para &quot;{searchQuery}&quot;</h2>
            {filteredContent.length > 0 ? (
              <ContentRow
                title={`${filteredContent.length} resultados`}
                items={filteredContent.slice(0, 30).map(toContentItem)}
                onFavorite={toggleFavorite}
                isFavorite={isFavorite}
                variant="poster"
              />
            ) : (
              <p className="text-white/60">No se encontro contenido</p>
            )}
          </div>
        )}

        {/* HOME */}
        {!searchQuery && activeSection === 'home' && (
          <>
            <HeroBanner items={HERO_ITEMS} />

            <ContentRow
              title="Peliculas cristianas"
              subtitle="Donde verlas en streaming"
              items={PELICULAS}
              variant="poster"
            />

            <ContentRow
              title="Series destacadas"
              subtitle="Lo mejor de Angel Studios y mas"
              items={SERIES}
              variant="poster"
            />

            <ContentRow
              title="Lo mejor valorado"
              subtitle="Segun nuestra curaduria"
              items={topRated.map(toContentItem)}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite}
              variant="poster"
              onViewAll={() => setActiveSection('musica')}
            />

            <ContentRow
              title="Worship"
              subtitle="Adoracion profunda"
              items={worship.map(toContentItem)}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite}
              variant="poster"
            />

            <ContentRow
              title="Artistas populares"
              items={topArtistas.map(toArtistaItem)}
              variant="circle"
              onViewAll={() => setActiveSection('artistas')}
            />

            <ContentRow
              title="Podcasts recomendados"
              items={PODCASTS}
              variant="wide"
            />

            <ContentRow
              title="Pop cristiano"
              items={popCristiano.map(toContentItem)}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite}
              variant="poster"
            />

            <ContentRow
              title="Rock cristiano"
              items={rockCristiano.map(toContentItem)}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite}
              variant="poster"
            />

            <ContentRow
              title="Hip-hop cristiano"
              items={hipHop.map(toContentItem)}
              onFavorite={toggleFavorite}
              isFavorite={isFavorite}
              variant="poster"
            />
          </>
        )}

        {/* MUSICA */}
        {!searchQuery && activeSection === 'musica' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Musica</h1>
              <p className="text-white/60">Descubre musica cristiana curada, link directo a Spotify y YouTube</p>
            </div>
            <ContentRow title="Worship" items={worship.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
            <ContentRow title="Pop Cristiano" items={popCristiano.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
            <ContentRow title="Rock Cristiano" items={rockCristiano.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
            <ContentRow title="Hip-Hop Cristiano" items={hipHop.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
            <ContentRow title="Urbano Cristiano" items={urbano.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
            <ContentRow title="Himnos Clasicos" items={himnos.map(toContentItem)} onFavorite={toggleFavorite} isFavorite={isFavorite} variant="poster" />
          </div>
        )}

        {/* PELICULAS */}
        {!searchQuery && activeSection === 'peliculas' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Peliculas Cristianas</h1>
              <p className="text-white/60">Las mejores peliculas de fe con enlaces directos a donde verlas</p>
            </div>
            <ContentRow title="Destacadas" items={PELICULAS} variant="poster" />
          </div>
        )}

        {/* SERIES */}
        {!searchQuery && activeSection === 'series' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Series</h1>
              <p className="text-white/60">Lo mejor de Angel Studios y mas plataformas</p>
            </div>
            <ContentRow title="Destacadas" items={SERIES} variant="poster" />
          </div>
        )}

        {/* PODCASTS */}
        {!searchQuery && activeSection === 'podcasts' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Podcasts</h1>
              <p className="text-white/60">Teologia, predicacion y discipulado</p>
            </div>
            <ContentRow title="Recomendados" items={PODCASTS} variant="wide" />
          </div>
        )}

        {/* ARTISTAS */}
        {!searchQuery && activeSection === 'artistas' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Artistas</h1>
              <p className="text-white/60">{artistas.length} artistas curados</p>
            </div>
            <div className="px-4 sm:px-6 md:px-12 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-12">
              {artistas.map(a => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/artista/${a.slug}`)}
                  className="group text-center"
                >
                  <div className="aspect-square rounded-full bg-[#1a1a1a] overflow-hidden mb-2 group-hover:ring-2 group-hover:ring-amber-400 transition">
                    {a.imagen ? (
                      <img src={a.imagen} alt={a.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-white/20 font-black">
                        {a.nombre[0]}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white line-clamp-1">{a.nombre}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FAVORITOS */}
        {!searchQuery && activeSection === 'favoritos' && (
          <div className="pt-8">
            <div className="px-4 sm:px-6 md:px-12 mb-6">
              <h1 className="text-3xl sm:text-4xl font-black mb-2">Mi Lista</h1>
              <p className="text-white/60">{favorites.size} elementos guardados</p>
            </div>
            {favoritesContent.length > 0 ? (
              <ContentRow
                title="Tu contenido favorito"
                items={favoritesContent.map(toContentItem)}
                onFavorite={toggleFavorite}
                isFavorite={isFavorite}
                variant="poster"
              />
            ) : (
              <div className="px-4 sm:px-6 md:px-12 py-20 text-center">
                <p className="text-white/40 text-lg">Aun no tienes favoritos</p>
                <p className="text-white/30 text-sm mt-2">Marca con el corazon lo que te guste para verlo aqui</p>
              </div>
            )}
          </div>
        )}

        <footer className="mt-16 py-12 px-4 sm:px-6 md:px-12 border-t border-white/5 text-center">
          <p className="text-white/40 text-sm">GospelPlay &bull; Directorio de contenido cristiano curado</p>
          <p className="text-white/20 text-xs mt-2">Todo el contenido dirige a sus plataformas originales</p>
        </footer>
      </main>
    </div>
  );
}
