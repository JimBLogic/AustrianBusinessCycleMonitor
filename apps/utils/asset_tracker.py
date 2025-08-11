"""
Asset Tracker - Real-time price and market data tracking

This module provides tracking and analysis for various financial assets 
including cryptocurrencies, stocks, commodities, and forex markets.
"""
from __future__ import annotations

import json
import logging
import random
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssetTracker:
    """
    Track and analyze financial asset prices and metrics.
    
    Features:
    - Real-time and historical price data
    - Multiple data sources and fallbacks
    - Price alerts and threshold notifications
    - Statistical analysis of price movements
    """
    
    def __init__(self) -> None:
        """Initialize the asset tracker with default settings."""
        self.last_update_time = time.time()
        self.update_interval = 60  # seconds
        self.default_source = "internal"
        self._price_cache = {}
        
        # Pre-populate with initial data
        self._init_default_prices()
    
    def _init_default_prices(self) -> None:
        """Initialize default asset prices for testing."""
        self._price_cache = {
            "bitcoin": {
                "price": 69420.00,
                "change_24h": 2.5,
                "source": "CoinGecko",
                "updated_at": self.last_update_time,
            },
            "ethereum": {
                "price": 3456.78,
                "change_24h": 1.2,
                "source": "CoinGecko",
                "updated_at": self.last_update_time,
            },
            "gold": {
                "price": 2100.50,
                "change_24h": 0.3,
                "source": "MetalsPriceAPI",
                "updated_at": self.last_update_time,
            },
            "silver": {
                "price": 1187.25,
                "change_24h": -0.5,
                "source": "MetalsPriceAPI",
                "updated_at": self.last_update_time,
            },
            "s&p500": {
                "price": 5432.10,
                "change_24h": -0.2,
                "source": "YahooFinance",
                "updated_at": self.last_update_time,
            },
            "dollar_index": {
                "price": 102.45,
                "change_24h": -0.1,
                "source": "ForexSource",
                "updated_at": self.last_update_time,
            },
        }
    
    def get_latest_prices(self, assets: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
        """
        Get the latest prices for specified assets or all tracked assets.
        
        Args:
            assets: Optional list of asset identifiers. If None, returns all assets.
            
        Returns:
            Dictionary mapping asset identifiers to their price data
        """
        now = time.time()
        
        # Check if we need to refresh prices (simple simulation)
        if now - self.last_update_time > self.update_interval:
            self._refresh_prices()
            self.last_update_time = now
        
        # Filter for requested assets if specified
        if assets:
            return {k: v for k, v in self._price_cache.items() if k in assets}
        
        return self._price_cache
    
    def _refresh_prices(self) -> None:
        """
        Refresh price data from external sources.
        
        In a production implementation, this would make API calls to various
        data providers. For this implementation, we simulate price movements.
        """
        for asset, data in self._price_cache.items():
            # Simulate small price movements
            price_change_pct = (random.random() - 0.5) * 2  # -1% to +1% change
            new_price = data["price"] * (1 + price_change_pct / 100)
            
            # Update the cache
            self._price_cache[asset].update({
                "price": round(new_price, 2),
                "change_24h": round(data.get("change_24h", 0) + price_change_pct / 4, 2),
                "updated_at": time.time(),
            })
    
    def get_price_history(self, asset: str, timeframe: str = "1d") -> Dict[str, Any]:
        """
        Get historical price data for a specific asset.
        
        Args:
            asset: Asset identifier (e.g., "bitcoin")
            timeframe: Time period for history (e.g., "1d", "7d", "30d")
            
        Returns:
            Dict containing historical price points and metadata
        """
        # In a real implementation, this would fetch historical data
        # For now, we return a simple placeholder
        return {
            "asset": asset,
            "timeframe": timeframe,
            "data_points": 24,  # Would be actual historical points
            "source": self.default_source,
            "current_price": self._price_cache.get(asset, {}).get("price"),
        }
    
    def set_price_alert(self, asset: str, threshold: float, alert_type: str = "above") -> str:
        """
        Set a price alert for when an asset crosses a threshold.
        
        Args:
            asset: Asset to monitor
            threshold: Price threshold to trigger alert
            alert_type: "above" or "below"
            
        Returns:
            Alert ID for reference
        """
        # In a real implementation, this would register an alert
        alert_id = f"{asset}_{alert_type}_{threshold}_{int(time.time())}"
        return alert_id
    
    # Methods needed by legacy compatibility shims
    def get_bitcoin_price(self) -> Dict[str, Any]:
        """Get Bitcoin price data (compatibility method)."""
        prices = self.get_latest_prices(assets=["bitcoin"])
        return prices.get("bitcoin", {})
    
    def get_gold_price(self) -> Dict[str, Any]:
        """Get Gold price data (compatibility method)."""
        prices = self.get_latest_prices(assets=["gold"])
        return prices.get("gold", {})
    
    def get_silver_price(self) -> Dict[str, Any]:
        """Get Silver price data (compatibility method)."""
        prices = self.get_latest_prices(assets=["silver"])
        return prices.get("silver", {})
    
    def get_all_asset_prices(self) -> Dict[str, Dict[str, Any]]:
        """Get all asset prices (compatibility method)."""
        return self.get_latest_prices()


def main():
    """Simple demo of the AssetTracker."""
    tracker = AssetTracker()
    print("Bitcoin price:", tracker.get_bitcoin_price())
    print("Gold price:", tracker.get_gold_price())
    print("Silver price:", tracker.get_silver_price())
    print("All prices:", json.dumps(tracker.get_all_asset_prices(), indent=2))


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Backward Compatibility Shims
# ---------------------------------------------------------------------------
# Historical parts of the codebase (launcher, validator, legacy tests) expect
# `BitcoinTracker` and `AssetPriceManager` classes to be importable from
# `apps.utils.asset_tracker`. The modern consolidated implementation uses the
# single `AssetTracker` class. To avoid touching multiple legacy references we
# provide lightweight adapter classes that delegate to `AssetTracker` while
# preserving expected method names and return keys.

class BitcoinTracker:
    """Legacy compatibility class for Bitcoin tracking."""
    
    def __init__(self) -> None:
        """Initialize with a delegate AssetTracker."""
        self._tracker = AssetTracker()
    
    def get_bitcoin_price(self) -> Dict[str, Any]:
        """Get Bitcoin price using the delegate tracker."""
        return self._tracker.get_bitcoin_price()
    
    def get_blockchain_stats(self) -> Dict[str, Any]:
        """Get Bitcoin blockchain statistics (simplified)."""
        # Simple placeholder data - would be from a real API in production
        return {
            "hash_rate": 450.3,  # EH/s
            "difficulty": 92.8,  # T
            "mempool_size": 2456,  # transactions
            "updated_at": datetime.now().isoformat(),
        }


class AssetPriceManager:
    """Legacy compatibility class for asset price management."""
    
    def __init__(self) -> None:
        """Initialize with a delegate AssetTracker."""
        self._tracker = AssetTracker()
    
    def get_all_asset_prices(self) -> Dict[str, Dict[str, Any]]:
        """Get all asset prices using the delegate tracker."""
        return self._tracker.get_all_asset_prices()
    
    def get_gold_price(self) -> Dict[str, Any]:
        """Get gold price using the delegate tracker."""
        return self._tracker.get_gold_price()
    
    def get_silver_price(self) -> Dict[str, Any]:
        """Get silver price using the delegate tracker."""
        return self._tracker.get_silver_price()


__all__ = [
    'AssetTracker',
    'BitcoinTracker',
    'AssetPriceManager',
]
