# Multi-stage Dockerfile for Austrian Business Cycle Monitor
# Builds frontend static assets and serves via Flask backend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend package files
COPY packages/frontend/package*.json ./
# Install full deps to build (devDependencies needed for Vite build)
RUN npm ci

# Copy frontend source
COPY packages/frontend/ ./

# Build production frontend
RUN npm run build

# Stage 2: Python runtime
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/ ./apps/
COPY config/ ./config/
COPY tools/ ./tools/
COPY translations/ ./translations/
COPY LICENSE .
COPY README.md .
COPY wsgi.py ./wsgi.py
COPY entrypoint.py ./entrypoint.py

# Copy built frontend from stage 1
COPY --from=frontend-builder /build/dist ./packages/frontend/dist

# Create data and logs directories
RUN mkdir -p data logs

# Create non-root user and adjust permissions
RUN useradd -m -r -s /usr/sbin/nologin abcm && chown -R abcm:abcm /app
USER abcm

# Expose port
EXPOSE 5002

# Health check: use Python's stdlib to avoid curl/wget deps
HEALTHCHECK --interval=30s --timeout=5s --retries=5 \
    CMD python -c "import urllib.request,sys; \
import json; \
u='http://127.0.0.1:5002/api/status'; \
resp=urllib.request.urlopen(u,timeout=3); \
sys.exit(0 if resp.status==200 else 1)" || exit 1

# Defaults for production
ENV BACKEND_MODE=webapp
ENV HOST=0.0.0.0
ENV PORT=5002

# Run production server
CMD ["python", "entrypoint.py"]
