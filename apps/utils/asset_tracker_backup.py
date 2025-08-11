#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Bitcoin and Asset Price Utilities
Consolidated Bitcoin blockchain tracking and asset price management
"""
import os
import sys
import logging
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional, List
import threading
import json

# Setup paths
UTILS_DIR = Path(__file__).parent
APPS_DIR = UTILS_DIR.parent
PROJECT_ROOT = APPS_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AssetTracker:
    """
    Comprehensive asset price tracking for Austrian economics analysis
    Tracks Bitcoin, Gold, Silver, and other Austrian-relevant assets
    """
    
    def __init__(self):
        self.api_endpoints = {
            'mempool': 'https://mempool.space/api',
            'blockchain_info': 'https://blockchain.info/q',
            'coingecko': 'https://api.coingecko.com/api/v3',
            'metals_api': 'https://api.metals.live/v1/spot',  # Free metals API
            'finnhub': 'https://finnhub.io/api/v1'
        }
        
        self.cache: Dict[str, Dict[str, Any]] = {
            'bitcoin_data': {'data': None, 'timestamp': None},
            'gold_data': {'data': None, 'timestamp': None},
            'silver_data': {'data': None, 'timestamp': None},
            'blockchain_data': {'data': None, 'timestamp': None},
            'precious_metals': {'data': None, 'timestamp': None}
        }
        
        logger.info("Enhanced Asset Tracker initialized (Bitcoin, Gold, Silver)")
    
    def get_gold_price(self) -> Dict[str, Any]:
        """Get current gold price from multiple sources"""
        cache_key = 'gold_data'
        
        # Check cache (5 minute cache for gold)
        if self.cache[cache_key]['timestamp']:
            age = datetime.now() - self.cache[cache_key]['timestamp']
            if age < timedelta(minutes=5):
                return self.cache[cache_key]['data']
        
        try:
            # Try multiple gold price APIs
            gold_data = self._fetch_gold_price_multi_source()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': gold_data,
                'timestamp': datetime.now()
            }
            
            return gold_data
            
        except Exception as e:
            logger.error(f"Error fetching gold price: {e}")
            return self._get_fallback_gold_data()
    
    def _fetch_gold_price_multi_source(self) -> Dict[str, Any]:
        """Fetch gold price from multiple reliable sources"""
        import requests
        
        # Try CoinGecko first (they have gold data)
        try:
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': 'gold',
                'vs_currencies': 'usd',
                'include_24hr_change': 'true',
                'include_last_updated_at': 'true'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'gold' in data:
                gold_info = data['gold']
                return {
                    'price': gold_info['usd'],
                    'change_24h': gold_info.get('usd_24h_change', 0),
                    'last_updated': datetime.fromtimestamp(gold_info['last_updated_at']).isoformat(),
                    'data_source': 'CoinGecko',
                    'currency': 'USD',
                    'unit': 'per ounce',
                    'asset_type': 'precious_metal'
                }
        except Exception as e:
            logger.warning(f"CoinGecko gold price failed: {e}")
        
        # Try metals.live as backup
        try:
            url = "https://api.metals.live/v1/spot/gold"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'price': data.get('price', 2650.0),
                'change_24h': data.get('change_24h', 0),
                'last_updated': datetime.now().isoformat(),
                'data_source': 'Metals.live',
                'currency': 'USD',
                'unit': 'per ounce',
                'asset_type': 'precious_metal'
            }
        except Exception as e:
            logger.warning(f"Metals.live gold price failed: {e}")
        
        # Fallback to realistic estimate
        return self._get_fallback_gold_data()
    
    def _get_fallback_gold_data(self) -> Dict[str, Any]:
        """Fallback gold price data"""
        import random
        # Realistic 2025 gold price around $2650
        base_price = 2650.0
        variation = random.uniform(-25, 25)
        
        return {
            'price': round(base_price + variation, 2),
            'change_24h': round(random.uniform(-2.0, 2.0), 2),
            'last_updated': datetime.now().isoformat(),
            'data_source': 'Estimated (2025)',
            'currency': 'USD',
            'unit': 'per ounce',
            'asset_type': 'precious_metal'
        }
    
    def get_silver_price(self) -> Dict[str, Any]:
        """Get current silver price"""
        try:
            import requests
            url = "https://api.coingecko.com/api/v3/simple/price"
            params = {
                'ids': 'silver',
                'vs_currencies': 'usd',
                'include_24hr_change': 'true'
            }
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'silver' in data:
                silver_info = data['silver']
                return {
                    'price': silver_info['usd'],
                    'change_24h': silver_info.get('usd_24h_change', 0),
                    'data_source': 'CoinGecko',
                    'currency': 'USD',
                    'unit': 'per ounce'
                }
        except Exception as e:
            logger.warning(f"Silver price fetch failed: {e}")
        
        # Fallback
        import random
        return {
            'price': round(31.5 + random.uniform(-2, 2), 2),
            'change_24h': round(random.uniform(-3.0, 3.0), 2),
            'data_source': 'Estimated',
            'currency': 'USD',
            'unit': 'per ounce'
        }

class BitcoinTracker:
    """
    Bitcoin blockchain and price tracking utility
    Combines functionality from multiple Bitcoin tracking modules
    """
    
    def __init__(self):
        self.api_endpoints = {
            'mempool': 'https://mempool.space/api',
            'blockchain_info': 'https://blockchain.info/q',
            'coingecko': 'https://api.coingecko.com/api/v3'
        }
        
        self.cache: Dict[str, Dict[str, Any]] = {
            'price_data': {'data': None, 'timestamp': None},
            'blockchain_data': {'data': None, 'timestamp': None},
            'network_stats': {'data': None, 'timestamp': None}
        }
        
        logger.info("Bitcoin Tracker initialized")
    
    def get_bitcoin_price(self) -> Dict[str, Any]:
        """Get current Bitcoin price data"""
        cache_key = 'price_data'
        
        # Check cache (2 minute expiry)
        if self._is_cache_valid(cache_key, minutes=2):
            cached_data = self.cache[cache_key]['data']
            if cached_data is not None:
                return cached_data
        
        try:
            # Try multiple sources for reliability
            price_data = self._fetch_price_data()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': price_data,
                'timestamp': datetime.now()
            }
            
            return price_data
            
        except Exception as e:
            logger.error(f"Error getting Bitcoin price: {e}")
            return self._get_fallback_price_data()
    
    def get_blockchain_stats(self) -> Dict[str, Any]:
        """Get Bitcoin blockchain statistics"""
        cache_key = 'blockchain_data'
        
        # Check cache (10 minute expiry)
        if self._is_cache_valid(cache_key, minutes=10):
            cached_data = self.cache[cache_key]['data']
            if cached_data is not None:
                return cached_data
        
        try:
            stats = self._fetch_blockchain_stats()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': stats,
                'timestamp': datetime.now()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting blockchain stats: {e}")
            return self._get_fallback_blockchain_stats()
    
    def get_network_health(self) -> Dict[str, Any]:
        """Get Bitcoin network health metrics"""
        cache_key = 'network_stats'
        
        # Check cache (5 minute expiry)
        if self._is_cache_valid(cache_key, minutes=5):
            return self.cache[cache_key]['data']
        
        try:
            health_data = self._fetch_network_health()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': health_data,
                'timestamp': datetime.now()
            }
            
            return health_data
            
        except Exception as e:
            logger.error(f"Error getting network health: {e}")
            return self._get_fallback_network_health()
    
    def _fetch_price_data(self) -> Dict[str, Any]:
        """Fetch Bitcoin price from API"""
        try:
            import requests
            
            # Try CoinGecko first
            url = f"{self.api_endpoints['coingecko']}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                bitcoin_data = data.get('bitcoin', {})
                
                return {
                    'price_usd': bitcoin_data.get('usd', 0),
                    'change_24h': bitcoin_data.get('usd_24h_change', 0),
                    'source': 'coingecko',
                    'timestamp': datetime.now().isoformat(),
                    'status': 'success'
                }
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            logger.warning(f"CoinGecko API failed: {e}")
            # Fallback to demo data
            return self._get_fallback_price_data()
    
    def _fetch_blockchain_stats(self) -> Dict[str, Any]:
        """Fetch blockchain statistics"""
        try:
            import requests
            
            # Get stats from mempool.space
            stats_url = f"{self.api_endpoints['mempool']}/blocks/tip/height"
            hashrate_url = f"{self.api_endpoints['mempool']}/v1/mining/hashrate/3d"
            
            # Get block height
            height_response = requests.get(stats_url, timeout=10)
            block_height = height_response.json() if height_response.status_code == 200 else 0
            
            # Get hashrate (simplified)
            try:
                hashrate_response = requests.get(hashrate_url, timeout=10)
                hashrate_data = hashrate_response.json() if hashrate_response.status_code == 200 else {}
                current_hashrate = hashrate_data.get('currentHashrate', 0) if isinstance(hashrate_data, dict) else 0
            except:
                current_hashrate = 0
            
            return {
                'block_height': block_height,
                'hashrate': current_hashrate,
                'difficulty': 0,  # Would need separate API call
                'mempool_count': 0,  # Would need separate API call
                'source': 'mempool.space',
                'timestamp': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.warning(f"Blockchain stats API failed: {e}")
            return self._get_fallback_blockchain_stats()
    
    def _fetch_network_health(self) -> Dict[str, Any]:
        """Fetch network health metrics"""
        try:
            # Combine price and blockchain data for health assessment
            price_data = self.get_bitcoin_price()
            blockchain_data = self.get_blockchain_stats()
            
            # Calculate health score (simplified)
            health_score = 85  # Base score
            
            if price_data.get('change_24h', 0) > -10:  # Not crashing
                health_score += 5
            if blockchain_data.get('block_height', 0) > 800000:  # Recent blocks
                health_score += 10
            
            health_score = min(100, max(0, health_score))
            
            return {
                'health_score': health_score,
                'price_stability': 'stable' if abs(price_data.get('change_24h', 0)) < 5 else 'volatile',
                'network_status': 'healthy' if health_score > 80 else 'warning',
                'last_block': blockchain_data.get('block_height', 0),
                'source': 'calculated',
                'timestamp': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.warning(f"Network health calculation failed: {e}")
            return self._get_fallback_network_health()
    
    def _is_cache_valid(self, cache_key: str, minutes: int) -> bool:
        """Check if cached data is still valid"""
        if self.cache[cache_key]['timestamp'] is None:
            return False
        
        cache_time = self.cache[cache_key]['timestamp']
        if isinstance(cache_time, datetime):
            age = datetime.now() - cache_time
            return age < timedelta(minutes=minutes)
        
        return False
    
    def _get_fallback_price_data(self) -> Dict[str, Any]:
        """Get fallback Bitcoin price data"""
        import random
        
        # Simulate realistic Bitcoin price with some variation
        base_price = 43000 + random.uniform(-2000, 2000)
        change_24h = random.uniform(-8, 8)
        
        return {
            'price_usd': round(base_price, 2),
            'change_24h': round(change_24h, 2),
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }
    
    def _get_fallback_blockchain_stats(self) -> Dict[str, Any]:
        """Get fallback blockchain statistics"""
        import random
        
        return {
            'block_height': 825000 + random.randint(1, 100),
            'hashrate': 450000000 + random.randint(-50000000, 50000000),
            'difficulty': 65000000000000 + random.randint(-5000000000000, 5000000000000),
            'mempool_count': random.randint(1000, 50000),
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }
    
    def _get_fallback_network_health(self) -> Dict[str, Any]:
        """Get fallback network health data"""
        return {
            'health_score': 87,
            'price_stability': 'stable',
            'network_status': 'healthy',
            'last_block': 825000,
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }

class AssetPriceManager:
    """
    Multi-asset price tracking and management
    Handles Bitcoin, Gold, Silver, and other Austrian-preferred assets
    """
    
    def __init__(self):
        self.assets = {
            'bitcoin': 'BTC',
            'gold': 'XAU',
            'silver': 'XAG',
            'sp500': 'SPY'
        }
        
        self.api_endpoints = {
            'metals': 'https://api.metals.live/v1/spot',
            'crypto': 'https://api.coingecko.com/api/v3/simple/price',
            'stocks': 'https://api.polygon.io/v2'  # Would need API key
        }
        
        self.cache: Dict[str, Dict[str, Any]] = {}
        for asset in self.assets:
            self.cache[f'{asset}_price'] = {'data': None, 'timestamp': None}
        
        self.bitcoin_tracker = BitcoinTracker()
        
        logger.info("Asset Price Manager initialized")
    
    def get_all_asset_prices(self) -> Dict[str, Any]:
        """Get prices for all tracked assets"""
        try:
            prices = {}
            
            # Get Bitcoin price (reuse Bitcoin tracker)
            bitcoin_data = self.bitcoin_tracker.get_bitcoin_price()
            prices['bitcoin'] = bitcoin_data
            
            # Get precious metals prices
            gold_data = self.get_gold_price()
            prices['gold'] = gold_data
            
            silver_data = self.get_silver_price()
            prices['silver'] = silver_data
            
            # Get stock market data
            sp500_data = self.get_sp500_price()
            prices['sp500'] = sp500_data
            
            return {
                'prices': prices,
                'timestamp': datetime.now().isoformat(),
                'status': 'success'
            }
            
        except Exception as e:
            logger.error(f"Error getting asset prices: {e}")
            return self._get_fallback_asset_prices()
    
    def get_gold_price(self) -> Dict[str, Any]:
        """Get current gold price"""
        cache_key = 'gold_price'
        
        # Check cache (5 minute expiry)
        if self._is_cache_valid(cache_key, minutes=5):
            return self.cache[cache_key]['data']
        
        try:
            price_data = self._fetch_gold_price()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': price_data,
                'timestamp': datetime.now()
            }
            
            return price_data
            
        except Exception as e:
            logger.error(f"Error getting gold price: {e}")
            return self._get_fallback_gold_price()
    
    def get_silver_price(self) -> Dict[str, Any]:
        """Get current silver price"""
        cache_key = 'silver_price'
        
        # Check cache (5 minute expiry)
        if self._is_cache_valid(cache_key, minutes=5):
            return self.cache[cache_key]['data']
        
        try:
            price_data = self._fetch_silver_price()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': price_data,
                'timestamp': datetime.now()
            }
            
            return price_data
            
        except Exception as e:
            logger.error(f"Error getting silver price: {e}")
            return self._get_fallback_silver_price()
    
    def get_sp500_price(self) -> Dict[str, Any]:
        """Get current S&P 500 price"""
        cache_key = 'sp500_price'
        
        # Check cache (5 minute expiry)
        if self._is_cache_valid(cache_key, minutes=5):
            return self.cache[cache_key]['data']
        
        try:
            price_data = self._fetch_sp500_price()
            
            # Cache the data
            self.cache[cache_key] = {
                'data': price_data,
                'timestamp': datetime.now()
            }
            
            return price_data
            
        except Exception as e:
            logger.error(f"Error getting S&P 500 price: {e}")
            return self._get_fallback_sp500_price()
    
    def _fetch_gold_price(self) -> Dict[str, Any]:
        """Fetch gold price from API"""
        try:
            import requests
            
            # Try metals API (free tier available)
            url = f"{self.api_endpoints['metals']}/gold"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'price_usd': data.get('price', 0) / 31.1035,  # Convert to per ounce
                    'change_24h': data.get('change_24h', 0),
                    'source': 'metals.live',
                    'timestamp': datetime.now().isoformat(),
                    'status': 'success'
                }
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            logger.warning(f"Gold price API failed: {e}")
            return self._get_fallback_gold_price()
    
    def _fetch_silver_price(self) -> Dict[str, Any]:
        """Fetch silver price from API"""
        try:
            import requests
            
            url = f"{self.api_endpoints['metals']}/silver"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'price_usd': data.get('price', 0) / 31.1035,
                    'change_24h': data.get('change_24h', 0),
                    'source': 'metals.live',
                    'timestamp': datetime.now().isoformat(),
                    'status': 'success'
                }
            else:
                raise Exception(f"API error: {response.status_code}")
                
        except Exception as e:
            logger.warning(f"Silver price API failed: {e}")
            return self._get_fallback_silver_price()
    
    def _fetch_sp500_price(self) -> Dict[str, Any]:
        """Fetch S&P 500 price from API"""
        # For now, return fallback data as stock APIs usually require API keys
        return self._get_fallback_sp500_price()
    
    def _is_cache_valid(self, cache_key: str, minutes: int) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache or self.cache[cache_key]['timestamp'] is None:
            return False
        
        cache_time = self.cache[cache_key]['timestamp']
        if isinstance(cache_time, datetime):
            age = datetime.now() - cache_time
            return age < timedelta(minutes=minutes)
        
        return False
    
    def _get_fallback_gold_price(self) -> Dict[str, Any]:
        """Get fallback gold price"""
        import random
        
        base_price = 2020 + random.uniform(-50, 50)
        change_24h = random.uniform(-3, 3)
        
        return {
            'price_usd': round(base_price, 2),
            'change_24h': round(change_24h, 2),
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }
    
    def _get_fallback_silver_price(self) -> Dict[str, Any]:
        """Get fallback silver price"""
        import random
        
        base_price = 24.5 + random.uniform(-2, 2)
        change_24h = random.uniform(-4, 4)
        
        return {
            'price_usd': round(base_price, 2),
            'change_24h': round(change_24h, 2),
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }
    
    def _get_fallback_sp500_price(self) -> Dict[str, Any]:
        """Get fallback S&P 500 price"""
        import random
        
        base_price = 4800 + random.uniform(-100, 100)
        change_24h = random.uniform(-2, 2)
        
        return {
            'price_usd': round(base_price, 2),
            'change_24h': round(change_24h, 2),
            'source': 'demo',
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }
    
    def _get_fallback_asset_prices(self) -> Dict[str, Any]:
        """Get fallback prices for all assets"""
        return {
            'prices': {
                'bitcoin': self.bitcoin_tracker._get_fallback_price_data(),
                'gold': self._get_fallback_gold_price(),
                'silver': self._get_fallback_silver_price(),
                'sp500': self._get_fallback_sp500_price()
            },
            'timestamp': datetime.now().isoformat(),
            'status': 'fallback'
        }

class TranslationManager:
    """
    Simple translation management for multilingual support
    """
    
    def __init__(self):
        self.translations = {
            'en': {
                'title': 'Austrian Business Cycle Monitor',
                'dashboard': 'Dashboard',
                'three_pillars': 'Three Pillars Risk Monitor',
                'start_monitoring': 'Start Real-Time',
                'stop_monitoring': 'Stop Monitoring',
                'refresh': 'Refresh Data',
                'risk_level': 'Risk Level',
                'cycle_phase': 'Cycle Phase',
                'austrian_score': 'Austrian Score'
            },
            'es': {
                'title': 'Monitor del Ciclo Económico Austriaco',
                'dashboard': 'Panel de Control',
                'three_pillars': 'Monitor de Riesgo Tres Pilares',
                'start_monitoring': 'Iniciar Tiempo Real',
                'stop_monitoring': 'Detener Monitoreo',
                'refresh': 'Actualizar Datos',
                'risk_level': 'Nivel de Riesgo',
                'cycle_phase': 'Fase del Ciclo',
                'austrian_score': 'Puntuación Austriaca'
            }
        }
        
        self.current_language = 'en'
    
    def set_language(self, language: str):
        """Set current language"""
        if language in self.translations:
            self.current_language = language
    
    def get_text(self, key: str, language: Optional[str] = None) -> str:
        """Get translated text"""
        lang = language or self.current_language
        
        if lang in self.translations and key in self.translations[lang]:
            return self.translations[lang][key]
        elif key in self.translations['en']:
            return self.translations['en'][key]
        else:
            return key

def main():
    """Test all utility modules"""
    print("🏛️ Austrian Business Cycle Monitor - Utils Test")
    print("=" * 60)
    
    # Test Bitcoin tracker
    print("\n₿ Testing Bitcoin Tracker...")
    bitcoin = BitcoinTracker()
    price_data = bitcoin.get_bitcoin_price()
    print(f"   Bitcoin Price: ${price_data.get('price_usd', 0):,}")
    print(f"   24h Change: {price_data.get('change_24h', 0):+.2f}%")
    print(f"   Source: {price_data.get('source', 'unknown')}")
    
    blockchain_stats = bitcoin.get_blockchain_stats()
    print(f"   Block Height: {blockchain_stats.get('block_height', 0):,}")
    
    # Test Asset manager
    print("\n💰 Testing Asset Price Manager...")
    assets = AssetPriceManager()
    all_prices = assets.get_all_asset_prices()
    
    if 'prices' in all_prices:
        for asset, data in all_prices['prices'].items():
            print(f"   {asset.title()}: ${data.get('price_usd', 0):,.2f} ({data.get('change_24h', 0):+.2f}%)")
    
    # Test Translation manager
    print("\n🌍 Testing Translation Manager...")
    translator = TranslationManager()
    print(f"   English: {translator.get_text('title')}")
    translator.set_language('es')
    print(f"   Spanish: {translator.get_text('title')}")
    
    print("\n✅ All utility tests completed")

if __name__ == "__main__":
    main()
