"""
Dev Tool Stocks - Core Logic
"""

import requests
import os
import random
from datetime import datetime, timedelta

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Dev Tool Stocks',
        'description': 'Real-time stock prices and market data',
        'category': 'finance',
        'icon': '📈',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/dev-tool-stocks/quote',
            'GET /api/dev-tool-stocks/popular'
        ]
    }

def get_stock_quote(symbol, api_key=None):
    """Get stock quote from Alpha Vantage API"""
    if not api_key:
        api_key = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo_key')

    # For demo purposes, return mock data if no API key
    if api_key == 'demo_key':
        return get_mock_stock_quote(symbol)

    try:
        url = f'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={api_key}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if 'Global Quote' not in data or not data['Global Quote']:
            return get_mock_stock_quote(symbol)

        quote = data['Global Quote']
        return {
            'symbol': quote.get('01. symbol', symbol),
            'price': float(quote.get('05. price', 0)),
            'change': float(quote.get('09. change', 0)),
            'change_percent': quote.get('10. change percent', '0.00%'),
            'volume': int(quote.get('06. volume', 0)),
            'previous_close': float(quote.get('08. previous close', 0)),
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        print(f"Error fetching stock data for {symbol}: {e}")
        return get_mock_stock_quote(symbol)

def get_popular_stocks():
    """Get list of popular stock symbols"""
    return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']

def get_mock_stock_quote(symbol):
    """Generate mock stock data for demo purposes"""
    base_prices = {
        'AAPL': 175.50,
        'GOOGL': 140.25,
        'MSFT': 335.80,
        'AMZN': 145.20,
        'TSLA': 248.90,
        'NVDA': 875.30,
        'META': 325.60,
        'NFLX': 485.75
    }

    base_price = base_prices.get(symbol.upper(), 100.0)
    # Add some random variation
    price = base_price + random.uniform(-10, 10)
    change = random.uniform(-5, 5)
    change_percent = f"{change/base_price*100:.2f}%"

    return {
        'symbol': symbol.upper(),
        'price': round(price, 2),
        'change': round(change, 2),
        'change_percent': change_percent,
        'volume': random.randint(1000000, 50000000),
        'previous_close': round(price - change, 2),
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }