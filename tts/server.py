"""Tiny text-to-speech service for Lydia's Games, using Piper (offline neural voices).

GET /tts?text=Hello&voice=en_US-lessac-medium&speed=normal  -> audio/wav
GET /tts/voices                                              -> JSON list of installed voices

Results are cached on disk, so each phrase is only synthesized once.
"""

import hashlib
import io
import json
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from piper import PiperVoice, SynthesisConfig

VOICES_DIR = Path(os.environ.get("VOICES_DIR", "/voices"))
CACHE_DIR = Path(os.environ.get("CACHE_DIR", "/cache"))
PORT = int(os.environ.get("PORT", "5000"))
MAX_TEXT = 300
# Piper's length_scale: bigger is slower. "normal" is a touch slow for a 5-year-old.
SPEEDS = {"slower": 1.25, "normal": 1.08, "faster": 0.92}
LABELS = {
    "en_US-lessac-medium": "Lessac (clear, US)",
    "en_US-hfc_female-medium": "Heather (warm, US)",
}

CACHE_DIR.mkdir(parents=True, exist_ok=True)
VOICES = {p.name[: -len(".onnx")]: p for p in sorted(VOICES_DIR.glob("*.onnx"))}
DEFAULT_VOICE = "en_US-lessac-medium" if "en_US-lessac-medium" in VOICES else next(iter(VOICES), None)
_loaded = {}
_locks = {name: threading.Lock() for name in VOICES}


def voice(name):
    if name not in _loaded:
        _loaded[name] = PiperVoice.load(str(VOICES[name]))
    return _loaded[name]


def synthesize(text, name, speed):
    key = hashlib.sha256(f"{name}|{speed}|{text}".encode()).hexdigest()
    path = CACHE_DIR / f"{key}.wav"
    if path.exists():
        return path.read_bytes()
    with _locks[name]:
        if path.exists():
            return path.read_bytes()
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav:
            voice(name).synthesize_wav(text, wav, syn_config=SynthesisConfig(length_scale=SPEEDS[speed]))
        data = buf.getvalue()
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(data)
        tmp.replace(path)
        return data


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, content_type, cache=False):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=31536000, immutable" if cache else "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def error(self, status, message):
        self.send(status, json.dumps({"error": message}).encode(), "application/json")

    def do_GET(self):
        url = urlparse(self.path)
        if url.path in ("/tts/voices", "/voices"):
            body = [{"id": v, "label": LABELS.get(v, v), "default": v == DEFAULT_VOICE} for v in VOICES]
            return self.send(200, json.dumps(body).encode(), "application/json")
        if url.path not in ("/tts", "/tts/"):
            return self.error(404, "not found")
        q = parse_qs(url.query)
        text = " ".join(q.get("text", [""])[0].split())
        name = q.get("voice", [DEFAULT_VOICE])[0] or DEFAULT_VOICE
        speed = q.get("speed", ["normal"])[0]
        if not text or len(text) > MAX_TEXT:
            return self.error(400, f"text must be 1-{MAX_TEXT} characters")
        if name not in VOICES:
            return self.error(400, "unknown voice")
        if speed not in SPEEDS:
            speed = "normal"
        try:
            audio = synthesize(text, name, speed)
        except Exception as exc:  # report, don't crash the server
            return self.error(500, str(exc))
        self.send(200, audio, "audio/wav", cache=True)

    def log_message(self, fmt, *args):
        pass  # keep container logs quiet


if __name__ == "__main__":
    if not VOICES:
        raise SystemExit(f"No .onnx voices found in {VOICES_DIR}")
    # Load every voice up front so the first phrase in each isn't slow.
    for name in VOICES:
        voice(name)
    print(f"Piper TTS on :{PORT} with voices: {', '.join(VOICES)}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
