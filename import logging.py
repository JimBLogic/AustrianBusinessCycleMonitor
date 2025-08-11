import logging
import requests
from datetime import datetime
from typing import Dict, List, Any

# filepath: c:\Users\JimBLogic\Monitoring\verify_dashboard.py
#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Dashboard Verification Tool

This module provides utilities to verify the availability and functionality
of the Austrian Business Cycle Monitor dashboard and its API endpoints.
"""

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Required indicators for economic data validation
REQUIRED_ECONOMIC_INDICATORS = [
    "credit_growth",
    "interest_rate",
    "money_supply",
    "inflation_rate"
]

# Required components for UI validation
UI_COMPONENTS = {
    "austrian_score_widget": "#austrian-score-widget",
    "bitcoin_widget": "#bitcoin-widget",
    "economic_indicators": "#economic-indicators"
}


def verify_dashboard_availability(base_url: str) -> Dict[str, Any]:
    """
    Verify if the dashboard is available by checking the status API endpoint.
    
    Args:
        base_url: The base URL of the dashboard (e.g., http://localhost:5002)
        
    Returns:
        Dict containing availability status and additional information
    """
    result = {
        "available": False,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    status_url = f"{base_url}/api/status"
    
    try:
        response = requests.get(status_url, timeout=10)
        result["status_code"] = response.status_code
        
        if response.status_code == 200:
            data = response.json()
            result["available"] = True
            result["status"] = data.get("status")
            result["version"] = data.get("version")
            result["timestamp"] = data.get("timestamp", result["timestamp"])
        else:
            result["error"] = f"Received status code: {response.status_code}"
            
    except requests.ConnectionError as e:
        result["error"] = f"Connection error: {str(e)}"
        result["error_type"] = "ConnectionError"
    except requests.Timeout as e:
        result["error"] = f"Timeout error: {str(e)}"
        result["error_type"] = "TimeoutError"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        result["error_type"] = type(e).__name__
        
    logger.info(f"Dashboard availability check: {'Available' if result['available'] else 'Unavailable'}")
    return result


def verify_api_endpoints(base_url: str, endpoints: List[str]) -> Dict[str, Dict[str, Any]]:
    """
    Verify multiple API endpoints and check their responses.
    
    Args:
        base_url: The base URL of the dashboard
        endpoints: List of API endpoint paths to check (e.g., ["/api/status", "/api/data"])
        
    Returns:
        Dict mapping each endpoint to its verification result
    """
    results = {}
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        result = {
            "accessible": False,
            "valid_json": False,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            response = requests.get(url, timeout=10)
            result["status_code"] = response.status_code
            
            if response.status_code == 200:
                result["accessible"] = True
                
                try:
                    data = response.json()
                    result["valid_json"] = True
                    result["data_sample"] = str(data)[:100] + "..." if len(str(data)) > 100 else str(data)
                except ValueError:
                    result["error"] = "Response is not valid JSON"
            else:
                result["error"] = f"Received status code: {response.status_code}"
                
        except requests.ConnectionError as e:
            result["error"] = f"Connection error: {str(e)}"
            result["error_type"] = "ConnectionError"
        except requests.Timeout as e:
            result["error"] = f"Timeout error: {str(e)}"
            result["error_type"] = "TimeoutError"
        except Exception as e:
            result["error"] = f"Unexpected error: {str(e)}"
            result["error_type"] = type(e).__name__
            
        results[endpoint] = result
        logger.info(f"API endpoint {endpoint}: {'Accessible' if result['accessible'] else 'Inaccessible'}")
        
    return results


def verify_economic_data(url: str) -> Dict[str, Any]:
    """
    Verify that economic data from the API is valid and complete.
    
    Args:
        url: The URL for the economic data API endpoint
        
    Returns:
        Dict containing validation results for economic data
    """
    result = {
        "valid": False,
        "timestamp": datetime.utcnow().isoformat(),
        "indicators": {}
    }
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if the indicators object exists
            if "indicators" not in data:
                result["error"] = "Missing 'indicators' object in response"
                return result
                
            # Check for required indicators
            missing_indicators = []
            for indicator in REQUIRED_ECONOMIC_INDICATORS:
                if indicator in data["indicators"]:
                    result["indicators"][indicator] = data["indicators"][indicator]
                else:
                    missing_indicators.append(indicator)
            
            if missing_indicators:
                result["missing_indicators"] = missing_indicators
                result["error"] = f"Missing required indicators: {', '.join(missing_indicators)}"
            else:
                result["valid"] = True
                result["last_updated"] = data.get("last_updated", "Unknown")
        else:
            result["status_code"] = response.status_code
            result["error"] = f"Received status code: {response.status_code}"
                
    except requests.ConnectionError as e:
        result["error"] = f"Connection error: {str(e)}"
        result["error_type"] = "ConnectionError"
    except requests.Timeout as e:
        result["error"] = f"Timeout error: {str(e)}"
        result["error_type"] = "TimeoutError"
    except ValueError as e:
        result["error"] = f"JSON parsing error: {str(e)}"
        result["error_type"] = "ValueError"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        result["error_type"] = type(e).__name__
        
    logger.info(f"Economic data verification: {'Valid' if result['valid'] else 'Invalid'}")
    return result


def verify_bitcoin_metrics(url: str) -> Dict[str, Any]:
    """
    Verify Bitcoin-related metrics from the API.
    
    Args:
        url: The URL for the Bitcoin metrics API endpoint
        
    Returns:
        Dict containing validation results for Bitcoin metrics
    """
    result = {
        "valid": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for required fields
            required_fields = ["price", "timestamp", "source"]
            missing_fields = []
            
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
                
            if missing_fields:
                result["error"] = f"Missing required field: {missing_fields[0]}"
                return result
            
            # Extract key metrics
            result["price"] = data["price"]
            result["source"] = data["source"]
            result["timestamp"] = data["timestamp"]
            
            # Check for historical data if available
            if "historical" in data:
                result["has_historical"] = True
                result["historical"] = data["historical"]
            else:
                result["has_historical"] = False
                
            # Check for 24h change if available
            if "change_24h" in data:
                result["change_24h"] = data["change_24h"]
                
            result["valid"] = True
        else:
            result["status_code"] = response.status_code
            result["error"] = f"Received status code: {response.status_code}"
                
    except requests.ConnectionError as e:
        result["error"] = f"Connection error: {str(e)}"
        result["error_type"] = "ConnectionError"
    except requests.Timeout as e:
        result["error"] = f"Timeout error: {str(e)}"
        result["error_type"] = "TimeoutError"
    except ValueError as e:
        result["error"] = f"JSON parsing error: {str(e)}"
        result["error_type"] = "ValueError"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        result["error_type"] = type(e).__name__
        
    logger.info(f"Bitcoin metrics verification: {'Valid' if result['valid'] else 'Invalid'}")
    return result


def verify_dashboard_ui_components(url: str) -> Dict[str, Any]:
    """
    Verify that key UI components are present in the dashboard HTML.
    
    Args:
        url: The URL for the dashboard main page
        
    Returns:
        Dict containing validation results for UI components
    """
    result = {
        "valid": False,
        "timestamp": datetime.utcnow().isoformat(),
        "components": {},
        "missing_components": []
    }
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            html_content = response.text
            
            # Check for required UI components
            all_components_found = True
            
            for component_name, component_selector in UI_COMPONENTS.items():
                # Remove '#' for simple id search in HTML
                component_id = component_selector.replace('#', '')
                
                # Look for the component id in the HTML
                if f'id="{component_id}"' in html_content or f"id='{component_id}'" in html_content:
                    result["components"][component_name] = True
                else:
                    result["components"][component_name] = False
                    result["missing_components"].append(component_name)
                    all_components_found = False
            
            result["valid"] = all_components_found
        else:
            result["status_code"] = response.status_code
            result["error"] = f"Received status code: {response.status_code}"
                
    except requests.ConnectionError as e:
        result["error"] = f"Connection error: {str(e)}"
        result["error_type"] = "ConnectionError"
    except requests.Timeout as e:
        result["error"] = f"Timeout error: {str(e)}"
        result["error_type"] = "TimeoutError"
    except Exception as e:
        result["error"] = f"Unexpected error: {str(e)}"
        result["error_type"] = type(e).__name__
        
    logger.info(f"UI components verification: {'Valid' if result['valid'] else 'Invalid'}")
    return result


if __name__ == "__main__":
    # Example usage when run directly
    dashboard_url = "http://localhost:5002"
    
    print("🏛️ Austrian Business Cycle Monitor - Dashboard Verification")
    print("=" * 60)
    
    # Check dashboard availability
    availability = verify_dashboard_availability(dashboard_url)
    print(f"Dashboard available: {availability['available']}")
    
    if availability['available']:
        # Verify key endpoints
        endpoints = ["/api/status", "/api/current-data", "/api/bitcoin-price"]
        endpoints_result = verify_api_endpoints(dashboard_url, endpoints)
        print(f"Endpoints verified: {sum(1 for e in endpoints_result.values() if e['accessible'])}/{len(endpoints)}")
        
        # Verify economic data
        econ_result = verify_economic_data(f"{dashboard_url}/api/current-data")
        print(f"Economic data valid: {econ_result['valid']}")
        
        # Verify Bitcoin metrics
        btc_result = verify_bitcoin_metrics(f"{dashboard_url}/api/bitcoin-price")
        print(f"Bitcoin metrics valid: {btc_result['valid']}")
        
        # Verify UI components
        ui_result = verify_dashboard_ui_components(dashboard_url)
        print(f"UI components valid: {ui_result['valid']}")
        
        if not ui_result['valid']:
            print(f"Missing UI components: {', '.join(ui_result['missing_components'])}")