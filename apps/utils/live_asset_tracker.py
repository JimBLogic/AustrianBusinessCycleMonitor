"""
Real-time Asset Tracker with Live API Integration
Supports: CoinGecko (Bitcoin, Gold), FRED (Economics)
"""
from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime
from typing import Dict, Any, Optional, List
import requests

logger = logging.getLogger(__name__)


class LiveAssetTracker:
    """
    Real-time asset price tracker with live API integration.
    
    Supported APIs:
    - CoinGecko (free, no API key) - Bitcoin, Ethereum, Gold
    - FRED API (free, requires key) - Economic data
    - Fallback to demo data if APIs unavailable
    """
    
    def __init__(self) -> None:
        """Initialize with API configurations."""
        self.last_update_time = 0  # Force refresh on first call
        self.update_interval = 30  # Refresh every 30 seconds
        self._price_cache = {}
        
        # API configurations
        self.coingecko_base_url = "https://api.coingecko.com/api/v3"
        
        # Initialize cache
        self._init_cache()
    
    def _init_cache(self) -> None:
        """Initialize cache with default values."""
        self._price_cache = {
            "bitcoin": {
                "price": 0.0,
                "change_24h": 0.0,
                "source": "Demo",
                "updated_at": 0,
            },
            "ethereum": {
                "price": 0.0,
                "change_24h": 0.0,
                "source": "Demo",
                "updated_at": 0,
            },
            "gold": {
                "price": 0.0,
                "change_24h": 0.0,
                "source": "Demo",
                "updated_at": 0,
            },
            "silver": {
                "price": 0.0,
                "change_24h": 0.0,
                "source": "Demo",
                "updated_at": 0,
            },
        }
    
    def get_latest_prices(self, assets: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
        """
        Get latest prices, fetching from APIs if cache is stale.
        
        Args:
            assets: Optional list of specific assets
            
        Returns:
            Dict of asset prices
        """
        now = time.time()
        
        # Refresh if cache is stale
        if now - self.last_update_time > self.update_interval:
            self._refresh_all_prices()
            self.last_update_time = now
        
        # Filter for requested assets
        if assets:
            return {k: v for k, v in self._price_cache.items() if k in assets}
        
        return self._price_cache
    
    def _refresh_all_prices(self) -> None:
        """Refresh all asset prices from APIs."""
        # Fetch all prices from CoinGecko (free, no API key needed)
        self._fetch_coingecko_prices()
    
    def _fetch_coingecko_prices(self) -> None:
        """
        Fetch Bitcoin, Ethereum, Gold, and Silver prices from CoinGecko (FREE, no API key needed).
        
        API Docs: https://www.coingecko.com/en/api/documentation
        """
        try:
            # CoinGecko free API - no authentication required
            # Using "tether-gold" (XAUT) - most accurate spot gold price tracker
            # Using "silver-token" (SLVT) - silver-backed token for spot price
            url = f"{self.coingecko_base_url}/simple/price"
            params = {
                "ids": "bitcoin,ethereum,tether-gold,silver-token",
                "vs_currencies": "usd",
                "include_24hr_change": "true"
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Update Bitcoin
            if "bitcoin" in data:
                self._price_cache["bitcoin"] = {
                    "price": round(data["bitcoin"]["usd"], 2),
                    "change_24h": round(data["bitcoin"].get("usd_24h_change", 0), 2),
                    "source": "CoinGecko",
                    "updated_at": time.time(),
                }
                logger.info(f"✅ Bitcoin price updated: ${data['bitcoin']['usd']:,.2f}")
            
            # Update Ethereum
            if "ethereum" in data:
                self._price_cache["ethereum"] = {
                    "price": round(data["ethereum"]["usd"], 2),
                    "change_24h": round(data["ethereum"].get("usd_24h_change", 0), 2),
                    "source": "CoinGecko",
                    "updated_at": time.time(),
                }
                logger.info(f"✅ Ethereum price updated: ${data['ethereum']['usd']:,.2f}")
            
            # Update Gold (Tether Gold XAUT - 1 token = 1 troy oz of gold)
            if "tether-gold" in data:
                self._price_cache["gold"] = {
                    "price": round(data["tether-gold"]["usd"], 2),
                    "change_24h": round(data["tether-gold"].get("usd_24h_change", 0), 2),
                    "source": "CoinGecko",
                    "updated_at": time.time(),
                }
                logger.info(f"✅ Gold price updated: ${data['tether-gold']['usd']:,.2f}/oz")
            
            # Update Silver (Silver Token SLVT - silver-backed token for spot price)
            if "silver-token" in data:
                self._price_cache["silver"] = {
                    "price": round(data["silver-token"]["usd"], 2),
                    "change_24h": round(data["silver-token"].get("usd_24h_change", 0), 2),
                    "source": "CoinGecko",
                    "updated_at": time.time(),
                }
                logger.info(f"✅ Silver price updated: ${data['silver-token']['usd']:,.2f}/oz")
                
        except Exception as e:
            logger.error(f"❌ CoinGecko API error: {e}")
            self._fallback_prices()
    
    def _fallback_prices(self) -> None:
        """Fallback to reasonable default prices if API fails."""
        import random
        
        # Use last known price or reasonable defaults
        if self._price_cache["bitcoin"]["price"] == 0:
            self._price_cache["bitcoin"] = {
                "price": 68000.0 + random.uniform(-2000, 2000),
                "change_24h": random.uniform(-3, 3),
                "source": "Demo (API Failed)",
                "updated_at": time.time(),
            }
        
        if self._price_cache["ethereum"]["price"] == 0:
            self._price_cache["ethereum"] = {
                "price": 3400.0 + random.uniform(-100, 100),
                "change_24h": random.uniform(-3, 3),
                "source": "Demo (API Failed)",
                "updated_at": time.time(),
            }
        
        if self._price_cache["gold"]["price"] == 0:
            self._price_cache["gold"] = {
                "price": 2050.0 + random.uniform(-20, 20),
                "change_24h": random.uniform(-0.5, 0.5),
                "source": "Demo (API Failed)",
                "updated_at": time.time(),
            }
        
        if self._price_cache["silver"]["price"] == 0:
            self._price_cache["silver"] = {
                "price": 32.0 + random.uniform(-1, 1),
                "change_24h": random.uniform(-1, 1),
                "source": "Demo (API Failed)",
                "updated_at": time.time(),
            }
    
    # Compatibility methods
    def get_bitcoin_price(self) -> Dict[str, Any]:
        """Get Bitcoin price."""
        prices = self.get_latest_prices(assets=["bitcoin"])
        return prices.get("bitcoin", {})
    
    def get_gold_price(self) -> Dict[str, Any]:
        """Get Gold price."""
        prices = self.get_latest_prices(assets=["gold"])
        return prices.get("gold", {})
    
    def get_silver_price(self) -> Dict[str, Any]:
        """Get Silver price."""
        prices = self.get_latest_prices(assets=["silver"])
        return prices.get("silver", {})
    
    def get_all_asset_prices(self) -> Dict[str, Dict[str, Any]]:
        """Get all asset prices."""
        return self.get_latest_prices()


# For backward compatibility, make this the default
AssetTracker = LiveAssetTracker
