'use client';

import { useState } from 'react';

const presetsPorInstrumento: Record<string, { id: string; name: string }[]> = {
  mezcla_general: [
    { id: 'commercial_loud', name: 'Commercial Loud (Mayor volumen RMS, brillante)' },
    { id: 'warm_analog', name: 'Warm Analog (Cálido con saturación de cinta sutil)' },
    { id: 'dinamico_limpio', name: 'Dinámico & Limpio (Respeta la dinámica original)' },
    { id: 'standard', name: 'Standard (Equilibrio general equilibrado)' }
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

  const handleInstrumentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoInstrumento = e.target.value;
    setInstrumento(nuevoInstrumento);
    const primerPreset = presetsPorInstrumento[nuevoInstrumento][0].id;
    setPreset(primerPreset);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDownloadUrl(null);
      setError('');
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
    setDownloadUrl(null);

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
      setDownloadUrl(url);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-wide text-indigo-400">
          🎛️ Masterizador Personal
        </h1>
        <p className="text-sm text-gray-400 text-center mb-6">
          Elige tu instrumento y explora múltiples perfiles profesionales.
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

          {/* Selector Dinámico de Presets Ampliados */}
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

        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {downloadUrl && (
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center animate-fade-in">
            <p className="text-sm text-emerald-300 mb-3 font-medium">¡Pista procesada con éxito!</p>
            <a
              href={downloadUrl}
              download={`master_${instrumento}.wav`}
              className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-6 rounded-lg text-sm transition shadow-lg shadow-emerald-600/30"
            >
              📥 Descargar WAV Optimizado
            </a>
          </div>
        )}
      </div>
    </main>
  );
}