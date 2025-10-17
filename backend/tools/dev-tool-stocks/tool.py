"""
Dev Tool Stocks - Core Logic
"""

import requests
import os
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import xml.etree.ElementTree as ET

# Load environment variables from tool-specific .env file
tool_dir = Path(__file__).parent
env_file = tool_dir / '.env'
if env_file.exists():
    load_dotenv(env_file)

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Stocks',
        'description': 'Real-time stock prices and market data',
        'category': 'finance',
        'icon': '📈',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/dev-tool-stocks/quote',
            'GET /api/dev-tool-stocks/popular',
            'GET /api/dev-tool-stocks/news'
        ]
    }

def get_stock_quote(symbol, api_key=None):
    """Get stock quote from Twelve Data API"""
    if not api_key:
        api_key = os.getenv('TWELVE_DATA_API_KEY')

    if not api_key:
        raise ValueError("Twelve Data API key is required. Please set TWELVE_DATA_API_KEY environment variable.")

    try:
        url = f'https://api.twelvedata.com/quote?symbol={symbol}&apikey={api_key}'
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data or 'close' not in data:
            # Check if it's an error response from Twelve Data
            if 'code' in data and 'message' in data:
                raise ValueError(f"API Error: {data['message']}")
            raise ValueError(f"No data available for symbol: {symbol}")

        # Twelve Data provides change and percent_change directly
        close_price = float(data.get('close', 0))
        change = float(data.get('change', 0))
        change_percent = f"{float(data.get('percent_change', 0)):.2f}%"
        previous_close = float(data.get('previous_close', close_price - change))

        return {
            'symbol': data.get('symbol', symbol).upper(),
            'price': close_price,
            'change': change,
            'change_percent': change_percent,
            'volume': int(data.get('volume', 0)),
            'previous_close': previous_close,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    except Exception as e:
        raise ValueError(f"Error fetching stock data for {symbol}: {str(e)}")

def get_popular_stocks():
    """Get list of popular stock symbols"""
    return ['AAPL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'NFLX']

def get_stock_news(symbol):
    """Get news for a stock symbol from Google News RSS"""
    try:
        # Use Google News RSS feed
        url = f'https://news.google.com/rss/search?q={symbol}+stock&hl=en-US&gl=US&ceid=US:en'
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        # Parse XML
        root = ET.fromstring(response.content)
        news_items = []

        # Find all item elements (news articles)
        for item in root.findall('.//item'):
            title = item.find('title')
            link = item.find('link')
            description = item.find('description')
            pub_date = item.find('pubDate')

            if title is not None and link is not None:
                # Clean up the title (remove source prefix if present)
                title_text = title.text or ""
                if " - " in title_text:
                    title_text = title_text.split(" - ")[0]

                # Get description preview
                desc_text = description.text or "" if description is not None else ""
                # Limit description to first 150 characters
                if len(desc_text) > 150:
                    desc_text = desc_text[:147] + "..."

                news_items.append({
                    'title': title_text,
                    'url': link.text or "",
                    'description': desc_text,
                    'published': pub_date.text if pub_date is not None else ""
                })

                # Limit to 5 news items
                if len(news_items) >= 5:
                    break

        return news_items

    except Exception as e:
        print(f"Error fetching news for {symbol}: {e}")
        return []