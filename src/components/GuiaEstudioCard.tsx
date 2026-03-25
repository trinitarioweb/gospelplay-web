'use client';

import { BookOpen, Play, ChevronRight } from 'lucide-react';
import type { GuiaEstudio, Contenido } from '@/types/content';

interface GuiaEstudioCardProps {
  guia: GuiaEstudio;
  onPlay: (contenido: Contenido) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function GuiaEstudioCard({ guia, onPlay, expanded = false, onToggle }: GuiaEstudioCardProps) {
  return (
    <div className="bg-[#181818] rounded-lg overflow-hidden hover:bg-[#1f1f1f] transition-colors">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-4 hover:bg-[#282828] transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-md bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-400 font-semibold mb-1">{guia.pasajePrincipal}</p>
          <h3 className="font-bold text-base text-white leading-tight">{guia.titulo}</h3>
          <p className="text-sm text-[#b3b3b3] mt-1 line-clamp-2">{guia.contexto}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {guia.versiculosClave.slice(0, 4).map((v, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 bg-amber-500/15 rounded text-amber-400 font-medium">
                {v}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight size={20} className={`text-[#6a6a6a] transition-transform flex-shrink-0 mt-1 ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5">
          {/* Context */}
          <div className="p-4 bg-white/[0.02]">
            <p className="text-sm text-[#b3b3b3] leading-relaxed">{guia.contexto}</p>
          </div>

          {/* Study path */}
          <div className="p-4">
            <h4 className="font-semibold text-sm text-amber-400 mb-3">Ruta de Estudio</h4>
            <div className="space-y-1">
              {guia.pasos.map((paso) => (
                <div key={paso.orden} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-[#282828] transition-colors group">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0">
                    {paso.orden}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#6a6a6a] mb-0.5">{paso.titulo}</p>
                    <p className="font-medium text-sm text-white truncate">{paso.contenido.titulo}</p>
                    <p className="text-xs text-[#b3b3b3] truncate">{paso.contenido.artista}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    paso.contenido.evaluacion.puntuacionTotal >= 85
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {paso.contenido.evaluacion.puntuacionTotal}
                  </span>
                  <button
                    onClick={() => onPlay(paso.contenido)}
                    className="p-2 rounded-full bg-amber-500 hover:bg-amber-400 hover:scale-105 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Play size={12} fill="black" className="text-black ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Related */}
          <div className="px-4 pb-4">
            <h4 className="font-semibold text-sm text-[#b3b3b3] mb-2">Temas Relacionados</h4>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {guia.temasRelacionados.map((tema, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-[#282828] rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#3a3a3a] transition-colors cursor-pointer">
                  {tema}
                </span>
              ))}
            </div>

            <h4 className="font-semibold text-sm text-[#b3b3b3] mb-2">Pasajes Conectados</h4>
            <div className="flex flex-wrap gap-1.5">
              {guia.pasajesConectados.map((pasaje, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-amber-500/10 rounded-full text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer">
                  {pasaje}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
