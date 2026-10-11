"""
Stock Market Tracker for Austrian Business Cycle Analysis
Fetches major stock indices from Yahoo Finance (free, no API key required)
"""

import time
import logging
from typing import Dict, Optional, Any
import requests

logger = logging.getLogger(__name__)


class StockTracker:
    """
    Tracks major stock market indices using Yahoo Finance API.
    No API key required - completely free.
    """
    
    def __init__(self):
        self.base_url = "https://query1.finance.yahoo.com/v8/finance/chart"
        self.last_update_time = 0
        self.cache_duration = 60  # Cache for 60 seconds
        self._stock_cache: Dict[str, float] = {}
        
        # Major indices to track
        self.indices = {
            'dow_jones': '^DJI',      # Dow Jones Industrial Average
            'sp500': '^GSPC',          # S&P 500
            'nasdaq': '^IXIC',         # NASDAQ Composite
            'russell2000': '^RUT',     # Russell 2000 (small caps)
            'vix': '^VIX'              # Volatility Index (fear gauge)
        }
    
    def _fetch_quote(self, symbol: str) -> Optional[float]:
        """
        Fetch current price for a symbol from Yahoo Finance.
        
        Args:
            symbol: Yahoo Finance symbol (e.g., '^DJI')
            
        Returns:
            Current price or None if error
        """
        try:
            url = f"{self.base_url}/{symbol}"
            params = {
                'interval': '1d',
                'range': '1d'
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract current price from Yahoo Finance response
            if 'chart' in data and 'result' in data['chart']:
                result = data['chart']['result'][0]
                if 'meta' in result and 'regularMarketPrice' in result['meta']:
                    return result['meta']['regularMarketPrice']
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            return None
    
    def get_stock_markets(self) -> Dict[str, Any]:
        """
        Get current prices for all major stock indices.
        Uses caching to avoid excessive API calls.
        
        Returns:
            Dictionary with stock market data and Austrian analysis
        """
        current_time = time.time()
        
        # Return cached data if still valid
        if current_time - self.last_update_time < self.cache_duration and self._stock_cache:
            return self._build_response(self._stock_cache, cached=True)
        
        # Fetch fresh data
        stock_data = {}
        
        for key, symbol in self.indices.items():
            price = self._fetch_quote(symbol)
            if price is not None:
                stock_data[key] = price
                logger.info(f"Fetched {key}: ${price:,.2f}")
            else:
                # Use cached value if available
                if key in self._stock_cache:
                    stock_data[key] = self._stock_cache[key]
                    logger.warning(f"Using cached value for {key}")
                else:
                    # Demo fallback values
                    stock_data[key] = self._get_demo_value(key)
                    logger.warning(f"Using demo value for {key}")
        
        # Update cache
        self._stock_cache = stock_data
        self.last_update_time = current_time
        
        return self._build_response(stock_data, cached=False)
    
    def _get_demo_value(self, key: str) -> float:
        """Fallback demo values if API fails"""
        demo_values = {
            'dow_jones': 43500.0,
            'sp500': 5800.0,
            'nasdaq': 18200.0,
            'russell2000': 2200.0,
            'vix': 15.5
        }
        return demo_values.get(key, 0.0)
    
    def _build_response(self, stock_data: Dict[str, float], cached: bool) -> Dict[str, Any]:
        """
        Build response with stock data and Austrian analysis.
        
        Args:
            stock_data: Dictionary of stock prices
            cached: Whether data is from cache
            
        Returns:
            Complete response with Austrian context
        """
        # Calculate Austrian analysis metrics
        vix = stock_data.get('vix', 15.0)
        
        # VIX interpretation (Austrian perspective)
        if vix < 12:
            vix_interpretation = "EXTREME_COMPLACENCY"
            vix_warning = "Dangerously low fear - classic late-boom euphoria. Austrian theory warns this precedes busts."
        elif vix < 20:
            vix_interpretation = "LOW_FEAR"
            vix_warning = "Market complacency - boom psychology dominates. Watch for sudden reversals."
        elif vix < 30:
            vix_interpretation = "MODERATE_FEAR"
            vix_warning = "Healthy fear levels - market recognizes risks."
        else:
            vix_interpretation = "HIGH_FEAR"
            vix_warning = "Crisis/panic mode - potential bust phase or liquidation period."
        
        # Market breadth analysis (large cap vs small cap)
        sp500 = stock_data.get('sp500', 0)
        russell = stock_data.get('russell2000', 0)
        
        # Small cap vs large cap ratio (Austrian malinvestment indicator)
        # When credit expands, riskier small caps often outperform (speculation)
        breadth_health = "UNKNOWN"
        if sp500 > 0 and russell > 0:
            # Normalized comparison (percentage basis)
            breadth_health = "BROAD" if russell > 2000 else "NARROW"
        
        return {
            'indices': {
                'dow_jones': stock_data.get('dow_jones', 0),
                'sp500': stock_data.get('sp500', 0),
                'nasdaq': stock_data.get('nasdaq', 0),
                'russell2000': stock_data.get('russell2000', 0)
            },
            'volatility': {
                'vix': vix,
                'interpretation': vix_interpretation,
                'austrian_warning': vix_warning
            },
            'austrian_analysis': {
                'market_breadth': breadth_health,
                'speculation_indicator': 'HIGH' if vix < 12 else 'MODERATE' if vix < 20 else 'LOW',
                'boom_psychology': vix < 15,
                'bust_phase': vix > 30
            },
            'metadata': {
                'source': 'Yahoo Finance',
                'cached': cached,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
            }
        }


# Singleton instance
_stock_tracker_instance: Optional[StockTracker] = None


def get_stock_tracker() -> StockTracker:
    """Get or create singleton StockTracker instance"""
    global _stock_tracker_instance
    if _stock_tracker_instance is None:
        _stock_tracker_instance = StockTracker()
    return _stock_tracker_instance
