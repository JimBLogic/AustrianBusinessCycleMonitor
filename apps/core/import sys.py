import sys
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch
from apps.core.austrian_monitor import AustrianCycleMonitor, CycleAnalysis

# filepath: c:\Users\JimBLogic\Monitoring\tests\test_austrian_monitor.py
"""
Unit tests for the Austrian Cycle Monitor core module.

This test suite validates the functionality of the AustrianCycleMonitor class,
including its analysis capabilities, data retrieval methods, and caching behavior.
"""

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import the module under test


class TestAustrianCycleMonitor(unittest.TestCase):
    """Tests for the AustrianCycleMonitor class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a patcher for AssetTracker
        self.asset_tracker_patcher = patch('apps.core.austrian_monitor.AssetTracker')
        self.mock_asset_tracker = self.asset_tracker_patcher.start()
        
        # Configure mock asset tracker responses
        self.mock_asset_instance = self.mock_asset_tracker.return_value
        self.mock_asset_instance.get_bitcoin_price.return_value = {"price": 50000.0, "source": "Test"}
        self.mock_asset_instance.get_gold_price.return_value = {"price": 2000.0, "source": "Test"}
        
        # Initialize the monitor
        self.monitor = AustrianCycleMonitor()

    def tearDown(self):
        """Tear down test fixtures after each test method."""
        self.asset_tracker_patcher.stop()

    def test_initialization(self):
        """Test that the monitor initializes with correct default values."""
        self.assertIsNone(self.monitor.last_analysis_time)
        self.assertEqual(self.monitor.last_market_data, {})
        self.assertEqual(self.monitor.system_status, "operational")
        self.assertEqual(self.monitor.austrian_score, 5.0)
        self.assertEqual(self.monitor.cache, {})
        self.assertIsNotNone(self.monitor.asset_tracker)

    def test_run_analysis(self):
        """Test the run_analysis method returns expected data structure."""
        result = self.monitor.run_analysis()
        
        # Check that result contains expected keys
        self.assertIn("timestamp", result)
        self.assertIn("cycle_position", result)
        self.assertIn("monetary_metrics", result)
        self.assertIn("indicators", result)
        self.assertIn("risk_levels", result)
        self.assertIn("austrian_score", result)
        
        # Check that analysis was cached
        self.assertEqual(self.monitor.cache["last_analysis"], result)
        
        # Verify last_analysis_time was updated
        self.assertIsNotNone(self.monitor.last_analysis_time)

    def test_get_current_analysis_empty_cache(self):
        """Test get_current_analysis when cache is empty."""
        # Clear the cache
        self.monitor.cache = {}
        
        # Should return None when no analysis is cached
        self.assertIsNone(self.monitor.get_current_analysis())

    def test_get_current_analysis_with_cache(self):
        """Test get_current_analysis when analysis is cached."""
        # Run analysis to populate cache
        analysis = self.monitor.run_analysis()
        
        # Should return the cached analysis
        self.assertEqual(self.monitor.get_current_analysis(), analysis)

    def test_analyze_method_returns_cycle_analysis(self):
        """Test that analyze method returns a CycleAnalysis object."""
        result = self.monitor.analyze()
        
        # Check return type
        self.assertIsInstance(result, CycleAnalysis)
        
        # Check all expected fields
        self.assertIsInstance(result.timestamp, str)
        self.assertIsInstance(result.cycle_phase, str)
        self.assertIsInstance(result.monetary_policy_risk, float)
        self.assertIsInstance(result.credit_market_risk, float)
        self.assertIsInstance(result.real_economy_risk, float)
        self.assertIsInstance(result.overall_risk, float)
        self.assertIsInstance(result.recommendations, list)
        self.assertIsInstance(result.key_indicators, dict)
        self.assertIsInstance(result.narrative, str)
        
        # Verify analysis was cached
        self.assertEqual(self.monitor.cache["cycle_analysis"], result)
        self.assertIn("analysis_time", self.monitor.cache)

    def test_analyze_caching(self):
        """Test that analyze method respects caching."""
        # First call to analyze
        first_result = self.monitor.analyze()
        
        # Second call within cache time should return the same object
        second_result = self.monitor.analyze()
        self.assertIs(first_result, second_result)
        
        # Manually expire the cache
        self.monitor.cache["analysis_time"] = datetime.now(UTC) - timedelta(minutes=31)
        
        # Call analyze again - should get a new object
        third_result = self.monitor.analyze()
        self.assertIsNot(first_result, third_result)

    def test_get_three_pillars_data(self):
        """Test get_three_pillars_data returns expected structure."""
        pillars = self.monitor.get_three_pillars_data()
        
        # Check the main pillars
        self.assertIn("monetary_policy", pillars)
        self.assertIn("credit_markets", pillars)
        self.assertIn("real_economy", pillars)
        
        # Check structure of each pillar
        for pillar in pillars.values():
            self.assertIn("status", pillar)
            self.assertIn("risk_level", pillar)
            self.assertIn("metrics", pillar)
            self.assertIsInstance(pillar["metrics"], dict)
        
        # Check caching
        self.assertEqual(self.monitor.cache["three_pillars"], pillars)
        self.assertIn("pillars_time", self.monitor.cache)

    def test_get_three_pillars_data_caching(self):
        """Test that three pillars data respects caching."""
        # First call to get data
        first_result = self.monitor.get_three_pillars_data()
        
        # Second call within cache time should return the same object
        second_result = self.monitor.get_three_pillars_data()
        self.assertIs(first_result, second_result)
        
        # Manually expire the cache
        self.monitor.cache["pillars_time"] = datetime.now(UTC) - timedelta(minutes=31)
        
        # Call again - should get a new object
        third_result = self.monitor.get_three_pillars_data()
        self.assertIsNot(first_result, third_result)

    def test_calculate_austrian_score(self):
        """Test calculate_austrian_score method."""
        # Mock get_three_pillars_data to return controlled data
        self.monitor.get_three_pillars_data = MagicMock(return_value={
            "monetary_policy": {"risk_level": "high"},
            "credit_markets": {"risk_level": "elevated"},
            "real_economy": {"risk_level": "moderate"}
        })
        
        score = self.monitor.calculate_austrian_score()
        
        # Verify score is a float between 0 and 10
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 10)
        
        # With the given risk levels and weights, we can calculate the expected score
        expected = round(9.0 * 0.35 + 7.5 * 0.45 + 5.0 * 0.2, 1)
        self.assertEqual(score, expected)

    def test_risk_level_to_score(self):
        """Test _risk_level_to_score method."""
        self.assertEqual(self.monitor._risk_level_to_score("low"), 2.5)
        self.assertEqual(self.monitor._risk_level_to_score("moderate"), 5.0)
        self.assertEqual(self.monitor._risk_level_to_score("elevated"), 7.5)
        self.assertEqual(self.monitor._risk_level_to_score("high"), 9.0)
        self.assertEqual(self.monitor._risk_level_to_score("extreme"), 10.0)
        # Default value for unknown risk level
        self.assertEqual(self.monitor._risk_level_to_score("unknown"), 5.0)
        # Case insensitivity
        self.assertEqual(self.monitor._risk_level_to_score("HIGH"), 9.0)

    def test_get_market_data(self):
        """Test get_market_data method."""
        market_data = self.monitor.get_market_data()
        
        # Check main sections
        self.assertIn("interest_rates", market_data)
        self.assertIn("yield_curve", market_data)
        self.assertIn("commodities", market_data)
        self.assertIn("bitcoin", market_data)
        self.assertIn("economic_indicators", market_data)
        self.assertIn("system_status", market_data)
        self.assertIn("austrian_score", market_data)
        
        # Verify Bitcoin data is from mock
        self.assertEqual(market_data["bitcoin"]["price"], 50000.0)
        self.assertEqual(market_data["bitcoin"]["source"], "Test")
        
        # Verify Gold data is from mock
        self.assertEqual(market_data["commodities"]["gold"], 2000.0)
        
        # Check last_market_data was updated
        self.assertEqual(self.monitor.last_market_data, market_data)

    @patch('apps.core.austrian_monitor.fredapi')
    def test_fred_api_initialization_success(self, mock_fredapi):
        """Test FRED API initialization when API key is available."""
        # Configure environment and mocks
        with patch.dict('os.environ', {'FRED_API_KEY': 'test-key'}):
            # Set FRED_AVAILABLE to True
            with patch('apps.core.austrian_monitor.FRED_AVAILABLE', True):
                # Create a new monitor instance
                monitor = AustrianCycleMonitor()
                
                # Verify FRED was initialized
                mock_fredapi.Fred.assert_called_once_with(api_key='test-key')
                self.assertEqual(monitor.use_real_data, True)

    @patch('apps.core.austrian_monitor.fredapi')
    def test_fred_api_initialization_failure(self, mock_fredapi):
        """Test FRED API initialization handling when it raises an exception."""
        # Configure environment and mocks
        with patch.dict('os.environ', {'FRED_API_KEY': 'test-key'}):
            # Set FRED_AVAILABLE to True
            with patch('apps.core.austrian_monitor.FRED_AVAILABLE', True):
                # Make Fred constructor raise an exception
                mock_fredapi.Fred.side_effect = Exception("API Error")
                
                # Create a new monitor instance (should handle the exception)
                monitor = AustrianCycleMonitor()
                
                # Verify FRED was initialized but use_real_data is False
                mock_fredapi.Fred.assert_called_once()
                self.assertEqual(monitor.use_real_data, False)

    def test_determine_cycle_phase(self):
        """Test _determine_cycle_phase returns a valid phase."""
        phase = self.monitor._determine_cycle_phase()
        valid_phases = ["early-boom", "mid-expansion", "late-boom", "bust-beginning", "correction"]
        self.assertIn(phase, valid_phases)

    def test_calculate_overall_risk(self):
        """Test _calculate_overall_risk returns a value within expected range."""
        risk = self.monitor._calculate_overall_risk()
        self.assertGreaterEqual(risk, 4.0)  # Lower bound based on random ranges in the code
        self.assertLessEqual(risk, 8.0)     # Upper bound based on random ranges in the code
        self.assertIsInstance(risk, float)


if __name__ == '__main__':
    unittest.main()