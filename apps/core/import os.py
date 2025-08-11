import os
import unittest
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest
from apps.core.austrian_monitor import AustrianCycleMonitor, CycleAnalysis

# filepath: c:\Users\JimBLogic\Monitoring\tests\test_austrian_monitor.py
"""
Unit tests for the Austrian Cycle Monitor core module.

This test suite validates the functionality of the AustrianCycleMonitor class,
ensuring proper analysis, data retrieval, and caching behavior.
"""




class TestAustrianCycleMonitor(unittest.TestCase):
    """Test suite for the AustrianCycleMonitor class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        # Create a patcher for AssetTracker
        self.asset_tracker_patcher = patch('apps.core.austrian_monitor.AssetTracker')
        self.mock_asset_tracker = self.asset_tracker_patcher.start()
        
        # Configure mock asset tracker responses
        self.mock_asset_instance = self.mock_asset_tracker.return_value
        self.mock_asset_instance.get_bitcoin_price.return_value = {
            "price": 50000.0,
            "source": "Test Source"
        }
        self.mock_asset_instance.get_gold_price.return_value = {
            "price": 2000.0,
            "source": "Test Source"
        }
        
        # Initialize the monitor
        self.monitor = AustrianCycleMonitor()

    def tearDown(self):
        """Tear down test fixtures after each test method."""
        self.asset_tracker_patcher.stop()

    def test_initialization(self):
        """Test that monitor initializes with correct default values."""
        self.assertIsNone(self.monitor.last_analysis_time)
        self.assertEqual(self.monitor.last_market_data, {})
        self.assertEqual(self.monitor.system_status, "operational")
        self.assertEqual(self.monitor.austrian_score, 5.0)  # Neutral position
        self.assertEqual(self.monitor.cache, {})
        self.assertIsNotNone(self.monitor.asset_tracker)

    @patch.dict('os.environ', {'FRED_API_KEY': 'test_api_key'})
    @patch('apps.core.austrian_monitor.FRED_AVAILABLE', True)
    @patch('apps.core.austrian_monitor.fredapi')
    def test_initialization_with_fred_api(self, mock_fredapi):
        """Test initialization when FRED API is available."""
        # Setup mock
        mock_fred_instance = mock_fredapi.Fred.return_value
        
        # Create a new instance with the mocked environment
        monitor = AustrianCycleMonitor()
        
        # Verify FRED was initialized
        mock_fredapi.Fred.assert_called_once_with(api_key='test_api_key')
        self.assertEqual(monitor.use_real_data, True)
        self.assertEqual(monitor.fred, mock_fred_instance)

    @patch.dict('os.environ', {'FRED_API_KEY': 'test_api_key'})
    @patch('apps.core.austrian_monitor.FRED_AVAILABLE', True)
    @patch('apps.core.austrian_monitor.fredapi')
    def test_initialization_with_fred_api_error(self, mock_fredapi):
        """Test initialization when FRED API raises an exception."""
        # Make Fred constructor raise an exception
        mock_fredapi.Fred.side_effect = Exception("API Error")
        
        # Create a new monitor instance (should handle the exception)
        monitor = AustrianCycleMonitor()
        
        # Verify FRED was attempted but use_real_data is False
        mock_fredapi.Fred.assert_called_once()
        self.assertEqual(monitor.use_real_data, False)
        self.assertIsNone(monitor.fred)

    def test_run_analysis(self):
        """Test that run_analysis method returns expected structure."""
        result = self.monitor.run_analysis()
        
        # Check that result contains expected keys
        self.assertIn("timestamp", result)
        self.assertIn("cycle_position", result)
        self.assertIn("monetary_metrics", result)
        self.assertIn("indicators", result)
        self.assertIn("risk_levels", result)
        self.assertIn("austrian_score", result)
        
        # Validate specific contents
        self.assertIn("m2_growth_rate", result["monetary_metrics"])
        self.assertIn("interest_rate_spread", result["monetary_metrics"])
        self.assertIn("credit_market_distortion", result["monetary_metrics"])
        
        self.assertIn("production_structure", result["indicators"])
        self.assertIn("capital_consumption", result["indicators"])
        self.assertIn("malinvestment_index", result["indicators"])
        
        # Check that analysis was cached
        self.assertEqual(self.monitor.cache["last_analysis"], result)
        
        # Verify last_analysis_time was updated
        self.assertIsNotNone(self.monitor.last_analysis_time)

    def test_determine_cycle_phase(self):
        """Test _determine_cycle_phase returns a valid phase."""
        phase = self.monitor._determine_cycle_phase()
        valid_phases = ["early-boom", "mid-expansion", "late-boom", "bust-beginning", "correction"]
        self.assertIn(phase, valid_phases)

    def test_calculate_overall_risk(self):
        """Test _calculate_overall_risk returns a value within expected range."""
        risk = self.monitor._calculate_overall_risk()
        self.assertIsInstance(risk, float)
        self.assertGreaterEqual(risk, 4.0)  # Based on the ranges in the code
        self.assertLessEqual(risk, 8.0)     # Based on the ranges in the code

    def test_get_current_analysis_with_empty_cache(self):
        """Test that get_current_analysis returns None when cache is empty."""
        # Clear the cache
        self.monitor.cache = {}
        
        # Should return None when no analysis is cached
        self.assertIsNone(self.monitor.get_current_analysis())

    def test_get_current_analysis_with_populated_cache(self):
        """Test that get_current_analysis returns cached analysis when available."""
        # Run analysis to populate cache
        analysis = self.monitor.run_analysis()
        
        # Should return the cached analysis
        self.assertEqual(self.monitor.get_current_analysis(), analysis)

    def test_analyze_returns_cycle_analysis(self):
        """Test that analyze method returns a CycleAnalysis object with expected structure."""
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

    def test_analyze_respects_cache_time(self):
        """Test that analyze method respects cache timeout."""
        # First call to analyze
        first_result = self.monitor.analyze()
        
        # Second call within cache time should return the same object (cache hit)
        second_result = self.monitor.analyze()
        self.assertIs(first_result, second_result)
        
        # Manually expire the cache
        self.monitor.cache["analysis_time"] = datetime.now(UTC) - timedelta(minutes=31)
        
        # Call analyze again - should get a new object (cache miss)
        third_result = self.monitor.analyze()
        self.assertIsNot(first_result, third_result)

    def test_get_three_pillars_data_structure(self):
        """Test that get_three_pillars_data returns expected structure."""
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
            
        # Check specific metrics for monetary policy
        self.assertIn("base_money_growth", pillars["monetary_policy"]["metrics"])
        self.assertIn("central_bank_balance_sheet_growth", pillars["monetary_policy"]["metrics"])
        self.assertIn("real_interest_rate", pillars["monetary_policy"]["metrics"])
        
        # Check caching
        self.assertEqual(self.monitor.cache["three_pillars"], pillars)
        self.assertIn("pillars_time", self.monitor.cache)

    def test_three_pillars_caching(self):
        """Test that three pillars data respects cache timeout."""
        # First call to get data
        first_result = self.monitor.get_three_pillars_data()
        
        # Second call within cache time should return the same object (cache hit)
        second_result = self.monitor.get_three_pillars_data()
        self.assertIs(first_result, second_result)
        
        # Manually expire the cache
        self.monitor.cache["pillars_time"] = datetime.now(UTC) - timedelta(minutes=31)
        
        # Call again - should get a new object (cache miss)
        third_result = self.monitor.get_three_pillars_data()
        self.assertIsNot(first_result, third_result)

    @patch('apps.core.austrian_monitor.fredapi')
    def test_get_real_three_pillars_data(self, mock_fredapi):
        """Test _get_real_three_pillars_data with mocked FRED API."""
        # Mock the FRED API client
        mock_fred = MagicMock()
        self.monitor.fred = mock_fred
        self.monitor.use_real_data = True
        
        # Create mock series data
        m2_series = pd.Series([1000, 1050], index=pd.date_range(start='1/1/2024', periods=2))
        fed_funds_series = pd.Series([5.25], index=pd.date_range(start='7/1/2024', periods=1))
        cpi_series = pd.Series(list(range(13)), index=pd.date_range(start='1/1/2024', periods=13))
        debt_gdp_series = pd.Series([120.5], index=pd.date_range(start='4/1/2024', periods=1))
        baa_series = pd.Series([5.8], index=pd.date_range(start='7/1/2024', periods=1))
        treasury_series = pd.Series([4.2], index=pd.date_range(start='7/1/2024', periods=1))
        capacity_series = pd.Series([78.5], index=pd.date_range(start='7/1/2024', periods=1))
        industrial_series = pd.Series([105.2], index=pd.date_range(start='7/1/2024', periods=1))
        
        # Configure mock return values
        mock_fred.get_series.side_effect = lambda series_id, **kwargs: {
            'M2SL': m2_series,
            'FEDFUNDS': fed_funds_series,
            'CPIAUCSL': cpi_series,
            'GFDEGDQ188S': debt_gdp_series,
            'BAA': baa_series,
            'GS10': treasury_series,
            'TCU': capacity_series,
            'INDPRO': industrial_series
        }[series_id]
        
        # Call the method
        result = self.monitor._get_real_three_pillars_data()
        
        # Verify structure
        self.assertIn("monetary_policy", result)
        self.assertIn("credit_markets", result)
        self.assertIn("real_economy", result)
        
        # Check some specific values
        self.assertIn("metrics", result["monetary_policy"])
        self.assertEqual(result["monetary_policy"]["status"], "expansionary")  # Based on m2_growth_rate > 5
        self.assertEqual(result["credit_markets"]["status"], "overextended")  # Based on debt_to_gdp > 100

    def test_calculate_austrian_score(self):
        """Test calculate_austrian_score method returns expected value."""
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
        
        # With the given risk levels and weights, calculate expected score
        expected = round(
            9.0 * 0.35 +   # high * monetary weight
            7.5 * 0.45 +   # elevated * credit weight
            5.0 * 0.20,    # moderate * real economy weight
            1  # Round to 1 decimal place
        )
        self.assertEqual(score, expected)

    def test_risk_level_to_score(self):
        """Test _risk_level_to_score converts text levels to numeric scores."""
        self.assertEqual(self.monitor._risk_level_to_score("low"), 2.5)
        self.assertEqual(self.monitor._risk_level_to_score("moderate"), 5.0)
        self.assertEqual(self.monitor._risk_level_to_score("elevated"), 7.5)
        self.assertEqual(self.monitor._risk_level_to_score("high"), 9.0)
        self.assertEqual(self.monitor._risk_level_to_score("extreme"), 10.0)
        
        # Test default value for unknown risk level
        self.assertEqual(self.monitor._risk_level_to_score("unknown"), 5.0)
        
        # Test case insensitivity
        self.assertEqual(self.monitor._risk_level_to_score("HIGH"), 9.0)
        self.assertEqual(self.monitor._risk_level_to_score("Moderate"), 5.0)

    def test_get_market_data(self):
        """Test get_market_data returns expected market data structure."""
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
        self.assertEqual(market_data["bitcoin"]["source"], "Test Source")
        
        # Verify Gold data is from mock
        self.assertEqual(market_data["commodities"]["gold"], 2000.0)
        
        # Check last_market_data was updated
        self.assertEqual(self.monitor.last_market_data, market_data)

    def test_demo_three_pillars_data(self):
        """Test _get_demo_three_pillars_data returns expected structure."""
        data = self.monitor._get_demo_three_pillars_data()
        
        # Check the pillars
        self.assertIn("monetary_policy", data)
        self.assertIn("credit_markets", data)
        self.assertIn("real_economy", data)
        
        # Check structure of monetary policy
        monetary = data["monetary_policy"]
        self.assertEqual(monetary["status"], "expansionary")
        self.assertEqual(monetary["risk_level"], "high")
        self.assertIn("base_money_growth", monetary["metrics"])
        self.assertIn("central_bank_balance_sheet_growth", monetary["metrics"])
        self.assertIn("real_interest_rate", monetary["metrics"])
        
        # Check structure of credit markets
        credit = data["credit_markets"]
        self.assertEqual(credit["status"], "overextended")
        self.assertEqual(credit["risk_level"], "elevated")
        self.assertIn("total_credit_to_gdp", credit["metrics"])
        self.assertIn("household_debt_service_ratio", credit["metrics"])
        self.assertIn("corporate_bond_spreads", credit["metrics"])
        
        # Check structure of real economy
        real = data["real_economy"]
        self.assertEqual(real["status"], "late-cycle")
        self.assertEqual(real["risk_level"], "moderate")
        self.assertIn("capacity_utilization", real["metrics"])
        self.assertIn("producer_to_consumer_ratio", real["metrics"])


if __name__ == "__main__":
    unittest.main()