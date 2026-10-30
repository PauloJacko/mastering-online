'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState('punchy');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

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
          Sube tu pista, elige el estilo y descárgala lista.
        </p>

        <form onSubmit={handleMasterizar} className="space-y-6">
          {/* Selector de archivos */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-indigo-500 transition cursor-pointer bg-gray-950/50">
            <input
              type="file"
              accept=".wav, .mp3, .WAV, .MP3"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer text-center">
              <span className="block text-sm font-medium text-gray-300">
                {file ? file.name : 'Haz clic para seleccionar o arrastra tu audio'}
              </span>
              <span className="block text-xs text-gray-500 mt-1">Formatos WAV o MP3</span>
            </label>
          </div>

          {/* Selector de Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preset de Masterización
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="punchy">Punchy (Ideal para Pop / Electrónica - Graves y brillo)</option>
              <option value="warm">Warm (Cálido y controlado - Rock / Acústica)</option>
              <option value="clean">Clean (Solo Limitador - Transparente)</option>
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
            {loading ? 'Masterizando audio (espera unos segundos)...' : '✨ Masterizar Pista'}
          </button>
        </form>

        {/* Mensajes de error */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800 text-red-300 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Enlace de descarga */}
        {downloadUrl && (
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl text-center animate-fade-in">
            <p className="text-sm text-emerald-300 mb-3 font-medium">¡Tu canción está lista!</p>
            <a
              href={downloadUrl}
              download="cancion_masterizada.wav"
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