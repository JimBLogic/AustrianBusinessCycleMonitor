# Multi-stage Dockerfile for Austrian Business Cycle Monitor
# Builds frontend static assets and serves via Flask backend

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend package files
COPY packages/frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source
COPY packages/frontend/ ./

# Build production frontend
RUN npm run build

# Stage 2: Python runtime
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
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

# Copy built frontend from stage 1
COPY --from=frontend-builder /build/dist ./packages/frontend/dist

# Create data and logs directories
RUN mkdir -p data logs

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002/api/health || exit 1

# Run the dashboard
CMD ["python", "-m", "apps.dashboard.webapp"]
