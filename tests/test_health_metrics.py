"""Tests for health and metrics endpoints."""
from pathlib import Path
import sys
import json

PROJECT_ROOT = Path(__file__).parent.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(APPS_DIR))

from apps.dashboard.webapp import AustrianDashboard  # type: ignore


def test_health_and_metrics_endpoints():
    dash = AustrianDashboard()
    app = dash.app
    assert app is not None
    client = app.test_client()

    r = client.get('/api/health')
    assert r.status_code in (200, 503)
    data = r.get_json()
    assert 'austrian_monitor' in data

    r2 = client.get('/api/status')
    assert r2.status_code == 200
    data2 = r2.get_json()
    assert 'version' in data2
    assert 'metrics' in data2

    r3 = client.get('/metrics')
    assert r3.status_code == 200
    text = r3.data.decode('utf-8')
    assert 'abcm_requests_total' in text
