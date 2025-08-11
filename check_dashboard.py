import requests
print("Dashboard Test:")
response = requests.get('http://127.0.0.1:5002')
print(f"Status: {response.status_code}")
if "data-i18n" in response.text:
    print("✅ Translation system found")
else:
    print("❌ Translation system not found")
    
if "gold-price" in response.text:
    print("✅ Gold price element found") 
else:
    print("❌ Gold price element not found")

if "silver-price" in response.text:
    print("✅ Silver price element found")
else:
    print("❌ Silver price element not found")

# Test API
api = requests.get('http://127.0.0.1:5002/api/current-data')
data = api.json()
market = data.get('data', {}).get('market_data', {})

print(f"Gold data: {'gold' in market}")
print(f"Silver data: {'silver' in market}")
print(f"Bitcoin data: {'bitcoin' in market}")

if 'gold' in market and market['gold'].get('price'):
    print(f"Gold: ${market['gold']['price']}")
if 'silver' in market and market['silver'].get('price'):
    print(f"Silver: ${market['silver']['price']}")
if 'bitcoin' in market and market['bitcoin'].get('price'):
    print(f"Bitcoin: ${market['bitcoin']['price']}")
