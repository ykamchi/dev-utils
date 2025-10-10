# Dev Tool Weather

A beautiful weather display tool that shows current weather conditions and forecasts.

## Features

- Current weather display with temperature, humidity, wind, and more
- 5-day weather forecast
- Beautiful animated weather icons
- Responsive design
- City selection
- Real-time updates
- **Global Header**: Uses the application's global header system (no tool-specific header needed)

## API Integration

This tool uses the OpenWeatherMap API. To use real weather data:

1. Get an API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Set the `OPENWEATHER_API_KEY` environment variable
3. Or pass the API key as a query parameter: `?api_key=YOUR_KEY`

Without an API key, the tool will display demo/mock data.

## Usage

The weather tool displays:
- Current temperature and "feels like" temperature
- Weather description and icon
- Humidity, pressure, wind speed/direction
- Sunrise/sunset times
- 5-day forecast with high/low temperatures

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