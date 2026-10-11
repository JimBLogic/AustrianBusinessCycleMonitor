#!/usr/bin/env python3
"""
Production Backend - Austrian Business Cycle Monitor
Uses waitress WSGI server for stability
"""

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime
import random
from waitress import serve

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend development

@app.route('/api/status')
def status():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "0.2.0-prod"
    })

@app.route('/api/analysis')
def analysis():
    """Mock analysis payload used by dashboard KPIs"""
    return jsonify({
        "analysis": {
            "timestamp": datetime.now().isoformat(),
            "cycle_position": "expansion",
            "austrian_score": 6.8,
            "risk_levels": {
                "monetary_policy": 6.0,
                "credit_markets": 5.5,
                "real_economy": 4.2,
                "overall": 5.3
            },
            "monetary_metrics": {
                "m2_growth_rate": 4.1,
                "interest_rate_spread": -35.0,
                "credit_market_distortion": "elevated"
            },
            "indicators": {
                "yield_curve_inversion": True,
                "nfci": -0.25,
                "credit_growth": 3.2
            }
        },
        "generated_at": datetime.now().isoformat()
    })

@app.route('/api/situation-overview')
def situation_overview():
    """Mock situation overview data"""
    return jsonify({
        "headline": "Moderate Credit Expansion - Monitor Key Indicators",
        "risk_level": "moderate",
        "risk_score": 5.2,
        "cycle_phase": "expansion",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/stock-markets')
def stock_markets():
    """Mock stock market data shaped like production backend for UI compatibility"""
    vix = 17.2
    sp500 = 5200
    dow = 39000
    nasdaq = 16500
    russell = 2050

    # Simple interpretation logic to match UI expectations
    if vix < 12:
        interpretation = "EXTREME_COMPLACENCY"
        warning = "Dangerously low fear - classic late-boom euphoria. Austrian theory warns this precedes busts."
    elif vix < 20:
        interpretation = "LOW_FEAR"
        warning = "Market complacency - boom psychology dominates. Watch for sudden reversals."
    elif vix < 30:
        interpretation = "MODERATE_FEAR"
        warning = "Healthy fear levels - market recognizes risks."
    else:
        interpretation = "HIGH_FEAR"
        warning = "Crisis/panic mode - potential bust phase or liquidation period."

    return jsonify({
        "indices": {
            "dow_jones": dow,
            "sp500": sp500,
            "nasdaq": nasdaq,
            "russell2000": russell
        },
        "volatility": {
            "vix": vix,
            "interpretation": interpretation,
            "austrian_warning": warning
        },
        "austrian_analysis": {
            "market_breadth": "BROAD" if russell > 2000 else "NARROW",
            "speculation_indicator": "HIGH" if vix < 12 else ("MODERATE" if vix < 20 else "LOW"),
            "boom_psychology": vix < 15,
            "bust_phase": vix > 30
        },
        "metadata": {
            "source": "mock",
            "cached": False,
            "timestamp": datetime.now().isoformat()
        }
    })

@app.route('/api/market-data')
def market_data():
    """Mock market data for dashboard"""
    return jsonify({
        "market_data": {
            "bitcoin": {
                "price": 42000 + random.randint(-800, 800),
                "hash_rate": 450_000_000,
                "source": "mock"
            },
            "commodities": {
                "gold": 2350.5,
                "silver": 28.2,
                "oil": 78.3,
                "copper": 4.1
            },
            "interest_rates": {
                "fed_funds": 5.25,
                "10y_treasury": 4.35,
                "natural_rate_estimate": 1.5
            },
            "yield_curve": {
                "inverted": True,
                "10y_2y_spread": -0.35
            },
            "economic_indicators": {
                "ppi": 2.1,
                "cpi": 3.4,
                "gdp_growth": 2.2,
                "manufacturing_pmi": 49.6
            },
            "system_status": "operational",
            "austrian_score": 6.6
        },
        "generated_at": datetime.now().isoformat()
    })

@app.route('/api/blockchain-stats')
def blockchain_stats():
    """Mock blockchain statistics"""
    return jsonify({
        "bitcoin": {
            "price": 42000 + random.randint(-1000, 1000),
            "marketCap": 820000000000,
            "hashRate": 450000000
        },
        "ethereum": {
            "price": 2200 + random.randint(-100, 100),
            "marketCap": 264000000000,
            "gasPrice": 25
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/bitcoin-price')
def bitcoin_price():
    """Simple BTC price endpoint used by a dedicated hook"""
    return jsonify({
        "symbol": "BTCUSD",
        "price": 42000 + random.randint(-1000, 1000),
        "source": "mock",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/explanations')
def explanations():
    """Mock educational content"""
    return jsonify({
        "topics": [
            {
                "id": "abct",
                "title": "Austrian Business Cycle Theory",
                "summary": "Understanding how central bank credit expansion leads to boom-bust cycles"
            },
            {
                "id": "malinvestment",
                "title": "Malinvestment",
                "summary": "How artificially low interest rates distort production structure"
            }
        ],
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/thought-leaders')
def thought_leaders():
    """Mock thought leaders data"""
    return jsonify({
        "leaders": [
            {"name": "Ludwig von Mises", "contribution": "Austrian Business Cycle Theory"},
            {"name": "F.A. Hayek", "contribution": "Price Signals and Knowledge"},
            {"name": "Murray Rothbard", "contribution": "Man, Economy, and State"}
        ],
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/dashboard-snapshot')
def dashboard_snapshot():
    """Mock dashboard snapshot for testing"""
    return jsonify({
        "status": "operational",
        "data_quality": "excellent",
        "last_update": datetime.now().isoformat(),
        "metrics": {
            "credit_expansion": 5.2,
            "market_volatility": 3.8,
            "malinvestment_index": 6.1
        }
    })

@app.route('/api/three-pillars')
def three_pillars():
    """Mock Three Pillars payload for dashboard"""
    return jsonify({
        "monetary_policy": {
            "status": "tightening",
            "risk_level": "elevated",
            "metrics": {
                "m2_growth": 4.1,
                "policy_rate": 5.25,
                "balance_sheet": 8.2
            }
        },
        "credit_markets": {
            "status": "stable",
            "risk_level": "moderate",
            "metrics": {
                "yield_curve": -0.35,
                "credit_spreads": 1.9,
                "zombie_share": 12.5
            }
        },
        "real_economy": {
            "status": "resilient",
            "risk_level": "low",
            "metrics": {
                "unemployment": 3.9,
                "ppi": 2.1,
                "gdp_growth": 2.2
            }
        }
    })

@app.route('/api/cycle-analysis')
def cycle_analysis():
    """Mock detailed cycle analysis with recommendations"""
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "cycle_phase": "late_expansion",
        "monetary_policy_risk": 6.0,
        "credit_market_risk": 5.5,
        "real_economy_risk": 4.0,
        "overall_risk": 5.2,
        "recommendations": [
            "Increase cash reserves",
            "Favor value over growth",
            "Reduce leverage in cyclical sectors"
        ],
        "key_indicators": {
            "m2_yoy": 4.1,
            "10y_2y_spread": -0.35,
            "ppi_yoy": 2.1
        },
        "narrative": "Monetary conditions remain tight while yield curve inversion persists. Monitor for turning points."
    })

@app.route('/api/austrian-insights')
def austrian_insights():
    """Mock Austrian insights content used in the education panel"""
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "cycle_phase": "expansion",
        "overall_risk": 5.2,
        "risk_level": "moderate",
        "cycle_narrative": "Credit expansion continues but at a slowing pace; malinvestment risks elevated in select sectors.",
        "insights": {
            "bitcoin": [
                {
                    "title": "Sound Money Hedge",
                    "content": "Bitcoin adoption trends reflect demand for hard assets in inflationary regimes.",
                    "economist": "Saifedean Ammous",
                    "source": "mock",
                    "relevance_score": 0.82,
                    "tags": ["sound_money", "inflation"]
                }
            ],
            "gold_silver": [
                {
                    "title": "Traditional Hedge",
                    "content": "Gold maintains purchasing power in periods of credit instability.",
                    "economist": "Murray Rothbard",
                    "source": "mock",
                    "relevance_score": 0.77,
                    "tags": ["gold", "credit"]
                }
            ],
            "interest_rates": [],
            "stock_markets": [],
            "inflation": [],
            "commodities": []
        },
        "economists_referenced": {
            "classical": ["Mises", "Hayek", "Rothbard"],
            "modern": ["Jeff Booth", "Lynn Alden"]
        }
    })

if __name__ == '__main__':
    try:
        print("\n" + "="*60)
        print("Austrian Business Cycle Monitor - Production Backend")
        print("="*60)
        print(f"Starting server on http://127.0.0.1:5002")
        print(f"All API endpoints ready")
        print(f"CORS enabled for frontend")
        print("="*60 + "\n")
        
        # Use waitress for production-grade serving
        serve(app, host='127.0.0.1', port=5002, threads=4)
    except Exception as e:
        print(f"\n ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")
