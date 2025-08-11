# syntax=docker/dockerfile:1
# Multi-stage build for Austrian Business Cycle Monitor

FROM python:3.11-slim AS base
LABEL maintainer="Austrian Business Cycle Monitor"
WORKDIR /app

# Install system deps (add as needed)
RUN apt-get update -y && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Prevent Python from writing .pyc and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy dependency manifests first for better layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps ./apps
COPY launchers ./launchers
COPY templates ./templates
COPY static ./static
COPY config ./config
COPY translations ./translations
COPY tools ./tools
COPY data ./data
COPY apps/version.py ./apps/version.py
COPY .env.example ./.env.example

# Expose default port
EXPOSE 5002

# Default environment vars (override at runtime)
ENV HOST=0.0.0.0 PORT=5002 FLASK_ENV=production

# Healthcheck (basic TCP connect) - can be replaced with curl to /api/status
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import socket,os; s=socket.socket(); \
  s.settimeout(2); \
  s.connect(('127.0.0.1', int(os.environ.get('PORT',5002)))); s.close()" || exit 1

# Runtime command
CMD ["python", "launchers/main.py"]
