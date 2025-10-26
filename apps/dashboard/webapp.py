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

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_socketio import SocketIO

# Core domain imports
from apps.core.austrian_monitor import AustrianCycleMonitor
from apps.utils.live_asset_tracker import AssetTracker
from apps.utils.blockchain_tracker import get_blockchain_tracker
from apps.utils.stock_tracker import get_stock_tracker
from apps.utils.optimized_data_fetcher import register_optimized_routes
from apps.utils.optimized_data_fetcher import get_dashboard_snapshot
from apps.utils.dynamic_content_engine import get_content_engine

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
_TEMPLATES = _REPO_ROOT / "packages" / "frontend" / "dist"
_STATIC = _REPO_ROOT / "packages" / "frontend" / "dist" / "assets"
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
        self.blockchain_tracker = get_blockchain_tracker()
        self.stock_tracker = get_stock_tracker()

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
        self._register_cache_headers()
        
        # Register optimized unified data fetching routes
        logger.info("Registering optimized data fetching routes...")
        register_optimized_routes(self.app)

        # Load FRED API key from environment
        self.fred_api_key = os.getenv("FRED_API_KEY")
        if not self.fred_api_key:
            print("WARNING: FRED_API_KEY not set, using demo mode")

    def _register_cache_headers(self) -> None:
        """Set sane cache headers: no-cache for HTML shell, long cache for hashed assets."""
        @self.app.after_request
        def add_cache_headers(response):  # type: ignore
            try:
                path = request.path or ""
                # HTML shell should not be cached so new index.html is fetched
                if path == "/" or path.endswith(".html"):
                    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
                    response.headers["Pragma"] = "no-cache"
                    response.headers["Expires"] = "0"
                # Fingerprinted assets can be cached for a long time
                elif path.startswith("/assets/"):
                    response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
                return response
            except Exception:
                return response

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
            Serve the React dashboard (index.html from frontend build).
            Falls back to a working HTML template if the built frontend isn't present.
            """
            try:
                # Try to serve the built React frontend
                return render_template("index.html")
            except Exception as e:
                logger.warning(f"Built frontend not found, falling back to working HTML template: {e}")
                # Fallback: serve a working HTML template from templates/
                try:
                    fallback_template_folder = _REPO_ROOT / "templates"
                    from flask import send_from_directory
                    return send_from_directory(str(fallback_template_folder), "dashboard_working.html")
                except Exception as fallback_error:
                    logger.error(f"Fallback template also failed: {fallback_error}")
                    return """
                    <html>
                    <head><title>Austrian Business Cycle Monitor</title></head>
                    <body style="font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
                        <h1>🏛️ Austrian Business Cycle Monitor - API Server</h1>
                        <p>Backend is running successfully!</p>
                        <h2>Available API Endpoints:</h2>
                        <ul>
                            <li><a href="/api/status">/api/status</a> - System status</li>
                            <li><a href="/api/health">/api/health</a> - Health check</li>
                            <li><a href="/api/analysis">/api/analysis</a> - Austrian cycle analysis</li>
                            <li><a href="/api/market-data">/api/market-data</a> - Market data</li>
                            <li><a href="/api/three-pillars">/api/three-pillars</a> - Three Pillars analysis</li>
                            <li><a href="/api/bitcoin-price">/api/bitcoin-price</a> - Bitcoin price</li>
                            <li><a href="/api/blockchain-stats">/api/blockchain-stats</a> - Blockchain statistics</li>
                            <li><a href="/api/stock-markets">/api/stock-markets</a> - Stock market data</li>
                            <li><a href="/api/austrian-insights">/api/austrian-insights</a> - Austrian insights</li>
                            <li><a href="/api/situation-overview">/api/situation-overview</a> - Situation overview</li>
                            <li><a href="/api/explanations">/api/explanations</a> - Metric explanations</li>
                            <li><a href="/api/thought-leaders">/api/thought-leaders</a> - Austrian economists</li>
                            <li><a href="/metrics">/metrics</a> - Prometheus metrics</li>
                        </ul>
                        <h3>Frontend Options:</h3>
                        <p>To use the full React dashboard:</p>
                        <ol>
                            <li>Build the frontend: <code>cd packages/frontend && npm run build</code></li>
                            <li>Restart the server</li>
                        </ol>
                        <p>Or use the working HTML template at <code>templates/dashboard_working.html</code></p>
                        <hr>
                        <p><small>Version: """ + PROJECT_VERSION + """ | Mode: """ + ("Live" if self.fred_api_key else "Demo") + """</small></p>
                    </body>
                    </html>
                    """, 200

        @app.route("/api/status")
        def api_status():
            """
            API endpoint for dashboard status.
            """
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "status": "operational",
                "version": PROJECT_VERSION,
                "timestamp": self._timestamp(),
                "austrian_monitor": {
                    "active": self.monitor_active,
                    "version": PROJECT_VERSION,
                },
                "monitoring": self.monitor_active,
                "monitor_active": self.monitor_active,
                "metrics": self.metrics,
            })

        @app.route("/api/health")
        def api_health():
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "ok": True,
                "ts": self._timestamp(),
                "austrian_monitor": {
                    "active": self.monitor_active,
                    "status": "operational" if self.monitor_active else "idle",
                },
            })

        @app.route("/api/meta")
        def api_meta():
            """OpenAPI metadata endpoint"""
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "version": PROJECT_VERSION,
                "title": "Austrian Business Cycle Monitor API",
                "description": "Real-time Austrian economics monitoring and analysis",
            })

        @app.route("/api/openapi.json")
        def api_openapi():
            """OpenAPI specification endpoint"""
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "openapi": "3.0.0",
                "info": {
                    "title": "Austrian Business Cycle Monitor API",
                    "version": PROJECT_VERSION,
                },
                "paths": {
                    "/api/status": {
                        "get": {
                            "summary": "Get system status",
                            "responses": {"200": {"description": "OK"}},
                        }
                    },
                    "/api/health": {
                        "get": {
                            "summary": "Health check",
                            "responses": {"200": {"description": "OK"}},
                        }
                    },
                    "/api/market-data": {
                        "get": {
                            "summary": "Get market data",
                            "responses": {"200": {"description": "OK"}},
                        }
                    },
                },
            })

        @app.route("/api/current-data")
        def api_current_data():
            """Combined current data endpoint"""
            self.metrics["requests_2xx"] += 1
            market_data = self.monitor.get_market_data()
            return jsonify({
                "success": True,
                "data": {
                    "status": "operational",
                    "market_data": market_data,
                    "timestamp": self._timestamp(),
                },
            })

        @app.route("/api/refresh", methods=["POST"])
        def api_refresh():
            """Refresh monitoring data"""
            try:
                import time
                self._last_full_refresh = time.time()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "success": True,
                    "refreshed": True,
                    "timestamp": self._timestamp(),
                })
            except Exception as e:
                logger.error(f"Refresh error: {e}")
                return jsonify({"error": "Could not refresh data"}), 503

        @app.route("/api/live-assets")
        def api_live_assets():
            """Live asset tracking endpoint"""
            try:
                prices = self.asset_tracker.get_latest_prices()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "success": True,
                    "data": {
                        "assets": prices,
                    },
                    "timestamp": self._timestamp(),
                })
            except Exception as e:
                logger.error(f"Live assets error: {e}")
                return jsonify({"error": "Could not fetch live assets"}), 500

        @app.route("/api/live-snapshot")
        def api_live_snapshot():
            """Live snapshot of all tracked data"""
            try:
                prices = self.asset_tracker.get_latest_prices()
                market_data = self.monitor.get_market_data()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "success": True,
                    "data": {
                        **prices,  # Flatten bitcoin, ethereum, etc. at top level
                        "market": market_data,
                        "timestamp": self._timestamp(),
                    },
                })
            except Exception as e:
                logger.error(f"Live snapshot error: {e}")
                return jsonify({"error": "Could not fetch live snapshot"}), 500


        @app.route("/api/analysis")
        def api_analysis():
            data = self.monitor.run_analysis()
            self.metrics["analysis_runs"] += 1
            self.metrics["requests_2xx"] += 1
            return jsonify({"analysis": data, "generated_at": self._timestamp()})

        @app.route("/api/explanations")
        def api_explanations():
            """Provide detailed explanations and primary sources for UI tooltips/popovers."""
            try:
                catalog = self.monitor.get_explanations()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "success": True,
                    "explanations": catalog,
                    "timestamp": self._timestamp(),
                    "version": PROJECT_VERSION,
                })
            except Exception as e:
                logger.error(f"Explanations API error: {e}")
                return jsonify({"error": "Could not load explanations"}), 500

        @app.route("/api/thought-leaders")
        def api_thought_leaders():
            """Provide comprehensive catalog of Austrian economists and Bitcoin thought leaders."""
            try:
                leaders = self.monitor.get_thought_leaders()
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "success": True,
                    "thought_leaders": leaders,
                    "timestamp": self._timestamp(),
                    "version": PROJECT_VERSION,
                    "count": len(leaders),
                })
            except Exception as e:
                logger.error(f"Thought leaders API error: {e}")
                return jsonify({"error": "Could not load thought leaders"}), 500

        @app.route("/api/data-manifest")
        def api_data_manifest():
            """Expose a concise manifest of API data schema and provenance availability for verifiability."""
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "version": PROJECT_VERSION,
                "timestamp": self._timestamp(),
                "endpoints": [
                    {"path": "/api/analysis", "keys": ["timestamp","cycle_position","monetary_metrics","indicators","risk_levels","austrian_score","explanations","provenance"]},
                    {"path": "/api/three-pillars", "keys": ["monetary_policy","credit_markets","real_economy","explanations","provenance"]},
                    {"path": "/api/market-data", "keys": ["interest_rates","yield_curve","commodities","bitcoin","economic_indicators"]},
                    {"path": "/api/explanations", "keys": ["explanations"]},
                    {"path": "/api/thought-leaders", "keys": ["thought_leaders"]},
                ],
            })

        @app.route("/api/market-data")
        def api_market_data():
            data = self.monitor.get_market_data()
            self.metrics["requests_2xx"] += 1
            return jsonify({
                "success": True,
                "data": data,
                "market_data": data,
                "generated_at": self._timestamp(),
            })

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
                "success": True,
                "data": {
                    "symbol": "BTC",
                    "price": btc.get("price"),
                    "source": btc.get("source"),
                    "timestamp": self._timestamp(),
                },
                "symbol": "BTC",
                "price": btc.get("price"),
                "source": btc.get("source"),
                "timestamp": self._timestamp(),
            })

        @app.route("/api/blockchain-stats")
        def api_blockchain_stats():
            """Real-time blockchain statistics endpoint"""
            try:
                stats = self.blockchain_tracker.get_blockchain_stats()
                self.metrics["requests_2xx"] += 1
                return jsonify(stats)
            except Exception as e:
                logger.error(f"Blockchain stats API error: {e}")
                return jsonify({"error": "Could not fetch blockchain stats"}), 500

        @app.route("/api/difficulty-adjustment")
        def api_difficulty_adjustment():
            """Difficulty adjustment info endpoint"""
            try:
                info = self.blockchain_tracker.get_difficulty_adjustment_info()
                self.metrics["requests_2xx"] += 1
                return jsonify(info)
            except Exception as e:
                logger.error(f"Difficulty adjustment API error: {e}")
                return jsonify({"error": "Could not fetch difficulty info"}), 500

        @app.route("/api/stock-markets")
        def api_stock_markets():
            """Stock market indices with Austrian analysis endpoint"""
            try:
                stocks = self.stock_tracker.get_stock_markets()
                self.metrics["requests_2xx"] += 1
                return jsonify(stocks)
            except Exception as e:
                logger.error(f"Stock markets API error: {e}")
                return jsonify({"error": "Could not fetch stock market data"}), 500

        @app.route("/api/start-monitoring", methods=["POST"])
        def api_start():
            self.monitor_active = True
            return jsonify({
                "success": True,
                "started": True,
                "timestamp": self._timestamp(),
            })

        @app.route("/api/stop-monitoring", methods=["POST"])
        def api_stop():
            self.monitor_active = False
            return jsonify({
                "success": True,
                "stopped": True,
                "timestamp": self._timestamp(),
            })

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

        @app.route("/api/austrian-insights")
        def api_austrian_insights():
            """
            Get rich, context-aware Austrian economic insights for current market conditions.
            Integrates wisdom from classical and modern Austrian economists.
            """
            try:
                from apps.core.austrian_insights import get_insights_engine, CyclePhase, RiskLevel
                
                # Get current market data
                market = self.monitor.get_market_data()
                analysis = self.monitor.analyze()
                
                # Initialize insights engine
                engine = get_insights_engine()
                
                # Determine cycle phase
                cycle_phase_map = {
                    "early-expansion": CyclePhase.EARLY_EXPANSION,
                    "mid-expansion": CyclePhase.MID_EXPANSION,
                    "late-boom": CyclePhase.LATE_BOOM,
                    "crisis": CyclePhase.CRISIS,
                    "liquidation": CyclePhase.LIQUIDATION,
                    "recovery": CyclePhase.RECOVERY
                }
                cycle_phase = cycle_phase_map.get(analysis.cycle_phase, CyclePhase.MID_EXPANSION)
                
                # Determine risk level
                risk = analysis.overall_risk
                if risk < 3:
                    risk_level = RiskLevel.LOW
                elif risk < 5:
                    risk_level = RiskLevel.MODERATE
                elif risk < 7:
                    risk_level = RiskLevel.ELEVATED
                elif risk < 9:
                    risk_level = RiskLevel.HIGH
                else:
                    risk_level = RiskLevel.EXTREME
                
                # Get insights for different categories
                bitcoin_insights = engine.get_bitcoin_insights(
                    market['bitcoin']['price'],
                    cycle_phase,
                    risk_level
                )
                
                gold_silver_insights = engine.get_gold_silver_insights(
                    market['commodities']['gold'],
                    market['commodities']['silver'],
                    market['commodities']['gold'] / market['commodities']['silver'],
                    risk_level
                )
                
                interest_rate_insights = engine.get_interest_rate_insights(
                    market['interest_rates']['fed_funds'],
                    market['interest_rates']['natural_rate_estimate'],
                    market['interest_rates']['natural_rate_estimate'] - market['interest_rates']['fed_funds'],
                    cycle_phase
                )
                
                # Get stock market data
                stocks = None
                try:
                    stocks = self.stock_tracker.get_stock_markets()
                    stock_insights = engine.get_stock_market_insights(
                        stocks['indices']['sp500'],
                        stocks['indices']['nasdaq'],
                        stocks['volatility']['vix'],
                        cycle_phase,
                        stocks['austrian_analysis'].get('boom_psychology', False)
                    )
                except:
                    stock_insights = []
                
                inflation_insights = engine.get_inflation_insights(
                    market['economic_indicators']['cpi'],
                    market['economic_indicators']['ppi'],
                    7.2,  # M2 growth estimate
                    risk_level
                )
                
                commodity_insights = engine.get_commodity_insights(
                    market['commodities']['oil'],
                    market['commodities']['copper'],
                    cycle_phase
                )
                
                # Get comprehensive cycle narrative
                cycle_narrative = engine.get_cycle_narrative(
                    cycle_phase,
                    risk,
                    {
                        'vix': stocks['volatility']['vix'] if stocks else 17.0,
                        'spread': market['interest_rates']['natural_rate_estimate'] - market['interest_rates']['fed_funds'],
                        'm2_growth': 7.2,
                        'credit_gdp': 330.5,
                        'fed_funds': market['interest_rates']['fed_funds'],
                        'yield_curve_inverted': market['yield_curve']['inverted']
                    }
                )
                
                # Serialize insights
                def serialize_insight(insight):
                    return {
                        'title': insight.title,
                        'content': insight.content,
                        'economist': insight.economist,
                        'source': insight.source,
                        'relevance_score': insight.relevance_score,
                        'tags': insight.tags
                    }
                
                self.metrics["requests_2xx"] += 1
                return jsonify({
                    "timestamp": datetime.now(UTC).isoformat(),
                    "cycle_phase": analysis.cycle_phase,
                    "overall_risk": risk,
                    "risk_level": risk_level.value,
                    "cycle_narrative": cycle_narrative,
                    "insights": {
                        "bitcoin": [serialize_insight(i) for i in bitcoin_insights],
                        "gold_silver": [serialize_insight(i) for i in gold_silver_insights],
                        "interest_rates": [serialize_insight(i) for i in interest_rate_insights],
                        "stock_markets": [serialize_insight(i) for i in stock_insights],
                        "inflation": [serialize_insight(i) for i in inflation_insights],
                        "commodities": [serialize_insight(i) for i in commodity_insights]
                    },
                    "economists_referenced": {
                        "classical": list(engine.classical_economists.keys()),
                        "modern": list(engine.modern_voices.keys())
                    }
                })
            except Exception as e:
                logger.error(f"Austrian insights API error: {e}", exc_info=True)
                return jsonify({"error": "Could not generate Austrian insights"}), 500

        # ===================================================================
        # DYNAMIC CONTENT ENDPOINTS
        # ===================================================================
        
        @app.route("/api/situation-overview")
        def situation_overview():
            """
            Get comprehensive situation overview with AI-generated insights.
            This is the main "What's happening now?" panel.
            """
            try:
                # Gather all current metrics
                # Use cached dashboard data
                dashboard_data = get_dashboard_snapshot(use_cache=True, cache_ttl=60)
                analysis_result = dashboard_data.get("austrian_analysis", {})
                market = dashboard_data.get("market_data", {})
                
                # Combine into unified metrics dict
                metrics = {
                    "austrian_score": analysis_result.get("austrian_score", 5.0),
                    "m2_growth_rate": analysis_result.get("monetary_metrics", {}).get("m2_growth_yoy", 5.0),
                    "credit_growth": analysis_result.get("credit_metrics", {}).get("total_credit_growth_yoy", 5.0),
                    "malinvestment_index": analysis_result.get("indicators", {}).get("malinvestment_index", 5.0),
                    "vix": market.get("volatility", {}).get("vix", 15.0),
                    "fed_funds_rate": market.get("interest_rates", {}).get("fed_funds", 5.0),
                    "natural_rate_estimate": market.get("interest_rates", {}).get("natural_rate_estimate", 4.0),
                    "yield_curve_spread": market.get("interest_rates", {}).get("yield_curve_10y2y", 1.0),
                    "unemployment_rate": analysis_result.get("real_economy_metrics", {}).get("unemployment_rate", 5.0),
                    "cpi_inflation": analysis_result.get("monetary_metrics", {}).get("cpi_yoy", 3.0),
                }
                
                # Generate dynamic content
                content_engine = get_content_engine()
                overview = content_engine.generate_situation_overview(metrics)
                
                return jsonify(overview)
            except Exception as e:
                logger.error(f"Situation overview error: {e}", exc_info=True)
                return jsonify({"error": "Could not generate situation overview"}), 500
        
        @app.route("/api/metric-tooltip/<metric_key>")
        def metric_tooltip(metric_key: str):
            """
            Get rich tooltip content for any metric.
            Returns: current value, interpretation, Austrian theory, related metrics, sources
            """
            try:
                # Gather all current metrics
                dashboard_data = get_dashboard_snapshot(use_cache=True, cache_ttl=60)
                analysis_result = dashboard_data.get("austrian_analysis", {})
                market = dashboard_data.get("market_data", {})
                
                # Get current value for requested metric
                all_metrics = {
                    "austrian_score": analysis_result.get("austrian_score", 5.0),
                    "m2_growth_rate": analysis_result.get("monetary_metrics", {}).get("m2_growth_yoy", 5.0),
                    "credit_growth": analysis_result.get("credit_metrics", {}).get("total_credit_growth_yoy", 5.0),
                    "malinvestment_index": analysis_result.get("indicators", {}).get("malinvestment_index", 5.0),
                    "vix": market.get("volatility", {}).get("vix", 15.0),
                    "fed_funds_rate": market.get("interest_rates", {}).get("fed_funds", 5.0),
                    "natural_rate_estimate": market.get("interest_rates", {}).get("natural_rate_estimate", 4.0),
                    "yield_curve_spread": market.get("interest_rates", {}).get("yield_curve_10y2y", 1.0),
                }
                
                current_value = all_metrics.get(metric_key, 0.0)
                
                # Generate tooltip content
                content_engine = get_content_engine()
                tooltip = content_engine.generate_metric_tooltip(metric_key, current_value, all_metrics)
                
                return jsonify(tooltip)
            except Exception as e:
                logger.error(f"Metric tooltip error for {metric_key}: {e}", exc_info=True)
                return jsonify({"error": f"Could not generate tooltip for {metric_key}"}), 500
        
        @app.route("/api/chart-annotations/<chart_type>")
        def chart_annotations(chart_type: str):
            """
            Get dynamic annotations for charts based on current data.
            Chart types: credit_growth, malinvestment_radar, austrian_score, three_pillars, asset_correlation
            """
            try:
                # Gather metrics
                dashboard_data = get_dashboard_snapshot(use_cache=True, cache_ttl=60)
                analysis_result = dashboard_data.get("austrian_analysis", {})
                
                all_metrics = {
                    "austrian_score": analysis_result.get("austrian_score", 5.0),
                    "credit_growth": analysis_result.get("credit_metrics", {}).get("total_credit_growth_yoy", 5.0),
                    "malinvestment_index": analysis_result.get("indicators", {}).get("malinvestment_index", 5.0),
                }
                
                # Generate annotations
                content_engine = get_content_engine()
                annotations = content_engine.generate_chart_annotations(chart_type, analysis_result, all_metrics)
                
                return jsonify({"annotations": annotations})
            except Exception as e:
                logger.error(f"Chart annotations error for {chart_type}: {e}", exc_info=True)
                return jsonify({"error": f"Could not generate annotations for {chart_type}"}), 500

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
            self.socketio.run(self.app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)
        else:
            self.app.run(host=host, port=port, debug=debug)


def create_app() -> Flask:
    """Factory used by WSGI servers."""
    dashboard = AustrianDashboard()
    return dashboard.app


if __name__ == "__main__":
    logger.info(f"Starting dashboard on {DASHBOARD_HOST}:{DASHBOARD_PORT}")
    AustrianDashboard().run()
