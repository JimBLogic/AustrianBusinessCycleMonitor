"""Live asset prices with explicit provider and freshness metadata.

The tracker never fabricates market prices. When CoinGecko is unavailable it
preserves a previously validated observation as stale, or reports the asset as
unavailable when no valid observation has been collected yet.
"""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class LiveAssetTracker:
    """Track selected assets through CoinGecko with a short in-memory cache."""

    _COINGECKO_IDS = {
        "bitcoin": ("bitcoin", "CoinGecko", "crypto_spot_reference"),
        "ethereum": ("ethereum", "CoinGecko", "crypto_spot_reference"),
        "gold": ("tether-gold", "CoinGecko (Tether Gold/XAUT)", "token_proxy"),
        "silver": ("silver-token", "CoinGecko (Silver Token/SLVT)", "token_proxy"),
    }

    def __init__(self, session: Optional[requests.Session] = None) -> None:
        self.last_update_time = 0.0
        self.update_interval = 30
        self.coingecko_base_url = "https://api.coingecko.com/api/v3"
        self.session = session or requests.Session()
        self._price_cache: Dict[str, Dict[str, Any]] = {}
        self._init_cache()

    def _init_cache(self) -> None:
        """Initialize every asset as unavailable rather than with a fake quote."""
        self._price_cache = {
            asset: {
                "price": 0.0,
                "change_24h": 0.0,
                "source": source,
                "instrument_type": instrument_type,
                "status": "unavailable",
                "updated_at": None,
                "last_attempt_at": None,
                "is_last_known_good": False,
                "error": None,
            }
            for asset, (_, source, instrument_type) in self._COINGECKO_IDS.items()
        }

    def get_latest_prices(
        self, assets: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """Return cached prices, refreshing them when the cache is stale."""
        now = time.time()
        if now - self.last_update_time > self.update_interval:
            self._refresh_all_prices()
            self.last_update_time = now

        selected = self._price_cache
        if assets:
            selected = {key: value for key, value in selected.items() if key in assets}

        # Do not expose mutable internal cache dictionaries to callers.
        return {key: dict(value) for key, value in selected.items()}

    def _refresh_all_prices(self) -> None:
        self._fetch_coingecko_prices()

    def _fetch_coingecko_prices(self) -> None:
        """Fetch all configured instruments in one documented CoinGecko call."""
        attempted_at = time.time()
        url = f"{self.coingecko_base_url}/simple/price"
        params = {
            "ids": ",".join(item[0] for item in self._COINGECKO_IDS.values()),
            "vs_currencies": "usd",
            "include_24hr_change": "true",
            "include_last_updated_at": "true",
        }

        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, dict):
                raise ValueError("CoinGecko returned a non-object response")

            for asset, (provider_id, source, instrument_type) in self._COINGECKO_IDS.items():
                provider_payload = payload.get(provider_id)
                price = provider_payload.get("usd") if isinstance(provider_payload, dict) else None

                if not isinstance(price, (int, float)) or price <= 0:
                    self._mark_asset_unavailable(
                        asset,
                        attempted_at,
                        f"CoinGecko response did not contain a valid {provider_id} USD price",
                    )
                    continue

                change = provider_payload.get("usd_24h_change", 0.0)
                if not isinstance(change, (int, float)):
                    change = 0.0

                provider_updated_at = provider_payload.get("last_updated_at", attempted_at)
                if not isinstance(provider_updated_at, (int, float)):
                    provider_updated_at = attempted_at

                self._price_cache[asset] = {
                    "price": round(float(price), 2),
                    "change_24h": round(float(change), 2),
                    "source": source,
                    "instrument_type": instrument_type,
                    "status": "live",
                    "updated_at": float(provider_updated_at),
                    "last_attempt_at": attempted_at,
                    "is_last_known_good": False,
                    "error": None,
                }

            logger.info("CoinGecko asset refresh completed")
        except (requests.RequestException, ValueError, TypeError) as exc:
            logger.warning("CoinGecko asset refresh failed: %s", exc)
            self._mark_all_assets_unavailable(attempted_at, str(exc))

    def _mark_asset_unavailable(
        self, asset: str, attempted_at: float, error: str
    ) -> None:
        current = self._price_cache[asset]
        has_known_good = bool(current.get("price", 0) and current.get("updated_at"))
        current["status"] = "stale" if has_known_good else "unavailable"
        current["last_attempt_at"] = attempted_at
        current["is_last_known_good"] = has_known_good
        current["error"] = error

    def _mark_all_assets_unavailable(self, attempted_at: float, error: str) -> None:
        for asset in self._price_cache:
            self._mark_asset_unavailable(asset, attempted_at, error)

    def get_bitcoin_price(self) -> Dict[str, Any]:
        return self.get_latest_prices(assets=["bitcoin"]).get("bitcoin", {})

    def get_gold_price(self) -> Dict[str, Any]:
        return self.get_latest_prices(assets=["gold"]).get("gold", {})

    def get_silver_price(self) -> Dict[str, Any]:
        return self.get_latest_prices(assets=["silver"]).get("silver", {})

    def get_all_asset_prices(self) -> Dict[str, Dict[str, Any]]:
        return self.get_latest_prices()


AssetTracker = LiveAssetTracker
