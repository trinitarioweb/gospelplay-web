'use client';

import { CheckCircle } from 'lucide-react';
import type { Artista } from '@/types/content';

const generosLabels: Record<string, string> = {
  worship: 'Worship',
  pop_cristiano: 'Pop Cristiano',
  rock_cristiano: 'Rock Cristiano',
  balada_cristiana: 'Balada',
  reggaeton_cristiano: 'Reggaetón Cristiano',
  salsa_cristiana: 'Salsa Cristiana',
  bachata_cristiana: 'Bachata Cristiana',
  hip_hop_cristiano: 'Hip Hop Cristiano',
  electronica_cristiana: 'Electrónica',
  himnos_clasicos: 'Himnos',
  soaking: 'Soaking',
  instrumental: 'Instrumental',
};

interface ArtistaCardProps {
  artista: Artista;
  onClick?: () => void;
  compact?: boolean;
}

export default function ArtistaCard({ artista, onClick, compact }: ArtistaCardProps) {
  const generoLabel = artista.generos[0] ? generosLabels[artista.generos[0]] || artista.generos[0] : '';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition w-full text-left"
      >
        <div className="w-12 h-12 rounded-full bg-[#282828] overflow-hidden flex-shrink-0">
          {artista.imagen ? (
            <img src={artista.imagen} alt={artista.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-[#6a6a6a]">
              {artista.nombre[0]}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate flex items-center gap-1">
            {artista.nombre}
            {artista.verificado && <CheckCircle size={12} className="text-amber-400 flex-shrink-0" />}
          </p>
          <p className="text-xs text-[#b3b3b3] truncate">
            {generoLabel} {artista.pais ? `· ${artista.pais}` : ''}
          </p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition group w-[140px] flex-shrink-0"
    >
      <div className="w-[120px] h-[120px] rounded-full bg-[#282828] overflow-hidden shadow-lg group-hover:shadow-xl transition">
        {artista.imagen ? (
          <img src={artista.imagen} alt={artista.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[#6a6a6a] font-bold">
            {artista.nombre[0]}
          </div>
        )}
      </div>
      <div className="text-center w-full">
        <p className="text-sm font-semibold text-white truncate flex items-center justify-center gap-1">
          {artista.nombre}
          {artista.verificado && <CheckCircle size={12} className="text-amber-400" />}
        </p>
        <p className="text-xs text-[#b3b3b3] truncate">{generoLabel}</p>
      </div>
    </button>
  );
}
