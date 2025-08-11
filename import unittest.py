import unittest
from unittest.mock import patch, MagicMock
import sys
from pathlib import Path
import json
import pandas as pd
from datetime import datetime, timezone, timedelta
from apps.core.austrian_monitor import fix_timestamp_division, safe_round_timestamp, safe_round_timedelta
from apps.core.austrian_monitor import timestamp_numeric_compare, timedelta_numeric_compare
from apps.dashboard.webapp import AustrianDashboard

#!/usr/bin/env python3
"""
Test suite for Austrian Cycle Monitor dashboard verification.

This module tests the dashboard functionality, ensuring that:
1. The dashboard is accessible
2. Key API endpoints respond correctly
3. Data returned from the dashboard is valid
4. Timestamp and timedelta conversions work properly
"""

# Setup paths for absolute imports
PROJECT_ROOT = Path(__file__).parent.parent
APPS_DIR = PROJECT_ROOT / 'apps'
sys.path.insert(0, str(PROJECT_ROOT))

# Import modules to test


class MockResponse:
    """Mock class for HTTP responses in tests."""
    
    def __init__(self, json_data, status_code=200):
        self.json_data = json_data
        self.status_code = status_code
        self.text = json.dumps(json_data)
        
    def json(self):
        return self.json_data


class TestDashboardVerification(unittest.TestCase):
    """Test cases for dashboard verification."""
    
    def setUp(self):
        """Set up test fixtures before each test."""
        # Create test dashboard instance
        self.dashboard = AustrianDashboard(testing=True)
        self.app = self.dashboard.app.test_client()
        
        # Create test timestamps and timedeltas
        self.ts1 = pd.Timestamp('2025-07-15 12:00:00', tz=timezone.utc)
        self.ts2 = pd.Timestamp('2025-07-10 12:00:00', tz=timezone.utc)
        self.td1 = pd.Timedelta(days=5)
        self.td2 = pd.Timedelta(days=2)
    
    def test_dashboard_home_page(self):
        """Test that dashboard home page is accessible."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Austrian Cycle Monitor', response.data)
    
    def test_dashboard_api_status(self):
        """Test dashboard API status endpoint."""
        response = self.app.get('/api/status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('status', data)
        self.assertIn('timestamp', data)
        self.assertIn('austrian_monitor', data)
    
    @patch('apps.dashboard.webapp.requests.get')
    def test_dashboard_bitcoin_price(self, mock_get):
        """Test dashboard Bitcoin price endpoint with mocked API response."""
        mock_get.return_value = MockResponse({
            'bitcoin': {'usd': 65000.00}
        })
        
        response = self.app.get('/api/bitcoin-price')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('data', data)
        self.assertIn('price', data['data'])
        self.assertGreater(data['data']['price'], 0)
    
    def test_timestamp_division(self):
        """Test fix_timestamp_division function to address Pylance issues."""
        # Test division of timestamps
        result = fix_timestamp_division(self.ts1, self.ts2)
        self.assertIsInstance(result, float)
        self.assertGreater(result, 0)
    
    def test_safe_round_timestamp(self):
        """Test safe_round_timestamp function to address Pylance issues."""
        # Test rounding a timestamp
        result = safe_round_timestamp(self.ts1)
        self.assertIsInstance(result, float)
        
        # Test with decimals
        result_decimal = safe_round_timestamp(self.ts1, decimals=2)
        self.assertIsInstance(result_decimal, float)
    
    def test_safe_round_timedelta(self):
        """Test safe_round_timedelta function to address Pylance issues."""
        # Test rounding a timedelta
        result = safe_round_timedelta(self.td1)
        self.assertIsInstance(result, float)
        
        # Test with decimals
        result_decimal = safe_round_timedelta(self.td1, decimals=2)
        self.assertIsInstance(result_decimal, float)
    
    def test_timestamp_numeric_compare(self):
        """Test timestamp_numeric_compare function."""
        # Convert timestamp to numeric and compare
        result = timestamp_numeric_compare(self.ts1, 100, lambda ts: ts.timestamp())
        self.assertIsInstance(result, bool)
    
    def test_timedelta_numeric_compare(self):
        """Test timedelta_numeric_compare function."""
        # Convert timedelta to numeric and compare
        result = timedelta_numeric_compare(self.td1, 3, unit='days')
        self.assertIsInstance(result, bool)
        self.assertTrue(result)  # 5 days > 3 days
    
    @patch('apps.core.austrian_monitor.AssetTracker')
    def test_dashboard_asset_tracking(self, mock_asset_tracker):
        """Test dashboard integration with asset tracker."""
        # Mock asset tracker
        mock_tracker_instance = MagicMock()
        mock_tracker_instance.get_asset_price.return_value = 2500.0
        mock_asset_tracker.return_value = mock_tracker_instance
        
        # Test asset tracking endpoint
        response = self.app.get('/api/assets/gold')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('price', data)
        self.assertEqual(data['price'], 2500.0)


if __name__ == '__main__':
    unittest.main()