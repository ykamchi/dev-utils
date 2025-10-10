"""
Dev Tool Weather - Core Logic
"""

import requests
import os
from datetime import datetime, timedelta

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Dev Tool Weather',
        'description': 'Display current weather information and forecast',
        'category': 'utility',
        'icon': '🌤️',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/dev-tool-weather/current',
            'GET /api/dev-tool-weather/forecast'
        ]
    }

def get_weather_data(city="New York", api_key=None):
    """Get weather data from OpenWeatherMap API"""
    if not api_key:
        api_key = os.getenv('OPENWEATHER_API_KEY', 'demo_key')

    # For demo purposes, return mock data if no API key
    if api_key == 'demo_key':
        return get_mock_weather_data(city)

    try:
        base_url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            'q': city,
            'appid': api_key,
            'units': 'metric'
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        return {
            'city': data['name'],
            'country': data['sys']['country'],
            'temperature': round(data['main']['temp']),
            'feels_like': round(data['main']['feels_like']),
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'description': data['weather'][0]['description'].title(),
            'icon': data['weather'][0]['icon'],
            'wind_speed': data['wind']['speed'],
            'wind_direction': data.get('wind', {}).get('deg', 0),
            'sunrise': datetime.fromtimestamp(data['sys']['sunrise']).strftime('%H:%M'),
            'sunset': datetime.fromtimestamp(data['sys']['sunset']).strftime('%H:%M'),
            'last_updated': datetime.now().strftime('%H:%M:%S')
        }
    except Exception as e:
        # Fallback to mock data on error
        return get_mock_weather_data(city)

def get_weather_forecast(city="New York", api_key=None, days=5):
    """Get weather forecast from OpenWeatherMap API"""
    if not api_key:
        api_key = os.getenv('OPENWEATHER_API_KEY', 'demo_key')

    # For demo purposes, return mock data if no API key
    if api_key == 'demo_key':
        return get_mock_forecast_data(city, days)

    try:
        base_url = "http://api.openweathermap.org/data/2.5/forecast"
        params = {
            'q': city,
            'appid': api_key,
            'units': 'metric'
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        # Group by day and get daily forecasts
        daily_forecasts = {}
        for item in data['list']:
            date = datetime.fromtimestamp(item['dt']).strftime('%Y-%m-%d')
            if date not in daily_forecasts:
                daily_forecasts[date] = {
                    'date': date,
                    'temp_min': item['main']['temp_min'],
                    'temp_max': item['main']['temp_max'],
                    'description': item['weather'][0]['description'].title(),
                    'icon': item['weather'][0]['icon'],
                    'humidity': item['main']['humidity'],
                    'wind_speed': item['wind']['speed']
                }
            else:
                # Update min/max temps
                daily_forecasts[date]['temp_min'] = min(daily_forecasts[date]['temp_min'], item['main']['temp_min'])
                daily_forecasts[date]['temp_max'] = max(daily_forecasts[date]['temp_max'], item['main']['temp_max'])

        # Convert to list and round temperatures
        forecast_list = []
        for date, forecast in list(daily_forecasts.items())[:days]:
            forecast['temp_min'] = round(forecast['temp_min'])
            forecast['temp_max'] = round(forecast['temp_max'])
            forecast_list.append(forecast)

        return forecast_list
    except Exception as e:
        # Fallback to mock data on error
        return get_mock_forecast_data(city, days)

def get_mock_weather_data(city):
    """Return mock weather data for demo purposes"""
    return {
        'city': city,
        'country': 'US',
        'temperature': 22,
        'feels_like': 25,
        'humidity': 65,
        'pressure': 1013,
        'description': 'Partly Cloudy',
        'icon': '02d',
        'wind_speed': 3.5,
        'wind_direction': 180,
        'sunrise': '06:30',
        'sunset': '19:45',
        'last_updated': datetime.now().strftime('%H:%M:%S')
    }

def get_mock_forecast_data(city, days):
    """Return mock forecast data for demo purposes"""
    import random
    forecast = []
    base_date = datetime.now()

    for i in range(days):
        date = (base_date.replace(hour=12, minute=0, second=0, microsecond=0) +
                timedelta(days=i+1)).strftime('%Y-%m-%d')

        # Vary the weather conditions
        conditions = [
            ('Clear Sky', '01d'),
            ('Few Clouds', '02d'),
            ('Scattered Clouds', '03d'),
            ('Broken Clouds', '04d'),
            ('Light Rain', '10d'),
            ('Moderate Rain', '09d')
        ]
        desc, icon = random.choice(conditions)

        forecast.append({
            'date': date,
            'temp_min': random.randint(15, 25),
            'temp_max': random.randint(25, 35),
            'description': desc,
            'icon': icon,
            'humidity': random.randint(40, 80),
            'wind_speed': round(random.uniform(1.5, 5.5), 1)
        })

    return forecast