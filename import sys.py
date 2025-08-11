import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch
import json
import requests

# filepath: c:\Users\JimBLogic\Monitoring\test_verify_dashboard.py
"""
Unit tests for the verify_dashboard module.

This test suite validates the functionality of the dashboard verification tools,
ensuring they properly check dashboard availability, API endpoints, and data validation.
"""

# Add project root to path for imports
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Import the module to test
from verify_dashboard import (
    verify_dashboard_availability,
    verify_api_endpoints,
    verify_economic_data,
    verify_bitcoin_metrics,
    verify_dashboard_ui_components
)


class TestVerifyDashboard(unittest.TestCase):
    """Test suite for dashboard verification functions."""

    def setUp(self):
        """Set up test environment before each test."""
        # Create mock responses for different API endpoints
        self.mock_status_response = MagicMock()
        self.mock_status_response.status_code = 200
        self.mock_status_response.json.return_value = {
            "status": "operational",
            "version": "1.0.0",
            "timestamp": "2025-08-10T15:30:00Z"
        }

        self.mock_economic_data_response = MagicMock()
        self.mock_economic_data_response.status_code = 200
        self.mock_economic_data_response.json.return_value = {
            "indicators": {
                "credit_growth": {"value": 5.2, "status": "elevated"},
                "interest_rate": {"value": 4.7, "status": "normal"},
                "money_supply": {"value": 8.1, "status": "high"},
                "inflation_rate": {"value": 3.2, "status": "elevated"}
            },
            "last_updated": "2025-08-10T14:00:00Z"
        }

        self.mock_bitcoin_response = MagicMock()
        self.mock_bitcoin_response.status_code = 200
        self.mock_bitcoin_response.json.return_value = {
            "price": 72000.45,
            "change_24h": 2.3,
            "source": "CoinAPI",
            "timestamp": "2025-08-10T15:25:00Z",
            "historical": [
                {"date": "2025-08-09", "price": 70500.21},
                {"date": "2025-08-08", "price": 69800.33}
            ]
        }

        self.mock_ui_response = MagicMock()
        self.mock_ui_response.status_code = 200
        self.mock_ui_response.text = """
        <!DOCTYPE html>
        <html>
            <body>
                <div id="dashboard-container">
                    <div id="austrian-score-widget"></div>
                    <div id="bitcoin-widget"></div>
                    <div id="economic-indicators"></div>
                </div>
            </body>
        </html>
        """

        # Mock failed response
        self.mock_failed_response = MagicMock()
        self.mock_failed_response.status_code = 500
        self.mock_failed_response.json.side_effect = ValueError("Invalid JSON")
        self.mock_failed_response.text = "Internal Server Error"

    @patch('verify_dashboard.requests.get')
    def test_dashboard_availability_success(self, mock_get):
        """Test verify_dashboard_availability when dashboard is available."""
        mock_get.return_value = self.mock_status_response
        
        result = verify_dashboard_availability("http://localhost:5002")
        
        # Verify the function made the correct request
        mock_get.assert_called_once_with(
            "http://localhost:5002/api/status", 
            timeout=10
        )
        
        # Verify the result is as expected
        self.assertTrue(result["available"])
        self.assertEqual(result["status_code"], 200)
        self.assertEqual(result["status"], "operational")
        self.assertEqual(result["version"], "1.0.0")

    @patch('verify_dashboard.requests.get')
    def test_dashboard_availability_failure(self, mock_get):
        """Test verify_dashboard_availability when dashboard is not available."""
        mock_get.side_effect = requests.ConnectionError("Connection refused")
        
        result = verify_dashboard_availability("http://localhost:5002")
        
        # Verify the result indicates unavailability
        self.assertFalse(result["available"])
        self.assertIn("error", result)
        self.assertEqual(result["error_type"], "ConnectionError")

    @patch('verify_dashboard.requests.get')
    def test_dashboard_availability_server_error(self, mock_get):
        """Test verify_dashboard_availability when server returns an error."""
        mock_get.return_value = self.mock_failed_response
        
        result = verify_dashboard_availability("http://localhost:5002")
        
        # Verify we detect the server error correctly
        self.assertFalse(result["available"])
        self.assertEqual(result["status_code"], 500)
        self.assertIn("error", result)

    @patch('verify_dashboard.requests.get')
    def test_verify_api_endpoints_all_available(self, mock_get):
        """Test verify_api_endpoints when all endpoints are available."""
        mock_get.return_value = self.mock_status_response
        
        endpoints = [
            "/api/status",
            "/api/current-data",
            "/api/bitcoin-price"
        ]
        
        result = verify_api_endpoints("http://localhost:5002", endpoints)
        
        # Verify each endpoint was checked
        self.assertEqual(mock_get.call_count, len(endpoints))
        
        # Verify all endpoints show as accessible
        for endpoint in endpoints:
            self.assertTrue(result[endpoint]["accessible"])
            self.assertTrue(result[endpoint]["valid_json"])
            self.assertEqual(result[endpoint]["status_code"], 200)

    @patch('verify_dashboard.requests.get')
    def test_verify_api_endpoints_some_unavailable(self, mock_get):
        """Test verify_api_endpoints when some endpoints are not available."""
        # Configure mock to return success for first endpoint, error for others
        mock_get.side_effect = [
            self.mock_status_response,
            requests.ConnectionError("Connection refused"),
            self.mock_failed_response
        ]
        
        endpoints = [
            "/api/status",
            "/api/invalid-endpoint",
            "/api/error-endpoint"
        ]
        
        result = verify_api_endpoints("http://localhost:5002", endpoints)
        
        # First endpoint should be successful
        self.assertTrue(result["/api/status"]["accessible"])
        
        # Second endpoint should show connection error
        self.assertFalse(result["/api/invalid-endpoint"]["accessible"])
        self.assertEqual(result["/api/invalid-endpoint"]["error_type"], "ConnectionError")
        
        # Third endpoint should show server error
        self.assertFalse(result["/api/error-endpoint"]["accessible"])
        self.assertEqual(result["/api/error-endpoint"]["status_code"], 500)

    @patch('verify_dashboard.requests.get')
    def test_verify_economic_data_valid(self, mock_get):
        """Test verify_economic_data with valid economic data."""
        mock_get.return_value = self.mock_economic_data_response
        
        result = verify_economic_data("http://localhost:5002/api/current-data")
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            "http://localhost:5002/api/current-data",
            timeout=10
        )
        
        # Verify the data validation results
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["indicators"]), 4)
        self.assertTrue(all(indicator in result["indicators"] 
                           for indicator in ["credit_growth", "interest_rate", 
                                           "money_supply", "inflation_rate"]))

    @patch('verify_dashboard.requests.get')
    def test_verify_economic_data_missing_indicators(self, mock_get):
        """Test verify_economic_data with missing indicators."""
        # Create response with missing indicators
        incomplete_response = MagicMock()
        incomplete_response.status_code = 200
        incomplete_response.json.return_value = {
            "indicators": {
                "credit_growth": {"value": 5.2, "status": "elevated"},
                # Missing other indicators
            },
            "last_updated": "2025-08-10T14:00:00Z"
        }
        
        mock_get.return_value = incomplete_response
        
        result = verify_economic_data("http://localhost:5002/api/current-data")
        
        # Verify the validation detected missing indicators
        self.assertFalse(result["valid"])
        self.assertIn("missing_indicators", result)
        self.assertIn("interest_rate", result["missing_indicators"])
        self.assertIn("money_supply", result["missing_indicators"])
        self.assertIn("inflation_rate", result["missing_indicators"])

    @patch('verify_dashboard.requests.get')
    def test_verify_bitcoin_metrics_valid(self, mock_get):
        """Test verify_bitcoin_metrics with valid Bitcoin data."""
        mock_get.return_value = self.mock_bitcoin_response
        
        result = verify_bitcoin_metrics("http://localhost:5002/api/bitcoin-price")
        
        # Verify request was made correctly
        mock_get.assert_called_once_with(
            "http://localhost:5002/api/bitcoin-price",
            timeout=10
        )
        
        # Verify the bitcoin metrics validation results
        self.assertTrue(result["valid"])
        self.assertEqual(result["price"], 72000.45)
        self.assertTrue(result["has_historical"])
        self.assertEqual(len(result["historical"]), 2)

    @patch('verify_dashboard.requests.get')
    def test_verify_bitcoin_metrics_missing_price(self, mock_get):
        """Test verify_bitcoin_metrics with missing price data."""
        # Create response with missing price
        incomplete_response = MagicMock()
        incomplete_response.status_code = 200
        incomplete_response.json.return_value = {
            "change_24h": 2.3,
            "source": "CoinAPI",
            "timestamp": "2025-08-10T15:25:00Z"
        }
        
        mock_get.return_value = incomplete_response
        
        result = verify_bitcoin_metrics("http://localhost:5002/api/bitcoin-price")
        
        # Verify the validation detected missing price
        self.assertFalse(result["valid"])
        self.assertIn("error", result)
        self.assertEqual(result["error"], "Missing required field: price")

    @patch('verify_dashboard.requests.get')
    def test_verify_dashboard_ui_components_valid(self, mock_get):
        """Test verify_dashboard_ui_components with valid UI."""
        mock_get.return_value = self.mock_ui_response
        
        result = verify_dashboard_ui_components("http://localhost:5002")
        
        # Verify the UI component validation results
        self.assertTrue(result["valid"])
        self.assertTrue(result["components"]["austrian_score_widget"])
        self.assertTrue(result["components"]["bitcoin_widget"])
        self.assertTrue(result["components"]["economic_indicators"])

    @patch('verify_dashboard.requests.get')
    def test_verify_dashboard_ui_components_missing(self, mock_get):
        """Test verify_dashboard_ui_components with missing UI components."""
        # Create response with missing components
        incomplete_ui_response = MagicMock()
        incomplete_ui_response.status_code = 200
        incomplete_ui_response.text = """
        <!DOCTYPE html>
        <html>
            <body>
                <div id="dashboard-container">
                    <!-- Missing components -->
                </div>
            </body>
        </html>
        """
        
        mock_get.return_value = incomplete_ui_response
        
        result = verify_dashboard_ui_components("http://localhost:5002")
        
        # Verify the validation detected missing components
        self.assertFalse(result["valid"])
        self.assertFalse(result["components"]["austrian_score_widget"])
        self.assertFalse(result["components"]["bitcoin_widget"])
        self.assertFalse(result["components"]["economic_indicators"])
        self.assertGreaterEqual(len(result["missing_components"]), 3)


if __name__ == "__main__":
    unittest.main()