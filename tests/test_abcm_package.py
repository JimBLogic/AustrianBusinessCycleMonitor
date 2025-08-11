"""Basic test for the new abcm migration package."""

def test_create_app():
    from abcm import create_app, get_monitor
    app = create_app()
    assert app is not None
    monitor = get_monitor()
    assert hasattr(monitor, 'get_dashboard_data')
