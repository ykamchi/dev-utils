"""
Dev Tool Stocks - API Endpoints
Handles HTTP requests and responses for stock data.
"""

from flask import jsonify, request
from . import tool

def register_apis(app, base_path):
    """Register dev-tool-stocks API endpoints"""

    @app.route(f'{base_path}/quote', methods=['GET'])
    def get_stock_quote_endpoint():
        """Get stock quote for a symbol"""
        try:
            symbol = request.args.get('symbol', 'AAPL')
            api_key = request.args.get('api_key')

            if not symbol:
                return jsonify({
                    'success': False,
                    'error': 'Symbol parameter is required'
                }), 400

            quote_data = tool.get_stock_quote(symbol, api_key)
            return jsonify({
                'success': True,
                'data': quote_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/news', methods=['GET'])
    def get_stock_news_endpoint():
        """Get news for a stock symbol"""
        try:
            symbol = request.args.get('symbol', 'AAPL')

            if not symbol:
                return jsonify({
                    'success': False,
                    'error': 'Symbol parameter is required'
                }), 400

            news_data = tool.get_stock_news(symbol)
            return jsonify({
                'success': True,
                'data': news_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
