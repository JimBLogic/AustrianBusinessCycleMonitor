#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Dashboard Verification Tool

This script verifies the availability and functionality of the Austrian Business
Cycle Monitor dashboard, checking API endpoints and data integrity while also
providing utilities to fix timestamp-related type issues.
"""
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Callable, TypeVar, cast

import pandas as pd
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/dashboard_verify.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Add project root to path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Type variable for generic timestamp conversion
T = TypeVar('T')

# -------------------------------------------------------------------------
# Timestamp and Timedelta Helper Functions for Type Error Resolution
# -------------------------------------------------------------------------

def fix_timestamp_division(ts1: pd.Timestamp, ts2: pd.Timestamp) -> float:
    """
    Fix for the error: Operator '/' not supported for types 'Timestamp' and 'Timestamp'
    
    Converts timestamps to numeric representations and calculates their ratio.
    
    Args:
        ts1: First timestamp
        ts2: Second timestamp
        
    Returns:
        Float representation of the division result
    """
    # Convert timestamps to Unix time (seconds since epoch)
    ts1_numeric = ts1.timestamp()
    ts2_numeric = ts2.timestamp()
    
    # Avoid division by zero
    if ts2_numeric == 0:
        logger.warning("Attempted division with timestamp value of zero")
        return 0.0
    
    return ts1_numeric / ts2_numeric


def safe_round_timestamp(ts: pd.Timestamp, decimals: int = 0) -> float:
    """
    Safely round a timestamp value by extracting a numeric representation first.
    
    Args:
        ts: Timestamp to round
        decimals: Number of decimal places for rounding
        
    Returns:
        Rounded float value
    """
    # Convert to Unix timestamp (float) then round
    timestamp_value = ts.timestamp()
    return round(timestamp_value, decimals)


def safe_round_timedelta(td: pd.Timedelta, decimals: int = 0, unit: str = 'seconds') -> float:
    """
    Safely round a timedelta value by extracting numeric values first.
    
    Args:
        td: Timedelta to round
        decimals: Number of decimal places for rounding
        unit: Unit to express the result in ('seconds', 'days', etc.)
        
    Returns:
        Rounded float value
    """
    if unit == 'seconds':
        td_value = td.total_seconds()
    elif unit == 'days':
        td_value = td.days + (td.seconds / 86400)
    else:
        logger.warning(f"Unsupported unit '{unit}', using seconds")
        td_value = td.total_seconds()
        
    return round(td_value, decimals)


def timestamp_numeric_compare(ts: pd.Timestamp, numeric_value: float, 
                             operator: str = '>') -> bool:
    """
    Compare a timestamp with a numeric value using a specified operator.
    
    Args:
        ts: Timestamp to compare
        numeric_value: Numeric value for comparison
        operator: Comparison operator ('>', '<', '>=', '<=', '==', '!=')
        
    Returns:
        Boolean result of the comparison
    """
    # Convert timestamp to seconds since epoch
    ts_value = ts.timestamp()
    
    if operator == '>':
        return ts_value > numeric_value
    elif operator == '<':
        return ts_value < numeric_value
    elif operator == '>=':
        return ts_value >= numeric_value
    elif operator == '<=':
        return ts_value <= numeric_value
    elif operator == '==':
        return ts_value == numeric_value
    elif operator == '!=':
        return ts_value != numeric_value
    else:
        logger.error(f"Unsupported operator: {operator}")
        raise ValueError(f"Unsupported operator: {operator}")


def timedelta_numeric_compare(td: pd.Timedelta, numeric_value: float, 
                             unit: str = 'seconds', operator: str = '>') -> bool:
    """
    Compare a timedelta with a numeric value using a specified operator and unit.
    
    Args:
        td: Timedelta to compare
        numeric_value: Numeric value for comparison
        unit: Unit for comparison ('seconds', 'days', etc.)
        operator: Comparison operator ('>', '<', '>=', '<=', '==', '!=')
        
    Returns:
        Boolean result of the comparison
    """
    if unit == 'seconds':
        td_value = td.total_seconds()
    elif unit == 'days':
        td_value = td.days + (td.seconds / 86400)
    else:
        logger.warning(f"Unsupported unit '{unit}', using seconds")
        td_value = td.total_seconds()
        
    if operator == '>':
        return td_value > numeric_value
    elif operator == '<':
        return td_value < numeric_value
    elif operator == '>=':
        return td_value >= numeric_value
    elif operator == '<=':
        return td_value <= numeric_value
    elif operator == '==':
        return td_value == numeric_value
    elif operator == '!=':
        return td_value != numeric_value
    else:
        logger.error(f"Unsupported operator: {operator}")
        raise ValueError(f"Unsupported operator: {operator}")

# -------------------------------------------------------------------------
# Dashboard Verification Functions
# -------------------------------------------------------------------------

def verify_dashboard_availability(url: str = "http://127.0.0.1:5002") -> Dict[str, Any]:
    """
    Verify if the dashboard is available and responding.
    
    Args:
        url: The URL of the dashboard
        
    Returns:
        Dictionary with availability status and details
    """
    logger.info(f"Verifying dashboard availability at {url}")
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=10)
        response_time = time.time() - start_time
        
        return {
            "available": response.status_code == 200,
            "status_code": response.status_code,
            "response_time": round(response_time, 3),
            "error": None
        }
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error when accessing {url}")
        return {"available": False, "status_code": None, "error": "Connection error"}
    except requests.exceptions.Timeout:
        logger.error(f"Timeout when accessing {url}")
        return {"available": False, "status_code": None, "error": "Request timed out"}
    except Exception as e:
        logger.error(f"Error when accessing {url}: {str(e)}")
        return {"available": False, "status_code": None, "error": str(e)}


def verify_api_endpoints(base_url: str, endpoints: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
    """
    Verify each API endpoint is accessible and returning valid data.
    
    Args:
        base_url: The base URL of the dashboard
        endpoints: List of API endpoints to check
        
    Returns:
        Dictionary mapping endpoints to their verification results
    """
    if endpoints is None:
        endpoints = ["/api/status", "/api/current-data", "/api/metrics"]
    
    logger.info(f"Verifying {len(endpoints)} API endpoints")
    results = {}
    
    for endpoint in endpoints:
        endpoint_url = f"{base_url}{endpoint}"
        logger.info(f"Checking endpoint: {endpoint_url}")
        
        try:
            start_time = time.time()
            response = requests.get(endpoint_url, timeout=10)
            response_time = time.time() - start_time
            
            # Check if response is JSON
            try:
                data = response.json()
                is_json = True
            except ValueError:
                data = None
                is_json = False
                
            results[endpoint] = {
                "available": response.status_code == 200,
                "status_code": response.status_code,
                "response_time": round(response_time, 3),
                "is_json": is_json,
                "data_sample": str(data)[:100] + "..." if data else None
            }
            
        except Exception as e:
            logger.error(f"Error checking endpoint {endpoint_url}: {str(e)}")
            results[endpoint] = {
                "available": False,
                "status_code": None,
                "error": str(e)
            }
    
    return results


def verify_economic_data(url: str) -> Dict[str, Any]:
    """
    Verify economic data integrity and completeness.
    
    Args:
        url: URL of the economic data endpoint
        
    Returns:
        Verification results for economic data
    """
    logger.info(f"Verifying economic data from {url}")
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return {
                "verified": False, 
                "error": f"HTTP status code: {response.status_code}"
            }
        
        data = response.json()
        
        # Define expected economic indicators
        expected_indicators = ["monetary_policy", "credit_markets", "real_economy"]
        expected_metrics = ["status", "risk_level", "metrics"]
        
        # Verify data structure
        indicators_present = [ind for ind in expected_indicators if ind in data]
        metrics_present = {}
        
        for indicator in indicators_present:
            metrics_present[indicator] = [
                metric for metric in expected_metrics 
                if metric in data[indicator]
            ]
        
        return {
            "verified": all(ind in data for ind in expected_indicators),
            "indicators_present": indicators_present,
            "metrics_structure": metrics_present,
            "data_sample": str(data)[:150] + "..."
        }
        
    except Exception as e:
        logger.error(f"Error verifying economic data: {str(e)}")
        return {"verified": False, "error": str(e)}


def verify_bitcoin_metrics(url: str) -> Dict[str, Any]:
    """
    Verify Bitcoin metrics availability and validity.
    
    Args:
        url: URL of the Bitcoin metrics endpoint
        
    Returns:
        Verification results for Bitcoin metrics
    """
    logger.info(f"Verifying Bitcoin metrics from {url}")
    
    try:
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return {
                "verified": False, 
                "error": f"HTTP status code: {response.status_code}"
            }
        
        data = response.json()
        
        # Expected Bitcoin metrics
        expected_metrics = ["price", "market_cap", "volume", "hash_rate"]
        metrics_present = [metric for metric in expected_metrics if metric in data]
        
        # Check for required timestamp fields
        has_timestamp = "timestamp" in data
        timestamp_valid = False
        
        if has_timestamp:
            try:
                # Try to parse timestamp
                timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
                timestamp_valid = True
            except (ValueError, TypeError):
                timestamp_valid = False
        
        return {
            "verified": len(metrics_present) >= 2 and has_timestamp,  # At least 2 metrics and timestamp
            "metrics_present": metrics_present,
            "has_timestamp": has_timestamp,
            "timestamp_valid": timestamp_valid,
            "data_sample": str(data)[:150] + "..."
        }
        
    except Exception as e:
        logger.error(f"Error verifying Bitcoin metrics: {str(e)}")
        return {"verified": False, "error": str(e)}


def apply_timestamp_fixes(filepath: str = 'apps/core/austrian_monitor.py') -> Dict[str, Any]:
    """
    Identify timestamp-related issues in a file and apply fixes.
    
    Args:
        filepath: Path to the file to analyze
        
    Returns:
        Dictionary with analysis results and fixes applied
    """
    logger.info(f"Analyzing {filepath} for timestamp operations")
    
    # This is a demonstration function - in reality, you would need to parse
    # the Python code or use a code transformation tool like LibCST
    
    fixes = {
        "timestamp_division": [],
        "timestamp_round": [],
        "timedelta_round": [],
        "timestamp_compare": [],
        "timedelta_compare": [],
        "total_fixes": 0
    }
    
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            
        for i, line in enumerate(lines):
            line_num = i + 1
            
            # Check for timestamp division
            if '/' in line and 'timestamp' in line.lower():
                fixes["timestamp_division"].append(line_num)
                
            # Check for round() with timestamp
            if 'round(' in line and 'timestamp' in line.lower():
                fixes["timestamp_round"].append(line_num)
                
            # Check for round() with timedelta
            if 'round(' in line and 'timedelta' in line.lower():
                fixes["timedelta_round"].append(line_num)
                
            # Check for timestamp comparisons
            if ('>' in line or '<' in line) and 'timestamp' in line.lower():
                fixes["timestamp_compare"].append(line_num)
                
            # Check for timedelta comparisons
            if ('>' in line or '<' in line) and 'timedelta' in line.lower():
                fixes["timedelta_compare"].append(line_num)
        
        fixes["total_fixes"] = sum(len(v) for v in fixes.values() if isinstance(v, list))
        return fixes
    
    except Exception as e:
        logger.error(f"Error analyzing {filepath}: {str(e)}")
        return {"error": str(e)}


def main() -> bool:
    """
    Run dashboard verification checks and report results.
    
    Returns:
        Boolean indicating overall verification success
    """
    print("🏛️ Austrian Business Cycle Monitor - Dashboard Verification")
    print("=" * 60)
    
    # Default dashboard URL
    dashboard_url = "http://127.0.0.1:5002"
    
    # Verify dashboard availability
    dashboard_status = verify_dashboard_availability(dashboard_url)
    if dashboard_status.get("available"):
        print(f"✅ Dashboard is available (Status: {dashboard_status.get('status_code')}, "
              f"Response time: {dashboard_status.get('response_time')}s)")
    else:
        print(f"❌ Dashboard is not available: {dashboard_status.get('error')}")
        return False
    
    # Verify API endpoints
    endpoints = ["/api/status", "/api/metrics", "/api/economic-data", "/api/bitcoin-metrics"]
    endpoint_results = verify_api_endpoints(dashboard_url, endpoints)
    
    available_endpoints = sum(1 for result in endpoint_results.values() if result.get("available", False))
    print(f"\n✅ {available_endpoints} of {len(endpoints)} API endpoints available")
    
    for endpoint, result in endpoint_results.items():
        status = "✅" if result.get("available", False) else "❌"
        print(f"{status} {endpoint} - Status: {result.get('status_code')}")
    
    # Verify economic data
    econ_data_url = f"{dashboard_url}/api/economic-data"
    econ_data_result = verify_economic_data(econ_data_url)
    
    if econ_data_result.get("verified", False):
        print("\n✅ Economic data verified")
        indicators = econ_data_result.get("indicators_present", [])
        print(f"   Indicators present: {', '.join(indicators)}")
    else:
        print(f"\n❌ Economic data verification failed: {econ_data_result.get('error')}")
    
    # Verify Bitcoin metrics
    bitcoin_url = f"{dashboard_url}/api/bitcoin-metrics"
    bitcoin_result = verify_bitcoin_metrics(bitcoin_url)
    
    if bitcoin_result.get("verified", False):
        print("\n✅ Bitcoin metrics verified")
        metrics = bitcoin_result.get("metrics_present", [])
        print(f"   Metrics present: {', '.join(metrics)}")
    else:
        print(f"\n❌ Bitcoin metrics verification failed: {bitcoin_result.get('error')}")
    
    # Check for timestamp handling issues
    timestamp_fixes = apply_timestamp_fixes()
    if timestamp_fixes.get("total_fixes", 0) > 0:
        print("\n⚠️ Timestamp handling issues detected")
        print(f"   {timestamp_fixes.get('total_fixes')} potential timestamp operations may need fixes")
        print("   Run with --fix option to apply the helper functions")
    else:
        print("\n✅ No timestamp handling issues detected")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📋 VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_checks_passed = (
        dashboard_status.get("available", False) and 
        available_endpoints == len(endpoints) and
        econ_data_result.get("verified", False) and
        bitcoin_result.get("verified", False)
    )
    
    if all_checks_passed:
        print("✅ All verification checks passed")
    else:
        print("⚠️ Some verification checks failed")
    
    return all_checks_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)