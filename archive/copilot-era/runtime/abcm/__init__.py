"""Austrian Business Cycle Monitor (abcm) package.

This module provides a simplified interface for creating the dashboard app
and accessing the monitor instance.
"""
from apps.dashboard.webapp import AustrianDashboard
from apps.core.austrian_monitor import AustrianCycleMonitor

_dashboard_instance = None
_monitor_instance = None


def create_app(host: str = "127.0.0.1", port: int = 5002, debug: bool = False):
    """Create and return the Flask application instance.
    
    Args:
        host: Host address to bind to
        port: Port to bind to
        debug: Enable debug mode
        
    Returns:
        Flask application instance
    """
    global _dashboard_instance
    if _dashboard_instance is None:
        _dashboard_instance = AustrianDashboard(host=host, port=port, debug=debug)
    return _dashboard_instance.app


def get_monitor():
    """Get the Austrian Cycle Monitor instance.
    
    Returns:
        AustrianCycleMonitor instance
    """
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = AustrianCycleMonitor()
    return _monitor_instance


__all__ = ['create_app', 'get_monitor']
