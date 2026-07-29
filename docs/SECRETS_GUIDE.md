# Secrets and environment variables

The maintained Flask/FRED pipeline uses environment variables for credentials and deployment configuration. Never commit real keys.

## Local development

Set the FRED key in the shell that runs ingestion:

```bash
export FRED_API_KEY="your-real-key"
python -m apps.jobs.ingest_fred
python -m apps.jobs.build_trusted_snapshot
```

PowerShell equivalent:

```powershell
$env:FRED_API_KEY = "your-real-key"
python -m apps.jobs.ingest_fred
python -m apps.jobs.build_trusted_snapshot
```

The web process reads persisted snapshots and does not fetch or calculate provider data during an HTTP request.

## Production

Copy the tracked template and edit only the untracked file:

```bash
cp .env.production.example .env.production
docker compose --env-file .env.production -f compose.production.yml up -d --build
```

Keep `.env.production`, `FRED_API_KEY`, `SECRET_KEY`, and provider credentials out of logs, screenshots, issues, and pull requests.

## GitHub Actions

Normal CI validates code, frontend output, Compose, and the production image without exposing a provider key. The manual live-smoke workflow may use the repository secret `FRED_API_KEY`; prefer the encrypted repository secret over pasting a key into a workflow input.

If a credential may have been exposed, revoke it at the provider, create a replacement, and update the secret store before running the application again.
