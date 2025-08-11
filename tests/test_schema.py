"""Schema validation tests for core API endpoints.

Ensures structural contracts remain stable (lightweight checks only).
"""
from pathlib import Path
import sys
PROJECT_ROOT = Path(__file__).parent.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(APPS_DIR))

from apps.dashboard.webapp import AustrianDashboard  # noqa: E402


def get_client():
    """Return a Flask test client, asserting the dashboard app initialized.

    This guards against Optional access so Pylance stops flagging .test_client().
    """
    dash = AustrianDashboard()
    assert dash.app is not None, "Flask app failed to initialize (Flask not installed?)"
    return dash.app.test_client()


def test_status_schema():
    resp = get_client().get('/api/status')
    data = resp.get_json()
    for key in ['status', 'timestamp', 'austrian_monitor', 'monitoring']:
        assert key in data


def test_openapi_meta():
    c = get_client()
    meta = c.get('/api/meta').get_json()
    assert meta['version']
    spec = c.get('/api/openapi.json').get_json()
    assert spec['openapi'].startswith('3.')
    assert '/api/status' in spec['paths']


def test_bitcoin_price_schema():
    payload = get_client().get('/api/bitcoin-price').get_json()
    assert 'data' in payload
    assert 'price' in payload['data']
