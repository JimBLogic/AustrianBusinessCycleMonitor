"""Tests for newly added lightweight live endpoints.

Focus on structural presence and basic key set, not specific values.
"""
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).parent.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(APPS_DIR))

from apps.dashboard.webapp import AustrianDashboard  # type: ignore  # noqa: E402

def _client():
    dash = AustrianDashboard()
    assert dash.app is not None
    return dash.app.test_client()

def test_live_assets_structure():
    c = _client()
    r = c.get('/api/live-assets')
    assert r.status_code == 200
    payload = r.get_json()
    assert payload['success'] is True
    assert 'data' in payload and 'assets' in payload['data']
    assets = payload['data']['assets']
    # At least bitcoin key expected
    assert 'bitcoin' in assets


def test_live_snapshot_structure():
    c = _client()
    r = c.get('/api/live-snapshot')
    assert r.status_code == 200
    payload = r.get_json()
    assert 'data' in payload
    assert 'bitcoin' in payload['data']
