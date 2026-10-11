"""Smoke tests for primary Austrian Dashboard API endpoints.

These validate that the Flask application boots and the core JSON
contracts return expected top-level keys without raising exceptions.
"""
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).parent.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(APPS_DIR))

from apps.dashboard.webapp import AustrianDashboard  # noqa: E402


def get_client():
    dash = AustrianDashboard()
    assert dash.app is not None, "Failed to construct Flask app"
    return dash.app.test_client()


def test_api_status():
    client = get_client()
    resp = client.get('/api/status')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['status'] == 'operational'
    assert 'austrian_monitor' in data


def test_api_current_data():
    client = get_client()
    resp = client.get('/api/current-data')
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload['success'] is True
    assert 'data' in payload
    inner = payload['data']
    assert 'status' in inner
    assert 'market_data' in inner


def test_api_bitcoin_price():
    client = get_client()
    resp = client.get('/api/bitcoin-price')
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload['success'] is True
    assert 'data' in payload
    assert 'price' in payload['data']


def test_api_market_data():
    client = get_client()
    resp = client.get('/api/market-data')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'success' in data
    assert 'data' in data


def test_api_analysis_and_three_pillars():
    client = get_client()
    # Analysis
    analysis_resp = client.get('/api/analysis')
    assert analysis_resp.status_code in (200, 503)
    # Three pillars
    pillars_resp = client.get('/api/three-pillars')
    assert pillars_resp.status_code in (200, 503)


def test_api_start_stop_monitoring():
    client = get_client()
    start_resp = client.post('/api/start-monitoring')
    assert start_resp.status_code == 200
    start_payload = start_resp.get_json()
    assert start_payload['success'] is True
    stop_resp = client.post('/api/stop-monitoring')
    assert stop_resp.status_code == 200
    stop_payload = stop_resp.get_json()
    assert stop_payload['success'] is True


def test_api_refresh():
    client = get_client()
    refresh_resp = client.post('/api/refresh')
    # 200 if monitor available else potentially 503
    assert refresh_resp.status_code in (200, 503)
