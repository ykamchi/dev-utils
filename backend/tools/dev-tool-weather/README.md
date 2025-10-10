# Dev Tool Weather

A beautiful weather display tool that shows current weather conditions and forecasts.

## Features

- Current weather display with temperature, humidity, wind, and more
- Multi-day weather forecast (up to 16 days supported)
- Beautiful animated weather icons
- Responsive design
- City selection with automatic geocoding
- Real-time updates
- **Global Header**: Uses the application's global header system (no tool-specific header needed)

## API Integration

This tool uses the **Open-Meteo API**, which is completely free and does not require an API key. Open-Meteo provides reliable weather data from multiple sources without any registration or costs.

### No API Key Required

Unlike many weather APIs, Open-Meteo works immediately without any setup:
- ✅ **No API key needed**
- ✅ **No registration required**
- ✅ **No usage limits for basic requests**
- ✅ **Free for both development and production**

### How It Works

The tool automatically:
1. Converts city names to coordinates using Open-Meteo's geocoding service
2. Fetches current weather and forecast data from Open-Meteo API
3. Maps weather codes to user-friendly descriptions and icons
4. Falls back to mock data if there are any network/API issues

### Data Sources

Open-Meteo aggregates data from multiple reliable weather providers including:
- National Weather Services
- Weather models (ECMWF, GFS, etc.)
- Satellite and radar data

### Geocoding & City Support

The tool includes intelligent city name resolution:
- **Automatic Geocoding**: Converts city names to precise latitude/longitude coordinates
- **Global Coverage**: Supports cities worldwide through Open-Meteo's geocoding API
- **Fallback Coordinates**: Includes hardcoded coordinates for major cities (New York, London, Tokyo, Paris, Sydney) for reliability
- **Flexible Input**: Accepts various city name formats and handles common variations

### Weather Code Mapping

The tool includes comprehensive weather code mapping:
- **WMO Weather Codes**: Maps Open-Meteo's numeric weather codes to descriptive text
- **Icon Compatibility**: Converts weather codes to OpenWeatherMap-style icon codes for consistent UI
- **Comprehensive Coverage**: Supports all major weather conditions (clear, cloudy, rain, snow, fog, thunderstorms, etc.)

### Data Accuracy

- **Real-time Data**: Current weather updates in real-time
- **Forecast Accuracy**: Multi-day forecasts based on reliable weather models
- **Temperature Precision**: Rounded to whole degrees for clean display
- **Wind Data**: Speed and direction information included

## Dependencies

This tool requires the following Python packages (in addition to the main application dependencies):

- `requests>=2.31.0` - For making HTTP requests to the Open-Meteo API and geocoding service

See `requirements.txt` in this directory for the complete list of tool-specific dependencies.

**Note**: No API key or registration is required - Open-Meteo provides completely free weather data without authentication.

## Usage

The weather tool displays:
- Current temperature and "feels like" temperature
- Weather description and icon
- Humidity, pressure, wind speed/direction
- Sunrise/sunset times (estimated)
- Multi-day forecast with high/low temperatures (default 5 days, up to 16 supported)

**API Endpoints:**
- `GET /api/dev-tool-weather/current?city={city_name}` - Get current weather
- `GET /api/dev-tool-weather/forecast?city={city_name}&days={number}` - Get weather forecast

**Scrolling Behavior:**
- City selector stays fixed at the top
- Weather content (current weather + forecast) scrolls when content exceeds viewport height

## Development Notes

### Tool Layout Best Practices

#### Flexbox Layout for All Containers
Every container in a tool should use proper flexbox properties for consistent layout and scrolling behavior:

```css
/* Main tool container */
.tool-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 100vh;
}

/* Content containers */
.content-section {
    display: flex;
    flex-direction: column;
    flex: 1;  /* Takes remaining space */
}

/* Fixed header/footer sections */
.fixed-header {
    flex-shrink: 0;  /* Prevents shrinking */
}

/* Scrollable content areas */
.scrollable-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}
```

**Why use flexbox everywhere?**
- **Consistent scrolling**: Only designated areas scroll, headers stay fixed
- **Responsive design**: Automatic adjustment to different screen sizes
- **Maintainable code**: Predictable layout behavior
- **Performance**: Better rendering with proper flex properties

#### Tool Scrolling
For tools that may have content taller than the viewport, always add these CSS properties to the main tool container:

```css
.tool-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 100vh;
}
```

**Weather Tool Layout:**
- `weather-container`: Main flex column container
- `city-selector`: Fixed at top (`flex-shrink: 0`)
- `weather-content`: Scrollable content area (`flex: 1`, `overflow-y: auto`)
  - `current-weather`: Weather display (`display: flex`, `flex-direction: column`)
  - `forecast-section`: Forecast display (`display: flex`, `flex-direction: column`)

This ensures:
- Content can scroll vertically when it exceeds the viewport height
- The tool remains usable on smaller screens
- Consistent behavior across all tools in the Dev Tools application
- Proper flexbox layout for all containers