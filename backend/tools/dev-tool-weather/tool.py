"""
Dev Tool Weather - Core Logic
"""

import requests
import os
from datetime import datetime, timedelta

def get_city_coordinates(city):
    """Get latitude and longitude for a city name using Open-Meteo geocoding"""
    try:
        # Use Open-Meteo's geocoding API
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {
            'name': city,
            'count': 1,
            'language': 'en',
            'format': 'json'
        }

        response = requests.get(geo_url, params=params)
        response.raise_for_status()
        data = response.json()

        if data.get('results'):
            result = data['results'][0]
            return {
                'lat': result['latitude'],
                'lon': result['longitude'],
                'name': result['name'],
                'country': result.get('country', '')
            }
    except Exception as e:
        pass

    # Fallback coordinates for major cities
    fallback_coords = {
        'new york': {'lat': 40.7128, 'lon': -74.0060, 'name': 'New York', 'country': 'US'},
        'london': {'lat': 51.5074, 'lon': -0.1278, 'name': 'London', 'country': 'GB'},
        'tokyo': {'lat': 35.6762, 'lon': 139.6503, 'name': 'Tokyo', 'country': 'JP'},
        'paris': {'lat': 48.8566, 'lon': 2.3522, 'name': 'Paris', 'country': 'FR'},
        'sydney': {'lat': -33.8688, 'lon': 151.2093, 'name': 'Sydney', 'country': 'AU'}
    }

    city_lower = city.lower()
    return fallback_coords.get(city_lower, {'lat': 40.7128, 'lon': -74.0060, 'name': city.title(), 'country': 'Unknown'})

def get_weather_description(weathercode):
    """Convert Open-Meteo weather code to description"""
    descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    }
    return descriptions.get(weathercode, "Unknown")

def get_weather_icon(weathercode):
    """Convert Open-Meteo weather code to icon code"""
    # Map weather codes to OpenWeatherMap-style icon codes for compatibility
    icon_map = {
        0: "01d",  # Clear sky
        1: "02d",  # Mainly clear
        2: "03d",  # Partly cloudy
        3: "04d",  # Overcast
        45: "50d", # Fog
        48: "50d", # Rime fog
        51: "09d", # Light drizzle
        53: "09d", # Moderate drizzle
        55: "09d", # Dense drizzle
        61: "10d", # Slight rain
        63: "10d", # Moderate rain
        65: "10d", # Heavy rain
        71: "13d", # Slight snow
        73: "13d", # Moderate snow
        75: "13d", # Heavy snow
        77: "13d", # Snow grains
        80: "09d", # Rain showers
        81: "09d",
        82: "09d",
        85: "13d", # Snow showers
        86: "13d",
        95: "11d", # Thunderstorm
        96: "11d",
        99: "11d"
    }
    return icon_map.get(weathercode, "01d")

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
    """Get weather data from Open-Meteo API (no API key required)"""
    try:
        # First, get coordinates for the city
        coords = get_city_coordinates(city)
        if not coords:
            return get_mock_weather_data(city)

        lat, lon = coords['lat'], coords['lon']

        # Open-Meteo API call
        base_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            'latitude': lat,
            'longitude': lon,
            'current_weather': True,
            'timezone': 'auto'
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        current = data['current_weather']

        return {
            'city': coords['name'],
            'country': coords.get('country', 'Unknown'),
            'temperature': round(current['temperature']),
            'feels_like': round(current['temperature']),  # Open-Meteo doesn't provide feels_like
            'humidity': 50,  # Open-Meteo doesn't provide humidity in current_weather
            'pressure': 1013,  # Open-Meteo doesn't provide pressure in current_weather
            'description': get_weather_description(current['weathercode']),
            'icon': get_weather_icon(current['weathercode']),
            'wind_speed': current['windspeed'],
            'wind_direction': current.get('winddirection', 0),
            'sunrise': '06:00',  # Open-Meteo doesn't provide sunrise/sunset in current_weather
            'sunset': '18:00',   # Would need separate API call for this
            'last_updated': datetime.now().strftime('%H:%M:%S')
        }
    except Exception as e:
        # Fallback to mock data on error
        return get_mock_weather_data(city)

def get_weather_forecast(city="New York", api_key=None, days=5):
    """Get weather forecast from Open-Meteo API (no API key required)"""
    try:
        # Get coordinates for the city
        coords = get_city_coordinates(city)
        if not coords:
            return get_mock_forecast_data(city, days)

        lat, lon = coords['lat'], coords['lon']

        # Open-Meteo API call for forecast
        base_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            'latitude': lat,
            'longitude': lon,
            'daily': ['temperature_2m_max', 'temperature_2m_min', 'weathercode'],
            'timezone': 'auto',
            'forecast_days': min(days, 16)  # Open-Meteo supports up to 16 days
        }

        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        # Build forecast from daily data
        forecast = []
        for i, date in enumerate(data['daily']['time']):
            forecast.append({
                'date': date,
                'temp_min': round(data['daily']['temperature_2m_min'][i]),
                'temp_max': round(data['daily']['temperature_2m_max'][i]),
                'description': get_weather_description(data['daily']['weathercode'][i]),
                'icon': get_weather_icon(data['daily']['weathercode'][i]),
                'humidity': 50,  # Not available in daily forecast
                'wind_speed': 5.0  # Not available in daily forecast
            })

        return forecast[:days]  # Return only requested number of days

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