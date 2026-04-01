'use client';

import { useState, useEffect, use } from 'react';
import { ArrowLeft, CheckCircle, Heart, Share2, Loader2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { obtenerArtistaPorSlug, obtenerArtistasRelacionados } from '@/lib/database';
import { useFavorites } from '@/context/FavoritesContext';
import type { Artista, Contenido } from '@/types/content';
import ArtistaCard from '@/components/ArtistaCard';
import ContentCard from '@/components/ContentCard';

const generosLabels: Record<string, string> = {
  worship: 'Worship',
  pop_cristiano: 'Pop Cristiano',
  rock_cristiano: 'Rock Cristiano',
  balada_cristiana: 'Balada',
  reggaeton_cristiano: 'Reggaeton Cristiano',
  salsa_cristiana: 'Salsa Cristiana',
  hip_hop_cristiano: 'Hip Hop Cristiano',
  himnos_clasicos: 'Himnos',
  soaking: 'Soaking',
};

const tipoLabels: Record<string, string> = {
  artista: 'Artista',
  banda: 'Banda',
  pastor: 'Pastor',
  ministerio: 'Ministerio',
  predicador: 'Predicador',
};

export default function ArtistaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [artista, setArtista] = useState<Artista | null>(null);
  const [relacionados, setRelacionados] = useState<Artista[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{ cancionesAgregadas: number } | null>(null);

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const a = await obtenerArtistaPorSlug(slug);
      setArtista(a);

      if (a) {
        // Enrich artist in background (add more songs + similar artists)
        setEnriching(true);
        fetch(`/api/artista/${slug}/enriquecer`)
          .then(r => r.json())
          .then(async (data) => {
            setEnrichResult(data);
            setEnriching(false);

            if (data.cancionesAgregadas > 0) {
              const refreshed = await obtenerArtistaPorSlug(slug);
              if (refreshed) setArtista(refreshed);
            }

            if (data.similaresEnCatalogo > 0) {
              const refreshedArtist = await obtenerArtistaPorSlug(slug);
              if (refreshedArtist?.artistas_relacionados?.length) {
                const rel = await obtenerArtistasRelacionados(refreshedArtist.artistas_relacionados);
                setRelacionados(rel);
              }
            }
          })
          .catch(() => setEnriching(false));

        if (a.artistas_relacionados?.length) {
          const rel = await obtenerArtistasRelacionados(a.artistas_relacionados);
          setRelacionados(rel);
        }
      }

      setLoading(false);
    }
    cargar();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  if (!artista) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white gap-4">
        <p className="text-xl">Artista no encontrado</p>
        <button onClick={() => router.push('/')} className="text-amber-400 hover:underline">
          Volver al inicio
        </button>
      </div>
    );
  }

  const canciones = artista.canciones || [];
  const totalCanciones = canciones.length;

  // Group songs by platform for "where to listen" links
  const spotifySongs = canciones.filter(c => c.plataforma === 'spotify');
  const youtubeSongs = canciones.filter(c => c.plataforma === 'youtube');

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header with gradient */}
      <div className="relative">
        <div className="absolute inset-0 h-[350px] bg-gradient-to-b from-amber-900/40 to-[#121212]" />

        <button onClick={() => router.push('/')} className="relative z-10 p-4">
          <ArrowLeft size={24} />
        </button>

        {/* Artist info */}
        <div className="relative z-10 px-6 pb-6 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="w-[180px] h-[180px] rounded-full bg-[#282828] overflow-hidden shadow-2xl flex-shrink-0">
            {artista.imagen ? (
              <img src={artista.imagen} alt={artista.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-[#6a6a6a] font-bold">
                {artista.nombre[0]}
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              {artista.verificado && (
                <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Verificado
                </span>
              )}
              <span className="text-xs text-[#b3b3b3]">{tipoLabels[artista.tipo] || artista.tipo}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-2">{artista.nombre}</h1>
            <div className="flex items-center gap-3 text-sm text-[#b3b3b3] justify-center sm:justify-start flex-wrap">
              {artista.pais && <span>{artista.pais}</span>}
              {artista.generos.map(g => (
                <span key={g} className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                  {generosLabels[g] || g}
                </span>
              ))}
              <span>{artista.seguidores.toLocaleString()} seguidores</span>
              <span>{totalCanciones} canciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - where to listen */}
      <div className="px-6 py-4 flex items-center gap-3 flex-wrap">
        {youtubeSongs.length > 0 && (
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(artista.nombre + ' official')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 h-10 bg-red-600 rounded-full text-white text-sm font-bold hover:bg-red-500 transition"
          >
            <ExternalLink size={16} /> YouTube
          </a>
        )}
        {spotifySongs.length > 0 && (
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(artista.nombre)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 h-10 bg-green-600 rounded-full text-white text-sm font-bold hover:bg-green-500 transition"
          >
            <ExternalLink size={16} /> Spotify
          </a>
        )}
        <button className="w-10 h-10 border border-[#6a6a6a] rounded-full flex items-center justify-center hover:border-white transition">
          <Heart size={18} />
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: artista.nombre, text: `Mira ${artista.nombre} en GospelPlay`, url: window.location.href });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="w-10 h-10 border border-[#6a6a6a] rounded-full flex items-center justify-center hover:border-white transition"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Enriching indicator */}
      {enriching && (
        <div className="px-6 py-2 flex items-center gap-2 text-sm text-amber-400">
          <Loader2 size={14} className="animate-spin" />
          Buscando mas canciones...
        </div>
      )}
      {enrichResult && enrichResult.cancionesAgregadas > 0 && !enriching && (
        <div className="px-6 py-2 text-sm text-green-400">
          +{enrichResult.cancionesAgregadas} canciones nuevas encontradas
        </div>
      )}

      {/* Bio */}
      {artista.bio && (
        <div className="px-6 py-4">
          <p className="text-sm text-[#b3b3b3] leading-relaxed max-w-2xl">{artista.bio}</p>
        </div>
      )}

      {/* Popular songs */}
      {canciones.length > 0 && (
        <div className="px-6 py-4">
          <h2 className="text-xl font-bold mb-4">Popular</h2>
          <div className="space-y-1">
            {canciones.slice(0, 20).map((cancion: Contenido, index: number) => (
              <ContentCard
                key={cancion.id}
                contenido={cancion}
                compact
                index={index + 1}
                onLike={toggleFavorite}
                isLiked={isFavorite(cancion.id)}
              />
            ))}
          </div>

          {canciones.length > 20 && (
            <p className="mt-4 text-sm text-[#b3b3b3] font-semibold">
              y {canciones.length - 20} canciones mas
            </p>
          )}
        </div>
      )}

      {/* Related artists */}
      {relacionados.length > 0 && (
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold mb-4">Artistas Similares</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
            {relacionados.map(rel => (
              <ArtistaCard
                key={rel.id}
                artista={rel}
                onClick={() => router.push(`/artista/${rel.slug}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="h-12" />
    </div>
  );
}
