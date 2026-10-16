# Backup + certificates for Lydia's Games. Python standard library only (plus the openssl tool).
FROM python:3.12-slim
WORKDIR /app
COPY server.py certs.py ./
ENV PYTHONUNBUFFERED=1
EXPOSE 5001
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=10 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5001/api/health')"
CMD ["python", "server.py"]
