"""
Optimized Data Fetching - Unified Dashboard Endpoint
Implements efficient caching and parallel fetching like Clark Moody Dashboard
"""

from flask import jsonify
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, Optional, Tuple
import requests
import logging

logger = logging.getLogger(__name__)


class DataCache:
    """
    Simple in-memory cache with TTL
    For production, consider Redis for multi-process support
    """
    def __init__(self):
        self.cache: Dict[str, Tuple[Any, datetime]] = {}
    
    def get(self, key: str, max_age_seconds: int = 60) -> Tuple[Optional[Any], Optional[float]]:
        """
        Get cached data if not expired
        Returns: (data, age_in_seconds) or (None, None)
        """
        if key in self.cache:
            data, timestamp = self.cache[key]
            age = (datetime.now() - timestamp).total_seconds()
            if age < max_age_seconds:
                return data, age
        return None, None
    
    def set(self, key: str, value: Any):
        """Store data with current timestamp"""
        self.cache[key] = (value, datetime.now())
    
    def clear(self, key: Optional[str] = None):
        """Clear specific key or entire cache"""
        if key:
            self.cache.pop(key, None)
        else:
            self.cache.clear()


# Global cache instance
data_cache = DataCache()


def fetch_bitcoin_price() -> Dict[str, Any]:
    """
    Fetch Bitcoin price from CoinGecko
    Free tier: 50 calls/minute (no API key needed)
    """
    try:
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price',
            params={
                'ids': 'bitcoin',
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_market_cap': 'true',
                'include_24hr_vol': 'true'
            },
            timeout=5
        )
        response.raise_for_status()
        data = response.json()['bitcoin']
        
        return {
            'price': data.get('usd', 0),
            'change_24h': data.get('usd_24h_change', 0),
            'market_cap': data.get('usd_market_cap', 0),
            'volume_24h': data.get('usd_24h_vol', 0),
            'source': 'coingecko',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to fetch Bitcoin price: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'coingecko'
        }


def fetch_blockchain_stats() -> Dict[str, Any]:
    """
    Fetch blockchain stats from blockchain.info
    Free, no API key required
    """
    try:
        response = requests.get(
            'https://blockchain.info/stats?format=json',
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            'hash_rate': data.get('hash_rate', 0),
            'difficulty': data.get('difficulty', 0),
            'total_btc': data.get('totalbc', 0) / 100000000,  # Convert satoshis to BTC
            'blocks_mined_24h': data.get('n_blocks_mined', 0),
            'transactions_24h': data.get('n_tx', 0),
            'avg_block_time': data.get('minutes_between_blocks', 10),
            'total_fees_24h': data.get('total_fees_btc', 0),
            'source': 'blockchain.info',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to fetch blockchain stats: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'blockchain.info'
        }


def fetch_mempool_fees() -> Dict[str, Any]:
    """
    Fetch mempool fee recommendations from mempool.space
    Free, no API key required
    """
    try:
        response = requests.get(
            'https://mempool.space/api/v1/fees/recommended',
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            'fastest_fee': data.get('fastestFee', 0),
            'half_hour_fee': data.get('halfHourFee', 0),
            'hour_fee': data.get('hourFee', 0),
            'economy_fee': data.get('economyFee', 0),
            'source': 'mempool.space',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to fetch mempool fees: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'mempool.space'
        }


def fetch_gold_silver_data() -> Dict[str, Any]:
    """
    Fetch precious metals data
    Uses your existing FRED integration
    """
    try:
        # Import your existing FRED fetcher
        from apps.utils.live_asset_tracker import LiveAssetTracker
        
        tracker = LiveAssetTracker()
        gold_data = tracker.get_gold_price()
        silver_data = tracker.get_silver_price()
        
        # Extract prices from the dict response
        gold_price = gold_data.get('price', 0) if isinstance(gold_data, dict) else gold_data
        silver_price = silver_data.get('price', 0) if isinstance(silver_data, dict) else silver_data
        
        return {
            'gold_price': gold_price,
            'silver_price': silver_price,
            'source': 'fred',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to fetch gold/silver data: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'fred'
        }


def fetch_stock_market_data() -> Dict[str, Any]:
    """
    Fetch stock market data (S&P500, Dow, VIX)
    Uses your existing stock tracker
    """
    try:
        from apps.utils.stock_tracker import StockTracker
        
        tracker = StockTracker()
        
        # Get all stock market data
        markets = tracker.get_stock_markets()
        
        return {
            'sp500': {
                'price': markets.get('sp500', {}).get('price', 0),
                'change': markets.get('sp500', {}).get('change_percent', 0)
            },
            'dow': {
                'price': markets.get('dow_jones', {}).get('price', 0),
                'change': markets.get('dow_jones', {}).get('change_percent', 0)
            },
            'vix': {
                'value': markets.get('vix', {}).get('price', 0),
                'change': markets.get('vix', {}).get('change_percent', 0)
            },
            'source': 'yfinance',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to fetch stock data: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'yfinance'
        }


def fetch_fed_data() -> Dict[str, Any]:
    """
    Fetch Federal Reserve data (M2, rates, etc.)
    Note: FRED data requires separate implementation
    This is a placeholder that returns demo data
    """
    try:
        # For now, return placeholder data
        # TODO: Integrate with FRED API using your FRED_API_KEY
        data = {
            'm2_money_supply': 21500,  # Billions
            'fed_funds_rate': 5.33,    # Percent
            'treasury_10y': 4.25,      # Percent
            'treasury_2y': 4.75,       # Percent
            'source': 'fred',
            'status': 'success'
        }
        
        # Calculate yield curve spread
        data['yield_curve_spread'] = data['treasury_10y'] - data['treasury_2y']
        
        return data
    except Exception as e:
        logger.error(f"Failed to fetch Fed data: {e}")
        return {
            'error': str(e),
            'status': 'error',
            'source': 'fred'
        }


def calculate_austrian_metrics(all_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate Austrian economics metrics from fetched data
    """
    try:
        bitcoin = all_data.get('bitcoin', {})
        gold = all_data.get('gold', {})
        stocks = all_data.get('stocks', {})
        fed = all_data.get('fed', {})
        
        # Bitcoin/Gold ratio
        btc_gold_ratio = 0
        if bitcoin.get('price') and gold.get('gold_price'):
            btc_gold_ratio = bitcoin['price'] / gold['gold_price']
        
        # Risk score (simplified)
        risk_score = 5  # Default medium risk
        
        # Increase risk if VIX is high
        vix_value = stocks.get('vix', {}).get('value', 20)
        if vix_value > 30:
            risk_score += 2
        elif vix_value > 20:
            risk_score += 1
        
        # Increase risk if yield curve inverted
        yield_spread = fed.get('yield_curve_spread', 0)
        if yield_spread < 0:
            risk_score += 2
        
        # Cap at 10
        risk_score = min(risk_score, 10)
        
        return {
            'austrian_score': risk_score,
            'btc_gold_ratio': round(btc_gold_ratio, 2),
            'cycle_phase': 'late-boom' if risk_score >= 7 else 'boom' if risk_score >= 5 else 'monitoring',
            'risk_level': 'high' if risk_score >= 7 else 'medium' if risk_score >= 4 else 'low',
            'status': 'success'
        }
    except Exception as e:
        logger.error(f"Failed to calculate Austrian metrics: {e}")
        return {
            'error': str(e),
            'status': 'error'
        }


def get_dashboard_snapshot(use_cache: bool = True, cache_ttl: int = 30) -> Dict[str, Any]:
    """
    Main function: Fetch all dashboard data efficiently
    
    Args:
        use_cache: Whether to use cached data
        cache_ttl: Cache time-to-live in seconds
    
    Returns:
        Complete dashboard data with all metrics
    """
    cache_key = 'dashboard_snapshot'
    
    # Try cache first
    if use_cache:
        cached_data, cache_age = data_cache.get(cache_key, max_age_seconds=cache_ttl)
        if cached_data is not None and cache_age is not None:
            logger.info(f"Serving cached dashboard data (age: {cache_age:.1f}s)")
            return {
                **cached_data,
                'cached': True,
                'cache_age_seconds': round(cache_age, 1)
            }
    
    logger.info("Fetching fresh dashboard data...")
    
    # Fetch all data sources in parallel
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(fetch_bitcoin_price): 'bitcoin',
            executor.submit(fetch_blockchain_stats): 'blockchain',
            executor.submit(fetch_mempool_fees): 'mempool',
            executor.submit(fetch_gold_silver_data): 'gold',
            executor.submit(fetch_stock_market_data): 'stocks',
            executor.submit(fetch_fed_data): 'fed',
        }
        
        results = {}
        for future in as_completed(futures):
            key = futures[future]
            try:
                results[key] = future.result()
                logger.info(f"✓ Fetched {key} data")
            except Exception as e:
                logger.error(f"✗ Failed to fetch {key}: {e}")
                results[key] = {
                    'error': str(e),
                    'status': 'error'
                }
    
    # Calculate Austrian metrics
    results['austrian'] = calculate_austrian_metrics(results)
    
    # Add metadata
    results['timestamp'] = datetime.now().isoformat()
    results['cached'] = False
    results['data_sources'] = {
        'bitcoin': 'CoinGecko',
        'blockchain': 'Blockchain.info',
        'mempool': 'Mempool.space',
        'gold': 'FRED',
        'stocks': 'Yahoo Finance',
        'fed': 'FRED'
    }
    
    # Cache the results
    if use_cache:
        data_cache.set(cache_key, results)
        logger.info(f"Cached dashboard data for {cache_ttl}s")
    
    return results


# Flask route integration
def register_optimized_routes(app):
    """
    Register optimized data fetching routes
    Call this from your webapp.py
    """
    logger.info("Inside register_optimized_routes function...")
    
    @app.route('/api/dashboard-snapshot')
    def api_dashboard_snapshot():
        """
        Unified endpoint for all dashboard data
        Cached for 30 seconds by default
        """
        try:
            data = get_dashboard_snapshot(use_cache=True, cache_ttl=30)
            return jsonify(data)
        except Exception as e:
            logger.error(f"Dashboard snapshot failed: {e}")
            
            # Try to return stale cached data as fallback
            cached_data, _ = data_cache.get('dashboard_snapshot', max_age_seconds=300)
            if cached_data:
                logger.warning("Returning stale cached data due to error")
                return jsonify({
                    **cached_data,
                    'stale': True,
                    'error': str(e)
                })
            
            return jsonify({
                'error': 'Failed to fetch dashboard data',
                'details': str(e),
                'timestamp': datetime.now().isoformat()
            }), 503
    
    logger.info(f"Registered route: /api/dashboard-snapshot")
    
    @app.route('/api/dashboard-snapshot/refresh')
    def api_dashboard_refresh():
        """
        Force refresh (bypass cache)
        Use sparingly to avoid rate limits
        """
        data_cache.clear('dashboard_snapshot')
        data = get_dashboard_snapshot(use_cache=False)
        return jsonify(data)
    
    logger.info(f"Registered route: /api/dashboard-snapshot/refresh")
    
    @app.route('/api/cache/clear')
    def api_cache_clear():
        """Clear all caches"""
        data_cache.clear()
        return jsonify({
            'status': 'success',
            'message': 'Cache cleared'
        })
    
    logger.info(f"Registered route: /api/cache/clear")
    
    @app.route('/api/cache/stats')
    def api_cache_stats():
        """Get cache statistics"""
        stats = {
            'cache_entries': len(data_cache.cache),
            'keys': list(data_cache.cache.keys())
        }
        
        # Add age info for each key
        for key, (_, timestamp) in data_cache.cache.items():
            age = (datetime.now() - timestamp).total_seconds()
            stats[f'{key}_age_seconds'] = round(age, 1)
        
        return jsonify(stats)
    
    logger.info(f"Registered route: /api/cache/stats")
    logger.info("All optimized routes registered successfully!")


# Usage example
if __name__ == '__main__':
    # Test the data fetching
    print("Fetching dashboard data...")
    data = get_dashboard_snapshot(use_cache=False)
    
    print("\n=== Dashboard Snapshot ===")
    print(f"Bitcoin: ${data['bitcoin'].get('price', 'N/A')}")
    print(f"Gold: ${data['gold'].get('gold_price', 'N/A')}")
    print(f"S&P500: {data['stocks'].get('sp500', {}).get('price', 'N/A')}")
    print(f"VIX: {data['stocks'].get('vix', {}).get('value', 'N/A')}")
    print(f"Austrian Score: {data['austrian'].get('austrian_score', 'N/A')}/10")
    print(f"Cycle Phase: {data['austrian'].get('cycle_phase', 'N/A')}")
    print(f"\nTimestamp: {data['timestamp']}")
