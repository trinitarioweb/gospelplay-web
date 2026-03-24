'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Link } from 'lucide-react';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContentModal({ isOpen, onClose }: AddContentModalProps) {
  const [url, setUrl] = useState('');
  const [estado, setEstado] = useState<'idle' | 'analizando' | 'aprobado' | 'rechazado'>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [resultado, setResultado] = useState<any>(null);

  if (!isOpen) return null;

  const handleAnalizar = async () => {
    if (!url.trim()) return;

    setEstado('analizando');

    try {
      const res = await fetch('/api/clasificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      setResultado(data);
      setEstado(data.evaluacion?.aprobado ? 'aprobado' : 'rechazado');
    } catch {
      setEstado('idle');
    }
  };

  const resetear = () => {
    setUrl('');
    setEstado('idle');
    setResultado(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-500/20">
          <h2 className="font-black text-lg">Agregar Contenido</h2>
          <button onClick={() => { onClose(); resetear(); }} className="p-2 hover:bg-white/10 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {estado === 'idle' && (
            <>
              <p className="text-sm text-orange-300/70">
                Pega un link de Spotify o YouTube y nuestra IA teológica lo analizará automáticamente.
              </p>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-300/50" size={18} />
                <input
                  type="url"
                  placeholder="https://open.spotify.com/track/... o https://youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-orange-500/20 rounded-lg text-white placeholder-orange-300/40 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-500/20 transition text-sm"
                />
              </div>
              <button
                onClick={handleAnalizar}
                disabled={!url.trim()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold text-sm transition"
              >
                Analizar con IA Teológica
              </button>
            </>
          )}

          {estado === 'analizando' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin mx-auto mb-4 text-orange-500" size={48} />
              <p className="font-bold text-lg">Analizando contenido...</p>
              <p className="text-sm text-orange-300/60 mt-2">La IA está evaluando la calidad teológica</p>
              <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-sm text-orange-300/80">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Extrayendo metadata...
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-300/80">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Evaluando contenido cristocéntrico...
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-300/80">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  Clasificando género y categoría...
                </div>
              </div>
            </div>
          )}

          {estado === 'aprobado' && resultado && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
                <p className="font-bold text-lg text-green-400">¡Contenido Aprobado!</p>
                <p className="text-sm text-orange-300/60">Puntuación: ⭐ {resultado.evaluacion?.puntuacionTotal}/100</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="text-orange-400 font-bold">Tipo:</span> {resultado.clasificacion?.tipo}</p>
                <p><span className="text-orange-400 font-bold">Categoría:</span> {resultado.clasificacion?.categoria}</p>
                {resultado.clasificacion?.generoMusical && (
                  <p><span className="text-orange-400 font-bold">Género:</span> {resultado.clasificacion?.generoMusical}</p>
                )}
                <p><span className="text-orange-400 font-bold">Notas:</span> {resultado.evaluacion?.notas}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => { onClose(); resetear(); }} className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-sm transition">
                  ✓ Publicar
                </button>
                <button onClick={resetear} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition">
                  Agregar otro
                </button>
              </div>
            </div>
          )}

          {estado === 'rechazado' && resultado && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <XCircle className="mx-auto mb-3 text-red-400" size={48} />
                <p className="font-bold text-lg text-red-400">Contenido No Aprobado</p>
                <p className="text-sm text-orange-300/60">Puntuación: {resultado.evaluacion?.puntuacionTotal}/100 (mínimo: 70)</p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm">
                <p className="text-red-300">{resultado.evaluacion?.notas}</p>
              </div>

              <button onClick={resetear} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm transition">
                Intentar con otro link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
