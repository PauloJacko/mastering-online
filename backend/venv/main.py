from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pedalboard import Pedalboard, Compressor, Limiter, LowShelfFilter, HighShelfFilter
from pedalboard.io import AudioFile
import os
import shutil
import uuid

app = FastAPI(title="Masterizador Personal")

# Habilitar CORS para que el frontend local se pueda comunicar con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/masterizar/")
async def masterizar_audio(
    file: UploadFile = File(...),
    preset: str = Form("punchy")
):
    if not file.filename.endswith(('.wav', '.WAV', '.mp3', '.MP3')):
        raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Usa WAV o MP3.")

    # Guardar archivo subido temporalmente
    file_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    output_path = os.path.join(TEMP_DIR, f"master_{file_id}.wav")

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Procesar audio con Pedalboard
        with AudioFile(input_path) as f:
            audio = f.read(f.frames)
            sample_rate = f.samplerate

        # Definir cadena según preset
        if preset == "punchy":
            board = Pedalboard([
                LowShelfFilter(cutoff_frequency_hz=100, gain_db=2.0),
                Compressor(threshold_db=-16, ratio=3.0, attack_ms=15, release_ms=100),
                HighShelfFilter(cutoff_frequency_hz=10000, gain_db=1.5),
                Limiter(threshold_db=-0.3)
            ])
        elif preset == "warm":
            board = Pedalboard([
                LowShelfFilter(cutoff_frequency_hz=200, gain_db=1.5),
                Compressor(threshold_db=-12, ratio=2.0, attack_ms=20, release_ms=150),
                Limiter(threshold_db=-0.5)
            ])
        else: # Limpio / Default
            board = Pedalboard([
                Limiter(threshold_db=-0.3)
            ])

        effected = board(audio, sample_rate)

        # Exportar en WAV
        with AudioFile(output_path, 'w', sample_rate, effected.shape[0]) as f:
            f.write(effected)

    I except Exception as e:
        # Limpieza en caso de error
        if os.path.exists(input_path): os.remove(input_path)
        raise HTTPException(status_code=500, detail=f"Error procesando el audio: {str(e)}")

    # Limpiar archivo de entrada original
    if os.path.exists(input_path): 
        os.remove(input_path)

    return FileResponse(output_path, media_type="audio/wav", filename="cancion_masterizada.wav")