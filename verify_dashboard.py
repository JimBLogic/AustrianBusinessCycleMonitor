#!/usr/bin/env python3
"""
Austrian Business Cycle Monitor - Dashboard Verification Tool

Este script verifica la disponibilidad y funcionalidad del dashboard del Austrian Business
Cycle Monitor, comprobando los endpoints de la API y la integridad de los datos, además de
proporcionar utilidades para corregir problemas de tipo relacionados con timestamps.
"""

import sys
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Union, Callable, TypeVar, cast

import requests
import pandas as pd

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/dashboard_verify.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Añadir la raíz del proyecto al path
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT))

# Variable de tipo para conversión genérica de timestamp
T = TypeVar('T')

# -------------------------------------------------------------------------
# Funciones auxiliares para Timestamp y Timedelta
# -------------------------------------------------------------------------

def fix_timestamp_division(ts1: pd.Timestamp, ts2: pd.Timestamp) -> float:
    """
    Soluciona el error: Operador '/' no soportado para tipos 'Timestamp' y 'Timestamp'
    Convierte los timestamps a representación numérica y calcula el cociente.
    """
    ts1_numeric = ts1.timestamp()
    ts2_numeric = ts2.timestamp()
    if ts2_numeric == 0:
        logger.warning("Intento de división por cero en fix_timestamp_division")
        return float('inf')
    return ts1_numeric / ts2_numeric

def safe_round_timestamp(ts: pd.Timestamp, decimals: int = 0) -> float:
    """
    Redondea de forma segura un timestamp extrayendo primero su valor numérico.
    """
    timestamp_value = ts.timestamp()
    return round(timestamp_value, decimals)

def safe_round_timedelta(td: pd.Timedelta, decimals: int = 0, unit: str = 'seconds') -> float:
    """
    Redondea de forma segura un timedelta extrayendo primero su valor numérico.
    """
    if unit == 'seconds':
        td_value = td.total_seconds()
    elif unit == 'days':
        td_value = td.days + td.seconds / 86400
    else:
        td_value = td.total_seconds()
    return round(td_value, decimals)

def timestamp_numeric_compare(ts: pd.Timestamp, numeric_value: float, operator: str = '>') -> bool:
    """
    Compara un timestamp con un valor numérico usando el operador especificado.
    """
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
        logger.error(f"Operador desconocido en timestamp_numeric_compare: {operator}")
        return False

def timedelta_numeric_compare(td: pd.Timedelta, numeric_value: float, unit: str = 'seconds', operator: str = '>') -> bool:
    """
    Compara un timedelta con un valor numérico usando el operador y unidad especificados.
    """
    if unit == 'seconds':
        td_value = td.total_seconds()
    elif unit == 'days':
        td_value = td.days + td.seconds / 86400
    else:
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
        logger.error(f"Operador desconocido en timedelta_numeric_compare: {operator}")
        return False

# -------------------------------------------------------------------------
# Funciones de verificación del dashboard
# -------------------------------------------------------------------------

def verify_dashboard_availability(url: str = "http://127.0.0.1:5002") -> Dict[str, Any]:
    """
    Verifica la disponibilidad del dashboard.
    """
    result = {"available": False, "timestamp": datetime.utcnow().isoformat()}
    try:
        response = requests.get(f"{url}/api/status", timeout=10)
        result["status_code"] = response.status_code
        if response.status_code == 200:
            data = response.json()
            result["available"] = True
            result["status"] = data.get("status", "")
            result["version"] = data.get("version", "")
        else:
            result["error"] = f"HTTP {response.status_code}"
    except Exception as e:
        result["error"] = str(e)
    logger.info(f"Dashboard availability: {result['available']}")
    return result

def verify_api_endpoints(base_url: str, endpoints: Optional[List[str]] = None) -> Dict[str, Dict[str, Any]]:
    """
    Verifica múltiples endpoints de la API.
    """
    if endpoints is None:
        endpoints = ["/api/status", "/api/current-data", "/api/analysis", "/api/market-data", "/api/three-pillars", "/api/bitcoin-price"]
    results = {}
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            response = requests.get(url, timeout=10)
            results[endpoint] = {
                "status_code": response.status_code,
                "available": response.status_code == 200,
                "data": response.json() if response.status_code == 200 else None
            }
        except Exception as e:
            results[endpoint] = {"available": False, "error": str(e)}
    return results

def verify_economic_data(url: str) -> Dict[str, Any]:
    """
    Verifica que los datos económicos sean válidos y completos.
    """
    result = {"valid": False, "timestamp": datetime.utcnow().isoformat(), "indicators": {}}
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            indicators = data.get("indicators", {})
            missing = [k for k in ["credit_growth", "interest_rate", "money_supply", "inflation_rate"] if k not in indicators]
            result["indicators"] = indicators
            result["valid"] = len(missing) == 0
            result["missing"] = missing
        else:
            result["error"] = f"HTTP {response.status_code}"
    except Exception as e:
        result["error"] = str(e)
    logger.info(f"Economic data valid: {result['valid']}")
    return result

def verify_bitcoin_metrics(url: str) -> Dict[str, Any]:
    """
    Verifica los datos de Bitcoin.
    """
    result = {"valid": False, "timestamp": datetime.utcnow().isoformat()}
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            price = data.get("price") or data.get("data", {}).get("price")
            result["valid"] = price is not None and price > 0
            result["price"] = price
        else:
            result["error"] = f"HTTP {response.status_code}"
    except Exception as e:
        result["error"] = str(e)
    logger.info(f"Bitcoin metrics valid: {result['valid']}")
    return result

def apply_timestamp_fixes(filepath: str = 'apps/core/austrian_monitor.py') -> Dict[str, Any]:
    """
    Aplica correcciones automáticas de timestamp en el archivo especificado.
    """
    # Esta función es un placeholder para futuras implementaciones automáticas.
    logger.info(f"Aplicando correcciones de timestamp en {filepath}")
    return {"status": "not_implemented"}

class AustrianDashboard:
    def run(self, host="127.0.0.1", port=5002, debug=False):
        # Tu lógica de arranque aquí
        # Por ejemplo, si usas Flask:
        self.app.run(host=host, port=port, debug=debug)

def main() -> bool:
    """
    Ejecución principal de la verificación.
    """
    dashboard_url = "http://127.0.0.1:5002"
    availability = verify_dashboard_availability(dashboard_url)
    print(f"Dashboard disponible: {availability.get('available')}")
    if availability.get("available"):
        endpoints = verify_api_endpoints(dashboard_url)
        print("Endpoints verificados:")
        for ep, res in endpoints.items():
            print(f"  {ep}: {'OK' if res.get('available') else 'ERROR'}")
        econ = verify_economic_data(f"{dashboard_url}/api/current-data")
        print(f"Datos económicos válidos: {econ.get('valid')}")
        btc = verify_bitcoin_metrics(f"{dashboard_url}/api/bitcoin-price")
        print(f"Bitcoin válido: {btc.get('valid')}")
    else:
        print("Dashboard no disponible.")
    return availability.get("available", False)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)