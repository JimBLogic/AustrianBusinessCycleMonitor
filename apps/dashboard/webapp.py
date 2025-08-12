#!/usr/bin/env python3
from __future__ import annotations
import sys
from pathlib import Path

# Ensure the project root is in sys.path for absolute imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

"""
Austrian Business Cycle Monitor Dashboard - Final Version

This is the unified, production-ready dashboard app for the Austrian Business Cycle Monitor.
It combines the best features from all previous dashboard implementations.

- Clear variable and function names
- Comprehensive comments for monitoring configuration
- Consistent formatting and indentation
- Error handling and logging
- Loads configuration from environment or config files
- Secure handling of credentials
- Sample endpoints for metrics, status, and cycle analysis
"""

import json
import logging
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Optional

from flask import Flask, jsonify, render_template
from flask_cors import CORS
from flask_socketio import SocketIO

# Core domain imports
from apps.core.austrian_monitor import AustrianCycleMonitor
from apps.utils.asset_tracker import AssetTracker

# Configure logging for dashboard
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("dashboard")

# Load environment-specific settings
DASHBOARD_PORT = int(os.environ.get("DASHBOARD_PORT", 5002))
DASHBOARD_HOST = os.environ.get("DASHBOARD_HOST", "127.0.0.1")

PROJECT_VERSION = "0.1.1"
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_TEMPLATES = _REPO_ROOT / "templates"
_STATIC = _REPO_ROOT / "static"
_TRANSLATIONS_JSON = _REPO_ROOT / "translations" / "translations.json"


class AustrianDashboard:
    """Primary dashboard server for Austrian Business Cycle Monitor."""

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 5002,
        debug: bool = False,
        language: str = "en",
    ) -> None:
        # Core runtime settings
        self.host = host
        self.port = port
        self.debug = debug
        self.default_language = language

        # Monitoring / analysis state
        self.monitor_active = False
        self._last_full_refresh: float | None = None

        # Initialize metrics - fixing undefined metrics attribute
        self.metrics: Dict[str, float | int] = {
            "requests_total": 0,
            "requests_2xx": 0,
            "requests_4xx": 0,
            "requests_5xx": 0,
            "analysis_runs": 0,
            "live_asset_polls": 0,
            "last_request_ts": 0.0,
        }

        # Translation store (JSON-based i18n)
        self._translations: Dict[str, Dict[str, str]] = {}
        self._supported_languages = {"en", "es"}
        self._load_translations()

        # Domain services
        self.monitor = AustrianCycleMonitor()
        self.asset_tracker = AssetTracker()

        # Flask / SocketIO setup
        self.app = Flask(
            __name__,
            template_folder=str(_TEMPLATES),
            static_folder=str(_STATIC),
        )
        self.app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret")
        CORS(self.app)
        self.socketio = SocketIO(self.app, async_mode="threading", cors_allowed_origins="*")

        # Register routes & middleware
        self._register_before_request()
        self._register_routes()
        self._register_error_handlers()

        # Load FRED API key from environment
        self.fred_api_key = os.getenv("FRED_API_KEY")
        if not self.fred_api_key:
            print("⚠️  FRED_API_KEY not set, using demo mode")

    # --------------------------------------------------------------------- #
    # Internal helpers
    # --------------------------------------------------------------------- #
    def _load_translations(self) -> None:
        """Load JSON translations from file"""
        if self._translations:
            return
        if _TRANSLATIONS_JSON.exists():
            try:
                data = json.loads(_TRANSLATIONS_JSON.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    self._translations = data
            except Exception:
                self._translations = {}
        if "en" not in self._translations:
            # Minimal fallback
            self._translations["en"] = {
                "dashboard_title": "Austrian Business Cycle Monitor",
                "status_ok": "OK",
            }

    def t(self, key: str, lang: Optional[str] = None) -> str:
        """Translate a key; fallback to English or key itself."""
        lang = (lang or self.default_language).lower()
        if lang not in self._supported_languages:
            lang = "en"
        return self._translations.get(lang, {}).get(
            key, self._translations.get("en", {}).get(key, key)
        )

    def _inc_metric(self, name: str) -> None:
        """Increment a numeric metric safely."""
        if name not in self.metrics:
            self.metrics[name] = 0
        val = self.metrics.get(name, 0)
        if isinstance(val, (int, float)):
            self.metrics[name] = val + 1

    def _timestamp(self) -> str:
        """Get current ISO timestamp with timezone"""
        return datetime.now(UTC).isoformat()

    # --------------------------------------------------------------------- #
    # Request / error hooks
    # --------------------------------------------------------------------- #
    def _register_before_request(self) -> None:
        """Register the before_request handler for metrics tracking"""
        @self.app.before_request
        def _metrics_hook() -> None:
            self.metrics["requests_total"] += 1
            import time
            self.metrics["last_request_ts"] = time.time()

    def _register_error_handlers(self) -> None:
        """Register error handlers for common HTTP errors"""
        @self.app.errorhandler(404)
        def _not_found(e):  # noqa: ANN001
            self._inc_metric("requests_4xx")
            return jsonify({"error": "Not Found"}), 404

        @self.app.errorhandler(500)
        def _server_error(e):  # noqa: ANN001
            self._inc_metric("requests_5xx")
            return jsonify({"error": "Internal Server Error"}), 500

    # --------------------------------------------------------------------- #
    # Routes
    # --------------------------------------------------------------------- #
    def _register_routes(self) -> None:
        """Register all API routes and endpoints"""
        app = self.app

        @app.route("/")
        def index():
            """
            Render the main dashboard page.
            """
            try:
                analysis = self.monitor.run_analysis()
                pillars = self.monitor.get_three_pillars_data()
                market = self.monitor.get_market_data()
                return render_template(
                    "dashboard.html",
                    analysis=analysis,
                    pillars=pillars,
                    market=market,
                    title=self.t("dashboard_title"),
                )
            except Exception as e:
                logger.error(f"Dashboard rendering error: {e}")
                return "<h1>Dashboard Error</h1><p>Could not load dashboard data.</p>", 500

        @app.route("/api/status")
        def api_status():
            """
            API endpoint for dashboard status.
            """
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "status": "ok",
                "version": PROJECT_VERSION,
                "timestamp": self._timestamp(),
                "monitor_active": self.monitor_active,
                "metrics": self.metrics,
            })

        @app.route("/api/health")
        def api_health():
            self.metrics["requests_2xx"] += 1
            return jsonify({"ok": True, "ts": self._timestamp()})

        @app.route("/api/analysis")
        def api_analysis():
            data = self.monitor.run_analysis()
            self.metrics["analysis_runs"] += 1
            self.metrics["requests_2xx"] += 1
            return jsonify({"analysis": data, "generated_at": self._timestamp()})

        @app.route("/api/market-data")
        def api_market_data():
            data = self.monitor.get_market_data()
            self.metrics["requests_2xx"] += 1
            return jsonify({"market_data": data, "generated_at": self._timestamp()})

        @app.route("/api/three-pillars")
        def api_three_pillars():
            """
            API endpoint for three pillars analysis.
            """
            try:
                pillars = self.monitor.get_three_pillars_data()
                self.metrics["requests_2xx"] += 1
                return jsonify(pillars)
            except Exception as e:
                logger.error(f"API three pillars error: {e}")
                return jsonify({"error": "Could not fetch three pillars data"}), 500

        @app.route("/api/bitcoin-price")
        def api_bitcoin_price():
            prices = self.asset_tracker.get_latest_prices()
            btc = prices.get("bitcoin", {})
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "symbol": "BTC",
                "price": btc.get("price"),
                "source": btc.get("source"),
                "timestamp": self._timestamp(),
            })

        @app.route("/api/start-monitoring", methods=["POST"])
        def api_start():
            self.monitor_active = True
            return jsonify({"started": True, "timestamp": self._timestamp()})

        @app.route("/api/stop-monitoring", methods=["POST"])
        def api_stop():
            self.monitor_active = False
            return jsonify({"stopped": True, "timestamp": self._timestamp()})

        @app.route("/api/cycle-analysis")
        def api_cycle_analysis():
            """
            API endpoint for detailed cycle analysis.
            """
            try:
                analysis_obj = self.monitor.analyze()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "timestamp": analysis_obj.timestamp,
                    "cycle_phase": analysis_obj.cycle_phase,
                    "monetary_policy_risk": analysis_obj.monetary_policy_risk,
                    "credit_market_risk": analysis_obj.credit_market_risk,
                    "real_economy_risk": analysis_obj.real_economy_risk,
                    "overall_risk": analysis_obj.overall_risk,
                    "recommendations": analysis_obj.recommendations,
                    "key_indicators": analysis_obj.key_indicators,
                    "narrative": analysis_obj.narrative
                })
            except Exception as e:
                logger.error(f"API cycle analysis error: {e}")
                return jsonify({"error": "Could not fetch cycle analysis"}), 500

        @app.route("/metrics")
        def metrics():
            """Prometheus-compatible metrics endpoint"""
            lines = [
                "# HELP abcm_requests_total Total HTTP requests",
                "# TYPE abcm_requests_total counter",
                f"abcm_requests_total {self.metrics['requests_total']}",
                "# HELP abcm_analysis_runs Analysis executions",
                "# TYPE abcm_analysis_runs counter",
                f"abcm_analysis_runs {self.metrics['analysis_runs']}",
                "# HELP abcm_live_asset_polls Live asset polls",
                "# TYPE abcm_live_asset_polls counter",
                f"abcm_live_asset_polls {self.metrics.get('live_asset_polls', 0)}",
            ]
            return "\n".join(lines) + "\n", 200, {"Content-Type": "text/plain; version=0.0.4"}

    # --------------------------------------------------------------------- #
    # Public helpers
    # --------------------------------------------------------------------- #
    def run(self, host=None, port=None, debug=False):
        """Run the dashboard Flask app with debug support."""
        host = host or self.host
        port = port or self.port
        # If using Flask-SocketIO, use socketio.run; else, use app.run
        if hasattr(self, "socketio"):
            self.socketio.run(self.app, host=host, port=port, debug=debug)
        else:
            self.app.run(host=host, port=port, debug=debug)


def create_app() -> Flask:
    """Factory used by WSGI servers."""
    dashboard = AustrianDashboard()
    return dashboard.app


if __name__ == "__main__":
    logger.info(f"Starting dashboard on {DASHBOARD_HOST}:{DASHBOARD_PORT}")
    AustrianDashboard().run()
