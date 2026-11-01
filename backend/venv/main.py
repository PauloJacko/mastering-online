from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pedalboard import Pedalboard, Compressor, Limiter, LowShelfFilter, HighShelfFilter, PeakFilter, Distortion
from pedalboard.io import AudioFile
import os
import shutil
import uuid

app = FastAPI(title="Masterizador Personal Avanzado")

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
    instrumento: str = Form("mezcla_general"),
    preset: str = Form("standard")
):
    if not file.filename.endswith(('.wav', '.WAV', '.mp3', '.MP3')):
        raise HTTPException(status_code=400, detail="Formato de archivo no soportado. Usa WAV o MP3.")

    file_id = str(uuid.uuid4())
    input_path = os.path.join(TEMP_DIR, f"{file_id}_{file.filename}")
    output_path = os.path.join(TEMP_DIR, f"master_{file_id}.wav")

    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        with AudioFile(input_path) as f:
            audio = f.read(f.frames)
            sample_rate = f.samplerate

        effects = []

        # --- VOCES ---
        if instrumento == "voz":
            if preset == "moderna":
                effects = [
                    HighShelfFilter(cutoff_frequency_hz=8000, gain_db=3.0),
                    PeakFilter(cutoff_frequency_hz=3000, q=1.5, gain_db=2.0),
                    Compressor(threshold_db=-18, ratio=3.0, attack_ms=10, release_ms=80),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "calida":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=250, gain_db=1.5),
                    PeakFilter(cutoff_frequency_hz=1500, q=1.0, gain_db=1.0),
                    Compressor(threshold_db=-14, ratio=2.5, attack_ms=15, release_ms=120),
                    Limiter(threshold_db=-0.8)
                ]
            elif preset == "radio":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=300, gain_db=-2.0), # Corte sutil de graves
                    HighShelfFilter(cutoff_frequency_hz=5000, gain_db=3.5),
                    Compressor(threshold_db=-20, ratio=4.0, attack_ms=5, release_ms=50),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "intima":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=150, gain_db=2.0),
                    Compressor(threshold_db=-12, ratio=2.0, attack_ms=25, release_ms=150),
                    Limiter(threshold_db=-1.0)
                ]
            else: # limpia
                effects = [Compressor(threshold_db=-15, ratio=2.0), Limiter(threshold_db=-0.5)]

        # --- BATERÍA ---
        elif instrumento == "bateria":
            if preset == "punchy":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=80, gain_db=3.0),
                    PeakFilter(cutoff_frequency_hz=4000, q=2.0, gain_db=2.0),
                    Compressor(threshold_db=-16, ratio=4.0, attack_ms=25, release_ms=50),
                    Limiter(threshold_db=-0.3)
                ]
            elif preset == "crunchy":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=2.0),
                    Distortion(drive_db=3.0), # Saturación para grosor
                    Compressor(threshold_db=-14, ratio=3.0, attack_ms=15, release_ms=80),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "gigante":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=60, gain_db=4.0),
                    HighShelfFilter(cutoff_frequency_hz=10000, gain_db=2.5),
                    Compressor(threshold_db=-18, ratio=4.5, attack_ms=30, release_ms=100),
                    Limiter(threshold_db=-0.3)
                ]
            else: # natural
                effects = [
                    Compressor(threshold_db=-12, ratio=2.0, attack_ms=30, release_ms=100),
                    Limiter(threshold_db=-0.5)
                ]

        # --- BAJO ---
        elif instrumento == "bajo":
            if preset == "profundo":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=3.5),
                    Compressor(threshold_db=-15, ratio=3.5, attack_ms=20, release_ms=150),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "definido":
                effects = [
                    PeakFilter(cutoff_frequency_hz=800, q=1.5, gain_db=2.5),
                    PeakFilter(cutoff_frequency_hz=2000, q=1.0, gain_db=1.5),
                    Compressor(threshold_db=-14, ratio=3.0),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "saturado":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=120, gain_db=2.0),
                    Distortion(drive_db=4.5),
                    Compressor(threshold_db=-16, ratio=3.0, attack_ms=10, release_ms=100),
                    Limiter(threshold_db=-0.5)
                ]
            else:
                effects = [Compressor(threshold_db=-14, ratio=2.5), Limiter(threshold_db=-0.5)]

        # --- GUITARRA ---
        elif instrumento == "guitarra":
            if preset == "brillante":
                effects = [
                    HighShelfFilter(cutoff_frequency_hz=6000, gain_db=3.0),
                    Compressor(threshold_db=-15, ratio=2.5),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "calida":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=300, gain_db=2.0),
                    PeakFilter(cutoff_frequency_hz=1200, q=1.2, gain_db=1.5),
                    Compressor(threshold_db=-14, ratio=2.5),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "rock_distorsion":
                effects = [
                    PeakFilter(cutoff_frequency_hz=2500, q=2.0, gain_db=2.0),
                    Distortion(drive_db=3.5),
                    Compressor(threshold_db=-16, ratio=3.0),
                    Limiter(threshold_db=-0.3)
                ]
            else:
                effects = [Limiter(threshold_db=-0.5)]

        # --- TECLADO / SYNTH ---
        elif instrumento == "teclado":
            if preset == "espacial":
                effects = [
                    HighShelfFilter(cutoff_frequency_hz=7000, gain_db=3.0),
                    PeakFilter(cutoff_frequency_hz=3500, q=1.0, gain_db=1.5),
                    Compressor(threshold_db=-15, ratio=2.0, attack_ms=20, release_ms=150),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "gordo":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=150, gain_db=2.5),
                    Compressor(threshold_db=-14, ratio=2.5),
                    Limiter(threshold_db=-0.5)
                ]
            else:
                effects = [Compressor(threshold_db=-15, ratio=2.0), Limiter(threshold_db=-0.5)]

        # --- MEZCLA GENERAL (MASTER) ---
        else:
            if preset == "commercial_loud":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=2.0),
                    HighShelfFilter(cutoff_frequency_hz=9000, gain_db=2.0),
                    Compressor(threshold_db=-14, ratio=3.0, attack_ms=10, release_ms=80),
                    Limiter(threshold_db=-0.2)
                ]
            elif preset == "warm_analog":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=200, gain_db=1.5),
                    Distortion(drive_db=2.0),
                    Compressor(threshold_db=-15, ratio=2.5, attack_ms=20, release_ms=150),
                    Limiter(threshold_db=-0.5)
                ]
            elif preset == "dinamico_limpio":
                effects = [
                    Compressor(threshold_db=-18, ratio=2.0, attack_ms=30, release_ms=200),
                    Limiter(threshold_db=-0.8)
                ]
            else:
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=1.5),
                    Compressor(threshold_db=-15, ratio=2.5),
                    HighShelfFilter(cutoff_frequency_hz=10000, gain_db=1.5),
                    Limiter(threshold_db=-0.3)
                ]

        board = Pedalboard(effects)
        effected = board(audio, sample_rate)

        with AudioFile(output_path, 'w', sample_rate, effected.shape[0]) as f:
            f.write(effected)

    except Exception as e:
        if os.path.exists(input_path): 
            os.remove(input_path)
        raise HTTPException(status_code=500, detail=f"Error procesando el audio: {str(e)}")

    if os.path.exists(input_path): 
        os.remove(input_path)

    return FileResponse(output_path, media_type="audio/wav", filename=f"master_{instrumento}.wav")