# Test suite

The maintained Python tests cover the Flask composition, trusted FRED ingestion, deterministic snapshot persistence, read-only API behavior, and production endpoints.

From the repository root:

```bash
python -m pip install -r requirements.txt -r dev-requirements.txt
pytest -q
```

Frontend validation is package-local:

```bash
cd packages/frontend
npm ci
npm run type-check
npm run test -- --run
npm run build
```

The Sites v25 reference has an independent gate:

```bash
cd sites-v25
npm run install:ci
npm test
```

Historical PowerShell probes are preserved under `archive/copilot-era/launchers/`; they are not part of the supported test suite.
