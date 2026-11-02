'use client';

import { useState, useRef, useEffect } from 'react';
import Wavesurfer from 'wavesurfer.js';

const presetsPorInstrumento: Record<string, { id: string; name: string }[]> = {
  mezcla_general: [
    { id: 'commercial_loud', name: 'Commercial Loud (Mayor volumen RMS, brillante)' },
    { id: 'warm_analog', name: 'Warm Analog (Cálido con saturación de cinta sutil)' },
    { id: 'dinamico_limpio', name: 'Dinámico & Limpio (Respeta la dinámica original)' },
    { id: 'standard', name: 'Standard (Equilibrio general)' }
  ],
  voz: [
    { id: 'moderna', name: 'Moderna (Brillante, aire y presencia superior)' },
    { id: 'calida', name: 'Cálida (Íntima, con cuerpo en medios-bajos)' },
    { id: 'radio', name: 'Efecto Radio / Podcast (Corte de graves y presencia aguda)' },
    { id: 'intima', name: 'Íntima & Suave (Compresión delicada)' },
    { id: 'limpia', name: 'Limpia (Sin coloración excesiva)' }
  ],
  bateria: [
    { id: 'punchy', name: 'Punchy (Golpe fuerte, agudos definidos y graves firmes)' },
    { id: 'crunchy', name: 'Crunchy (Saturación agresiva para rock/metal)' },
    { id: 'gigante', name: 'Gigante / Arena (Graves profundos y brillo masivo)' },
    { id: 'natural', name: 'Dinámica Natural (Control de picos sutil)' }
  ],
  bajo: [
    { id: 'profundo', name: 'Profundo (Subgraves sólidos, ideal para electrónica/hip-hop)' },
    { id: 'definido', name: 'Definido (Presencia en medios para destacar en mezcla)' },
    { id: 'saturado', name: 'Saturado / Rock (Grosor y armónicos marcados)' },
    { id: 'standard', name: 'Standard (Controlado y uniforme)' }
  ],
  guitarra: [
    { id: 'brillante', name: 'Brillante (Corte y brillo en agudos)' },
    { id: 'calida', name: 'Cuerpo Cálido (Medios ricos y redondos)' },
    { id: 'rock_distorsion', name: 'Rock / Lead (Presencia y saturación brillante)' },
    { id: 'standard', name: 'Standard (Transparente)' }
  ],
  teclado: [
    { id: 'espacial', name: 'Espacial / Synth (Aire y brillo envolvente)' },
    { id: 'gordo', name: 'Gordo / Pad (Realce en frecuencias graves-medias)' },
    { id: 'standard', name: 'Standard (Espacio y volumen controlado)' }
  ]
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [instrumento, setInstrumento] = useState('mezcla_general');
  const [preset, setPreset] = useState('commercial_loud');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  // URLs de audio para reproducción local
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<'original' | 'mastered'>('mastered');
  const [isPlaying, setIsPlaying] = useState(false);

  // Referencias para Wavesurfer
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<Wavesurfer | null>(null);

  const handleInstrumentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoInstrumento = e.target.value;
    setInstrumento(nuevoInstrumento);
    setPreset(presetsPorInstrumento[nuevoInstrumento][0].id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDownloadUrl(null);
      setError('');
      
      // Crear URL local para reproducir el original
      const urlObj = URL.createObjectURL(selectedFile);
      setOriginalUrl(urlObj);
      setMasteredUrl(null);
      setActiveTrack('original');
    }
  };

  // Inicializar o actualizar Wavesurfer cuando cambia la pista activa (Original o Master)
  useEffect(() => {
    const currentUrl = activeTrack === 'mastered' ? masteredUrl : originalUrl;
    if (!currentUrl || !waveformRef.current) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const wavesurfer = Wavesurfer.create({
      container: waveformRef.current,
      waveColor: activeTrack === 'mastered' ? '#10b981' : '#6366f1',
      progressColor: activeTrack === 'mastered' ? '#047857' : '#4f46e5',
      cursorColor: '#ffffff',
      barWidth: 3,
      barRadius: 3,
      height: 80,
      normalize: true,
    });

    wavesurfer.load(currentUrl);
    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [originalUrl, masteredUrl, activeTrack]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleMasterizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona un archivo WAV o MP3.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instrumento', instrumento);
    formData.append('preset', preset);

    try {
      const response = await fetch('http://127.0.0.1:8000/masterizar/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al procesar el audio en el servidor.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setMasteredUrl(url);
      setDownloadUrl(url);
      setActiveTrack('mastered'); // Cambiar automáticamente al masterizado al terminar
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-wide text-indigo-400">
          🎛️ Masterizador Pro Personal
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Sube tu pista, procesa y compara el resultado con un solo clic.
        </p>

        <form onSubmit={handleMasterizar} className="space-y-5">
          {/* Selector de archivos */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-5 hover:border-indigo-500 transition cursor-pointer bg-gray-950/50">
            <input
              type="file"
              accept=".wav, .mp3, .WAV, .MP3"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer text-center">
              <span className="block text-sm font-medium text-gray-300">
                {file ? file.name : 'Haz clic para seleccionar o arrastra tu pista'}
              </span>
              <span className="block text-xs text-gray-500 mt-1">WAV o MP3</span>
            </label>
          </div>

          {/* Selector de Instrumento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Pista / Instrumento
            </label>
            <select
              value={instrumento}
              onChange={handleInstrumentoChange}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="mezcla_general">🎵 Canción Completa (Master Global)</option>
              <option value="voz">🎤 Voz</option>
              <option value="bateria">🥁 Batería</option>
              <option value="bajo">🎸 Bajo</option>
              <option value="guitarra">🎸 Guitarra</option>
              <option value="teclado">🎹 Teclado / Synth</option>
            </select>
          </div>

          {/* Selector de Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preset Específico
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {presetsPorInstrumento[instrumento].map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de acción */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-medium text-white transition shadow-lg ${
              loading
                ? 'bg-indigo-800 opacity-50 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
          >
            {loading ? 'Procesando cadena de efectos...' : '✨ Procesar y Masterizar'}
          </button>
        </form>

        {/* --- VISUALIZADOR Y COMPARACIÓN A/B --- */}
        {originalUrl && (
          <div className="mt-8 p-5 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Visualizador de Audio
              </span>
              {masteredUrl && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTrack('original')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                      activeTrack === 'original'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrack('mastered')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                      activeTrack === 'mastered'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Masterizado ✨
                  </button>
                </div>
              )}
            </div>

            {/* Contenedor de la forma de onda */}
            <div ref={waveformRef} className="w-full mb-4" />

            {/* Botón de Play / Pause */}
            <button
              type="button"
              onClick={togglePlayPause}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition flex items-center justify-center space-x-2"
            >
              <span>{isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'}</span>
              <span className="text-xs text-gray-400">
                ({activeTrack === 'original' ? 'Escuchando Original' : 'Escuchando Masterizado'})
              </span>
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Enlace de descarga */}
        {downloadUrl && (
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center animate-fade-in">
            <p className="text-sm text-emerald-300 mb-3 font-medium">¡Pista procesada con éxito!</p>
            <a
              href={downloadUrl}
              download={`master_${instrumento}.wav`}
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg text-sm transition shadow-lg shadow-emerald-600/30"
            >
              📥 Descargar WAV Masterizado
            </a>
          </div>
        )}
      </div>
    </main>
  );
}