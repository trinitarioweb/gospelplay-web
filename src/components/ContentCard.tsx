'use client';

import { Heart, Play, ExternalLink, Clock } from 'lucide-react';
import type { Contenido } from '@/types/content';

interface ContentCardProps {
  contenido: Contenido;
  onPlay: (contenido: Contenido) => void;
  onLike: (id: string) => void;
  isLiked: boolean;
  compact?: boolean;
}

const tipoEmoji: Record<string, string> = {
  musica: '🎵',
  predicacion: '🎤',
  estudio_biblico: '📖',
  podcast: '🎙️',
  testimonio: '🙌',
  oracion: '🙏',
};

const plataformaColor: Record<string, string> = {
  spotify: 'bg-green-600',
  youtube: 'bg-red-600',
  apple_music: 'bg-pink-600',
};

const categoriaLabel: Record<string, string> = {
  adoracion: 'Adoración',
  alabanza: 'Alabanza',
  evangelistico: 'Evangelístico',
  motivacional: 'Motivacional',
  doctrina: 'Doctrina',
  profetico: 'Profético',
  intercesion: 'Intercesión',
  infantil: 'Infantil',
  devocional: 'Devocional',
};

const generoLabel: Record<string, string> = {
  worship: 'Worship',
  pop_cristiano: 'Pop Cristiano',
  rock_cristiano: 'Rock Cristiano',
  balada_cristiana: 'Balada',
  reggaeton_cristiano: 'Reggaetón',
  salsa_cristiana: 'Salsa',
  bachata_cristiana: 'Bachata',
  regional: 'Regional',
  hip_hop_cristiano: 'Hip-Hop',
  electronica_cristiana: 'Electrónica',
  himnos_clasicos: 'Himnos',
  coros_congregacionales: 'Congregacional',
  a_cappella: 'A Cappella',
  instrumental: 'Instrumental',
  soaking: 'Soaking',
};

export default function ContentCard({ contenido, onPlay, onLike, isLiked, compact = false }: ContentCardProps) {
  if (compact) {
    return (
      <div className="p-4 bg-white/5 border border-orange-500/20 rounded-xl hover:bg-white/10 transition flex items-center gap-4 group">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500/30 to-orange-600/20 flex items-center justify-center text-2xl flex-shrink-0">
          {tipoEmoji[contenido.clasificacion.tipo]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{contenido.titulo}</p>
          <p className="text-xs text-orange-300/70 truncate">{contenido.artista}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-300">
              {categoriaLabel[contenido.clasificacion.categoria]}
            </span>
            <span className="text-xs text-orange-300/50 flex items-center gap-1">
              <Clock size={10} /> {contenido.duracion}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
          ⭐ {contenido.evaluacion.puntuacionTotal}
        </div>
        <button onClick={() => onLike(contenido.id)} className="p-2 hover:bg-white/10 rounded-full transition">
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-red-500' : 'text-gray-400'} />
        </button>
        <button onClick={() => onPlay(contenido)} className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 transition">
          <Play size={14} fill="white" className="text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/5 border border-orange-500/20 rounded-xl hover:bg-white/10 transition group">
      {/* Header con tipo y plataforma */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tipoEmoji[contenido.clasificacion.tipo]}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold text-white ${plataformaColor[contenido.plataforma]}`}>
            {contenido.plataforma === 'spotify' ? 'Spotify' : contenido.plataforma === 'youtube' ? 'YouTube' : 'Apple'}
          </span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-xs font-bold text-orange-300">
          ⭐ {contenido.evaluacion.puntuacionTotal}/100
        </div>
      </div>

      {/* Título y artista */}
      <h3 className="font-bold text-sm line-clamp-2 mb-1">{contenido.titulo}</h3>
      <p className="text-xs text-orange-300/60 mb-3">{contenido.artista}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded text-orange-300">
          {categoriaLabel[contenido.clasificacion.categoria]}
        </span>
        {contenido.clasificacion.generoMusical && (
          <span className="text-xs px-2 py-0.5 bg-white/10 border border-white/20 rounded text-gray-300">
            {generoLabel[contenido.clasificacion.generoMusical]}
          </span>
        )}
        {contenido.clasificacion.esCongreacional && (
          <span className="text-xs px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300">
            Congregacional
          </span>
        )}
        {contenido.clasificacion.tieneMensaje && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300">
            Con mensaje
          </span>
        )}
      </div>

      {/* Versículos */}
      {contenido.contenidoBiblico.versiculosClave.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {contenido.contenidoBiblico.versiculosClave.slice(0, 3).map((v, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded text-amber-300">
                📖 {v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Duración y stats */}
      <div className="flex items-center gap-3 text-xs text-orange-300/50 mb-3">
        <span className="flex items-center gap-1"><Clock size={12} /> {contenido.duracion}</span>
        <span>❤️ {contenido.likes}</span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPlay(contenido)}
          className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2"
        >
          <Play size={14} fill="white" /> Escuchar
        </button>
        <button onClick={() => onLike(contenido.id)} className={`p-2 rounded-lg transition ${isLiked ? 'bg-red-500/20 text-red-500' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <a href={contenido.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400">
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
