## Security & Secrets

This project avoids committing real credentials.

Guidelines:

1. Never commit a real FRED_API_KEY or other API tokens. Use `.env.example` as a template.
2. The committed `.env` only contains placeholders; rotate any previously exposed keys.
3. Add new secret configuration keys ONLY to your local untracked `.env`.
4. Before opening a PR, run a secret scan (e.g. `gitleaks detect`) if available.
5. Use `SECRET_KEY` only for local dev; production should inject a strong random value.
6. Logs should not contain API keys. Review logging configuration when adding modules.

Incident Response (exposed key):
1. Revoke the key at the provider portal immediately.
2. Purge it from git history if necessary (BFG Repo-Cleaner / git filter-repo).
3. Issue a new key and update deployment environments.

Threat Model (brief):
- Primary risk: accidental secret exposure or tampered economic data sources.
- Mitigation: placeholder secrets, validation tooling, clear boundaries between runtime code and archived legacy material.

Future Enhancements:
- Add pre-commit hook for secret scanning.
- Implement integrity hashes for critical downloaded datasets.
