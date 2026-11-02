from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pedalboard import Pedalboard, Compressor, Limiter, LowShelfFilter, HighShelfFilter, PeakFilter, Distortion, Chorus, Delay
from pedalboard.io import AudioFile
import os
import shutil
import json
import uuid

app = FastAPI(title="Masterizador Personal Avanzado con Rack")

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
    preset: str = Form("standard"),
    efectos_json: str = Form("{}")
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
                    Compressor(threshold_db=-18, ratio=3.0, attack_ms=10, release_ms=80)
                ]
            elif preset == "calida":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=250, gain_db=1.5),
                    PeakFilter(cutoff_frequency_hz=1500, q=1.0, gain_db=1.0),
                    Compressor(threshold_db=-14, ratio=2.5, attack_ms=15, release_ms=120)
                ]
            elif preset == "radio":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=300, gain_db=-2.0),
                    HighShelfFilter(cutoff_frequency_hz=5000, gain_db=3.5),
                    Compressor(threshold_db=-20, ratio=4.0, attack_ms=5, release_ms=50)
                ]
            elif preset == "intima":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=150, gain_db=2.0),
                    Compressor(threshold_db=-12, ratio=2.0, attack_ms=25, release_ms=150)
                ]
            else: # limpia
                effects = [Compressor(threshold_db=-15, ratio=2.0)]

        # --- BATERÍA ---
        elif instrumento == "bateria":
            if preset == "punchy":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=80, gain_db=3.0),
                    PeakFilter(cutoff_frequency_hz=4000, q=2.0, gain_db=2.0),
                    Compressor(threshold_db=-16, ratio=4.0, attack_ms=25, release_ms=50)
                ]
            elif preset == "crunchy":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=2.0),
                    Distortion(drive_db=3.0),
                    Compressor(threshold_db=-14, ratio=3.0, attack_ms=15, release_ms=80)
                ]
            elif preset == "gigante":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=60, gain_db=4.0),
                    HighShelfFilter(cutoff_frequency_hz=10000, gain_db=2.5),
                    Compressor(threshold_db=-18, ratio=4.5, attack_ms=30, release_ms=100)
                ]
            else: # natural
                effects = [
                    Compressor(threshold_db=-12, ratio=2.0, attack_ms=30, release_ms=100)
                ]

        # --- BAJO ---
        elif instrumento == "bajo":
            if preset == "profundo":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=3.5),
                    Compressor(threshold_db=-15, ratio=3.5, attack_ms=20, release_ms=150)
                ]
            elif preset == "definido":
                effects = [
                    PeakFilter(cutoff_frequency_hz=800, q=1.5, gain_db=2.5),
                    PeakFilter(cutoff_frequency_hz=2000, q=1.0, gain_db=1.5),
                    Compressor(threshold_db=-14, ratio=3.0)
                ]
            elif preset == "saturado":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=120, gain_db=2.0),
                    Distortion(drive_db=4.5),
                    Compressor(threshold_db=-16, ratio=3.0, attack_ms=10, release_ms=100)
                ]
            else:
                effects = [Compressor(threshold_db=-14, ratio=2.5)]

        # --- GUITARRA ---
        elif instrumento == "guitarra":
            if preset == "brillante":
                effects = [
                    HighShelfFilter(cutoff_frequency_hz=6000, gain_db=3.0),
                    Compressor(threshold_db=-15, ratio=2.5)
                ]
            elif preset == "calida":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=300, gain_db=2.0),
                    PeakFilter(cutoff_frequency_hz=1200, q=1.2, gain_db=1.5),
                    Compressor(threshold_db=-14, ratio=2.5)
                ]
            elif preset == "rock_distorsion":
                effects = [
                    PeakFilter(cutoff_frequency_hz=2500, q=2.0, gain_db=2.0),
                    Distortion(drive_db=3.5),
                    Compressor(threshold_db=-16, ratio=3.0)
                ]
            else:
                effects = []

        # --- TECLADO / SYNTH ---
        elif instrumento == "teclado":
            if preset == "espacial":
                effects = [
                    HighShelfFilter(cutoff_frequency_hz=7000, gain_db=3.0),
                    PeakFilter(cutoff_frequency_hz=3500, q=1.0, gain_db=1.5),
                    Compressor(threshold_db=-15, ratio=2.0, attack_ms=20, release_ms=150)
                ]
            elif preset == "gordo":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=150, gain_db=2.5),
                    Compressor(threshold_db=-14, ratio=2.5)
                ]
            else:
                effects = [Compressor(threshold_db=-15, ratio=2.0)]

        # --- MEZCLA GENERAL (MASTER) ---
        else:
            if preset == "commercial_loud":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=2.0),
                    HighShelfFilter(cutoff_frequency_hz=9000, gain_db=2.0),
                    Compressor(threshold_db=-14, ratio=3.0, attack_ms=10, release_ms=80)
                ]
            elif preset == "warm_analog":
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=200, gain_db=1.5),
                    Distortion(drive_db=2.0),
                    Compressor(threshold_db=-15, ratio=2.5, attack_ms=20, release_ms=150)
                ]
            elif preset == "dinamico_limpio":
                effects = [
                    Compressor(threshold_db=-18, ratio=2.0, attack_ms=30, release_ms=200)
                ]
            else:
                effects = [
                    LowShelfFilter(cutoff_frequency_hz=100, gain_db=1.5),
                    Compressor(threshold_db=-15, ratio=2.5),
                    HighShelfFilter(cutoff_frequency_hz=10000, gain_db=1.5)
                ]

        # --- INTEGRACIÓN DEL RACK DE EFECTOS INDEPENDIENTES ---
        try:
            efectos_extras = json.loads(efectos_json)
        except:
            efectos_extras = {}

        if efectos_extras.get("reverb_activo"):
            tipo_reverb = efectos_extras.get("reverb_tipo", "plate")
            if tipo_reverb == "room":
                effects.append(Chorus(rate_hz=0.8, depth=0.1, centre_delay_ms=7.0, feedback=0.1, mix=0.2))
            elif tipo_reverb == "hall":
                effects.append(Chorus(rate_hz=0.3, depth=0.3, centre_delay_ms=25.0, feedback=0.3, mix=0.35))
            else:
                effects.append(Chorus(rate_hz=0.5, depth=0.2, centre_delay_ms=12.0, feedback=0.2, mix=0.25))

        if efectos_extras.get("delay_activo"):
            delay_tiempo = float(efectos_extras.get("delay_tiempo", 0.3))
            effects.append(Delay(delay_seconds=delay_tiempo, feedback=0.3, mix=0.25))

        if efectos_extras.get("comp_activo"):
            effects.append(Compressor(threshold_db=-20, ratio=4.0, attack_ms=10, release_ms=100))

        if efectos_extras.get("saturacion_activo"):
            drive = float(efectos_extras.get("saturacion_drive", 2.5))
            effects.append(Distortion(drive_db=drive))

        # Limitador final de seguridad para evitar saturación digital por los efectos acumulados
        effects.append(Limiter(threshold_db=-0.3))

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