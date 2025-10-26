# Secrets & Environment Variables

This project uses environment variables for credentials and configuration (for example `FRED_API_KEY`).

## Local development

- Copy `.env.example` to `.env` and fill in your values.
- Python apps load `.env` automatically via `python-dotenv` (entrypoint loads it). Alternatively, export variables in your shell.

```powershell
# PowerShell example
$env:FRED_API_KEY="your_fred_key"
$env:LOG_LEVEL="INFO"
```

## Docker

- Do NOT bake secrets into images.
- Pass them at runtime with `-e`:

```bash
docker run --rm -p 5002:5002 \
  -e BACKEND_MODE=webapp \
  -e FRED_API_KEY="$FRED_API_KEY" \
  abcm:latest
```

## GitHub Actions (CI)

- Primary pipeline: runs a Docker smoke test in mock mode and does not require `FRED_API_KEY`.
- Optional live smoke: use the manual workflow to pass a secret just-in-time when you need live FRED verification.
  - Add `FRED_API_KEY` in repo Settings → Secrets and variables → Actions → New repository secret.
  - Trigger "Run Live Smoke (Manual)" and optionally provide the `fred_api_key` input; if omitted, it uses the repo secret.
  - The pipeline never bakes secrets into images; they are provided only at runtime when starting containers.

## Security policy

- Never commit real keys to the repo.
- Use `.env.example` as a template.
- Rotate secrets if compromised.
- Avoid logging secrets or placing them in telemetry.
