'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, Camera, Star, Download } from 'lucide-react';

const JUGADORES = [
  { id: 'james', nombre: 'James Rodríguez', numero: '10', posicion: 'Mediocampista' },
  { id: 'diaz', nombre: 'Luis Díaz', numero: '7', posicion: 'Extremo' },
  { id: 'falcao', nombre: 'Radamel Falcao', numero: '9', posicion: 'Delantero' },
  { id: 'cuadrado', nombre: 'Juan Cuadrado', numero: '11', posicion: 'Mediocampista' },
  { id: 'ospina', nombre: 'David Ospina', numero: '1', posicion: 'Portero' },
  { id: 'arias', nombre: 'Santiago Arias', numero: '4', posicion: 'Lateral' },
];

type Estado = 'idle' | 'uploading' | 'generating' | 'completed' | 'error';

export default function GeneradorPixar() {
  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [jugadorId, setJugadorId] = useState('james');
  const [estado, setEstado] = useState<Estado>('idle');
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progreso, setProgreso] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setPreview(URL.createObjectURL(file));
    setResultado(null);
    setError(null);
  }, []);

  const generar = useCallback(async () => {
    if (!foto) return;

    setEstado('uploading');
    setError(null);
    setProgreso('Subiendo tu foto...');

    try {
      // 1. Enviar foto + jugador al API
      const formData = new FormData();
      formData.append('foto', foto);
      formData.append('jugador', jugadorId);

      const res = await fetch('/api/generar-pixar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al iniciar generación');
      }

      const { jobId } = await res.json();

      // 2. Polling del estado
      setEstado('generating');
      setProgreso('Generando tu imagen Pixar con IA...');

      const maxIntentos = 90; // 3 min máximo
      for (let i = 0; i < maxIntentos; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const statusRes = await fetch(`/api/generar-pixar?id=${jobId}`);
        const statusData = await statusRes.json();

        if (statusData.status === 'completed' && statusData.image) {
          setResultado(statusData.image);
          setEstado('completed');
          setProgreso('');
          return;
        }

        if (statusData.status === 'error') {
          throw new Error('Error en la generación de imagen');
        }

        // Actualizar mensaje de progreso
        const mensajes = [
          'Analizando tu rostro...',
          'Creando escena Pixar...',
          'Aplicando estilo 3D...',
          'Preservando tu identidad facial...',
          'Renderizando imagen final...',
          'Casi listo...',
        ];
        setProgreso(mensajes[Math.min(i, mensajes.length - 1)]);
      }

      throw new Error('La generación tardó demasiado. Intenta de nuevo.');
    } catch (err) {
      setEstado('error');
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProgreso('');
    }
  }, [foto, jugadorId]);

  const jugadorSeleccionado = JUGADORES.find(j => j.id === jugadorId)!;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Foto Pixar con la Selección Colombia
        </h1>
        <p className="text-gray-500">
          Sube tu foto y genera una imagen estilo Pixar posando con tu jugador favorito
        </p>
      </div>

      {/* Paso 1: Elegir jugador */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">
          1. Elige tu jugador
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {JUGADORES.map(j => (
            <button
              key={j.id}
              onClick={() => setJugadorId(j.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                jugadorId === j.id
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-sm">{j.nombre}</div>
              <div className="text-xs text-gray-500">
                #{j.numero} · {j.posicion}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: Subir foto */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">
          2. Sube tu foto
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            preview
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
          }`}
        >
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={preview}
                alt="Tu foto"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <span className="text-sm text-green-600 font-medium">
                Foto cargada. Click para cambiar.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Camera className="w-10 h-10" />
              <span className="font-medium">Click para subir tu foto</span>
              <span className="text-xs">Una selfie clara funciona mejor</span>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFoto}
          className="hidden"
        />
      </div>

      {/* Paso 3: Generar */}
      <button
        onClick={generar}
        disabled={!foto || estado === 'uploading' || estado === 'generating'}
        className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
          !foto || estado === 'uploading' || estado === 'generating'
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {estado === 'uploading' || estado === 'generating' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {progreso}
          </>
        ) : (
          <>
            <Star className="w-5 h-5" />
            Generar foto Pixar con {jugadorSeleccionado.nombre}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-8">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={resultado}
              alt={`Tu foto Pixar con ${jugadorSeleccionado.nombre}`}
              className="w-full"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <a
              href={resultado}
              download={`pixar-con-${jugadorId}.png`}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium text-center flex items-center justify-center gap-2 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>
            <button
              onClick={() => {
                setResultado(null);
                setEstado('idle');
              }}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium text-center hover:bg-gray-50"
            >
              Generar otra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
