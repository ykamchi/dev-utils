"""
Dev Tool Weather - API Endpoints
Handles HTTP requests and responses for weather information.
"""

from flask import jsonify, request
from . import tool

def register_apis(app, base_path):
    """Register dev-tool-weather API endpoints"""

    @app.route(f'{base_path}/current', methods=['GET'])
    def get_current_weather():
        """Get current weather for a city"""
        try:
            city = request.args.get('city', 'New York')
            api_key = request.args.get('api_key')

            weather_data = tool.get_weather_data(city, api_key)

            return jsonify({
                'success': True,
                'data': weather_data
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/forecast', methods=['GET'])
    def get_weather_forecast():
        """Get weather forecast for a city"""
        try:
            city = request.args.get('city', 'New York')
            days = int(request.args.get('days', 5))
            api_key = request.args.get('api_key')

            # Limit days to reasonable range
            days = max(1, min(days, 7))

            forecast_data = tool.get_weather_forecast(city, api_key, days)

            return jsonify({
                'success': True,
                'data': forecast_data
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500