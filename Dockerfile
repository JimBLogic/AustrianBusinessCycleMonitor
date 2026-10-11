# Multi-stage Dockerfile for Austrian Business Cycle Monitor
# Builds frontend static assets and serves them through the Flask backend.

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend package files first to preserve the dependency cache.
COPY packages/frontend/package*.json ./
RUN npm ci

# Copy frontend source and build the production bundle.
COPY packages/frontend/ ./
RUN npm run build

# Stage 2: Python runtime. Match the version validated in CI.
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only runtime application resources.
COPY apps/ ./apps/
COPY config/ ./config/
COPY tools/ ./tools/
COPY translations/ ./translations/
COPY LICENSE .
COPY README.md .
COPY wsgi.py ./wsgi.py
COPY entrypoint.py ./entrypoint.py

COPY --from=frontend-builder /build/dist ./packages/frontend/dist

RUN mkdir -p data logs \
 && useradd -m -r -s /usr/sbin/nologin abcm \
 && chown -R abcm:abcm /app

USER abcm

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
    CMD python -c "import urllib.request,sys; u='http://127.0.0.1:5002/api/status'; response=urllib.request.urlopen(u,timeout=3); sys.exit(0 if response.status==200 else 1)" || exit 1

ENV BACKEND_MODE=webapp
ENV HOST=0.0.0.0
ENV PORT=5002

CMD ["python", "entrypoint.py"]
