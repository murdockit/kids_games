# Offline neural text-to-speech (Piper) for Lydia's Games.
FROM python:3.12-slim

RUN pip install --no-cache-dir piper-tts==1.3.0

# Voices from https://huggingface.co/rhasspy/piper-voices (MIT/CC licensed models).
ADD https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx /voices/
ADD https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json /voices/
ADD https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx /voices/
ADD https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx.json /voices/

COPY server.py /app/server.py
ENV VOICES_DIR=/voices CACHE_DIR=/cache PORT=5000
EXPOSE 5000
CMD ["python", "/app/server.py"]
