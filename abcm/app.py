"""Flask application entry point for the Austrian Business Cycle Monitor."""
from apps.dashboard.webapp import AustrianDashboard

dashboard = AustrianDashboard()
app = dashboard.app
