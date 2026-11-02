'use client';

import { useState, useRef, useEffect } from 'react';
import Wavesurfer from 'wavesurfer.js';

// Mapa de presets completo por cada instrumento (Sincronizado con el Backend)
const presetsPorInstrumento: Record<string, { id: string; name: string }[]> = {
  mezcla_general: [
    { id: 'commercial_loud', name: 'Commercial Loud (Mayor volumen RMS, brillante)' },
    { id: 'warm_analog', name: 'Warm Analog (Cálido con saturación sutil)' },
    { id: 'dinamico_limpio', name: 'Dinámico & Limpio (Respeta la dinámica original)' },
    { id: 'standard', name: 'Standard (Equilibrio general)' }
  ],
  voz: [
    { id: 'moderna', name: 'Moderna (Brillante, aire y presencia superior)' },
    { id: 'calida', name: 'Cálida (Íntima, con cuerpo en medios-bajos)' },
    { id: 'radio', name: 'Efecto Radio / Podcast (Corte de graves y presencia)' },
    { id: 'intima', name: 'Íntima & Suave (Compresión delicada)' },
    { id: 'limpia', name: 'Limpia (Sin coloración excesiva)' }
  ],
  bateria: [
    { id: 'punchy', name: 'Punchy (Golpe fuerte, agudos definidos y graves firmes)' },
    { id: 'crunchy', name: 'Crunchy (Saturación y pegada)' },
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

  // Estados del Rack de Efectos Modulares Independientes
  const [reverbActivo, setReverbActivo] = useState(false);
  const [reverbTipo, setReverbTipo] = useState('plate');

  const [delayActivo, setDelayActivo] = useState(false);
  const [delayTiempo, setDelayTiempo] = useState('0.3');

  const [compActivo, setCompActivo] = useState(false);

  const [saturacionActivo, setSaturacionActivo] = useState(false);
  const [saturacionDrive, setSaturacionDrive] = useState('2.5');

  // Reproducción y Visualizador de Onda
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<'original' | 'mastered'>('mastered');
  const [isPlaying, setIsPlaying] = useState(false);

  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<Wavesurfer | null>(null);

  // Al cambiar de instrumento, selecciona el primer preset de ese grupo
  const handleInstrumentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoInstrumento = e.target.value;
    setInstrumento(nuevoInstrumento);
    if (presetsPorInstrumento[nuevoInstrumento]) {
      setPreset(presetsPorInstrumento[nuevoInstrumento][0].id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDownloadUrl(null);
      setError('');
      
      const urlObj = URL.createObjectURL(selectedFile);
      setOriginalUrl(urlObj);
      setMasteredUrl(null);
      setActiveTrack('original');
    }
  };

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
      height: 70,
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

    const efectosJson = JSON.stringify({
      reverb_activo: reverbActivo,
      reverb_tipo: reverbTipo,
      delay_activo: delayActivo,
      delay_tiempo: delayTiempo,
      comp_activo: compActivo,
      saturacion_activo: saturacionActivo,
      saturacion_drive: saturacionDrive
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instrumento', instrumento);
    formData.append('preset', preset);
    formData.append('efectos_json', efectosJson);

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
      setActiveTrack('mastered');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-wide text-indigo-400">
          🎛️ Masterizador Personal
        </h1>


        <form onSubmit={handleMasterizar} className="space-y-5">
          {/* Selector de archivos */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-4 hover:border-indigo-500 transition cursor-pointer bg-gray-950/50">
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
              <span className="block text-xs text-gray-500 mt-1">Formatos WAV o MP3</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Instrumento */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Instrumento / Pista</label>
              <select
                value={instrumento}
                onChange={handleInstrumentoChange}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="mezcla_general">🎵 Canción Completa (Master)</option>
                <option value="voz">🎤 Voz</option>
                <option value="bateria">🥁 Batería</option>
                <option value="bajo">🎸 Bajo</option>
                <option value="guitarra">🎸 Guitarra</option>
                <option value="teclado">🎹 Teclado / Synth</option>
              </select>
            </div>

            {/* Preset */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Preset Base</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                {presetsPorInstrumento[instrumento]?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* --- RACK DE EFECTOS INDEPENDIENTES --- */}
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/40 space-y-4">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              🎚️ Rack de Efectos Modulares
            </h2>

            {/* Reverb */}
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={reverbActivo}
                  onChange={(e) => setReverbActivo(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-200">Reverb (Espacialidad)</span>
              </div>
              {reverbActivo && (
                <select
                  value={reverbTipo}
                  onChange={(e) => setReverbTipo(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300"
                >
                  <option value="room">Room (Habitación)</option>
                  <option value="plate">Plate (Clásica)</option>
                  <option value="hall">Hall (Catedral)</option>
                </select>
              )}
            </div>

            {/* Delay */}
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={delayActivo}
                  onChange={(e) => setDelayActivo(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-200">Delay (Eco)</span>
              </div>
              {delayActivo && (
                <select
                  value={delayTiempo}
                  onChange={(e) => setDelayTiempo(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-300"
                >
                  <option value="0.2">Corto (200ms)</option>
                  <option value="0.3">Medio (300ms)</option>
                  <option value="0.5">Largo (500ms)</option>
                </select>
              )}
            </div>

            {/* Compresión Extra */}
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={compActivo}
                  onChange={(e) => setCompActivo(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-200">Compresión Extra</span>
              </div>
            </div>

            {/* Saturación */}
            <div className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-800">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={saturacionActivo}
                  onChange={(e) => setSaturacionActivo(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-200">Saturación Analógica</span>
              </div>
              {saturacionActivo && (
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Drive:</span>
                  <input
                    type="range"
                    min="1.0"
                    max="6.0"
                    step="0.5"
                    value={saturacionDrive}
                    onChange={(e) => setSaturacionDrive(e.target.value)}
                    className="w-20 accent-indigo-600"
                  />
                </div>
              )}
            </div>
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
            {loading ? 'Procesando audio...' : '✨ Procesar y Masterizar'}
          </button>
        </form>

        {/* Visualizador y Comparación A/B */}
        {originalUrl && (
          <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Visualizador de Audio (A/B)
              </span>
              {masteredUrl && (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTrack('original')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                      activeTrack === 'original' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTrack('mastered')}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
                      activeTrack === 'mastered' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Masterizado ✨
                  </button>
                </div>
              )}
            </div>

            <div ref={waveformRef} className="w-full mb-3" />

            <button
              type="button"
              onClick={togglePlayPause}
              className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition"
            >
              {isPlaying ? '⏸️ Pausar' : '▶️ Reproducir'} ({activeTrack === 'original' ? 'Original' : 'Masterizado'})
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {downloadUrl && (
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center">
            <p className="text-sm text-emerald-300 mb-2 font-medium">¡Pista procesada con éxito!</p>
            <a
              href={downloadUrl}
              download={`master_${instrumento}.wav`}
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg text-sm transition shadow-lg"
            >
              📥 Descargar WAV Masterizado
            </a>
          </div>
        )}
      </div>
    </main>
  );
}