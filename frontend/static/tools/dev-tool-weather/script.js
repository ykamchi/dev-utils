/**
 * Dev Tool Weather - Frontend JavaScript
 * Handles loading and displaying weather information
 */

// Prevent multiple script executions
if (window.weatherScriptLoaded) {
    // Script already loaded, skip initialization
} else {
    window.weatherScriptLoaded = true;

    // Clean up any existing polling from previous loads
    if (window.weatherPollingIntervalId) {
        clearInterval(window.weatherPollingIntervalId);
        window.weatherPollingIntervalId = null;
    }

// Prevent multiple initialization
if (typeof window.isWeatherInitialLoad === 'undefined') {
    window.isWeatherInitialLoad = true;
}

// Polling management
window.weatherPollingIntervalId = window.weatherPollingIntervalId || null;

function startWeatherPolling() {
    // Clear any existing interval first
    stopWeatherPolling();

    // Start new polling interval (update every 10 minutes for weather)
    window.weatherPollingIntervalId = setInterval(loadWeatherData, 600000);
}

function stopWeatherPolling() {
    if (window.weatherPollingIntervalId) {
        clearInterval(window.weatherPollingIntervalId);
        window.weatherPollingIntervalId = null;
    }
}

// Cleanup function - called when tool is unloaded
function cleanupWeatherTool() {
    stopWeatherPolling();
    // Reset initial load flag for next tool load
    window.isWeatherInitialLoad = true;
    window.weatherScriptLoaded = false;
}

// Set up cleanup when tool container is removed
function setupWeatherCleanupObserver() {
    const toolContainer = document.querySelector('.tool-container[data-tool-name="dev-tool-weather"]');
    if (!toolContainer) return;

    // Create mutation observer to watch for removal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node === toolContainer || node.contains(toolContainer)) {
                    cleanupWeatherTool();
                    observer.disconnect();
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also clean up on page unload
    window.addEventListener('beforeunload', cleanupWeatherTool);
}

// Weather icon mapping
const weatherIcons = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️'
};

// Load weather data from server
async function loadWeatherData() {
    const weatherContent = document.getElementById('weatherContent');
    if (!weatherContent) {
        return; // Tool not loaded yet
    }

    let wasInitialLoad = window.isWeatherInitialLoad;

    try {
        // Only show loading on initial load, not on polling updates
        if (window.isWeatherInitialLoad) {
            showWeatherLoading(true);
        }
        hideWeatherError();

        // Only hide content on initial load, not on polling updates
        if (window.isWeatherInitialLoad) {
            hideWeatherContent();
        }

        const city = document.getElementById('cityInput').value || 'New York';

        // Load current weather
        const currentResponse = await fetch(`/api/dev-tool-weather/current?city=${encodeURIComponent(city)}`);
        if (!currentResponse.ok) {
            throw new Error(`Server error: ${currentResponse.status}`);
        }
        const currentResult = await currentResponse.json();
        if (!currentResult.success) {
            throw new Error(currentResult.error || 'Failed to load weather data');
        }

        // Load forecast
        const forecastResponse = await fetch(`/api/dev-tool-weather/forecast?city=${encodeURIComponent(city)}&days=5`);
        if (!forecastResponse.ok) {
            throw new Error(`Server error: ${forecastResponse.status}`);
        }
        const forecastResult = await forecastResponse.json();
        if (!forecastResult.success) {
            throw new Error(forecastResult.error || 'Failed to load forecast data');
        }

        displayWeatherData(currentResult.data, forecastResult.data);
        window.isWeatherInitialLoad = false; // Mark that initial load is complete

        // Start polling after initial load is complete
        startWeatherPolling();
    } catch (error) {
        console.error('Error loading weather data:', error);
        showWeatherError(error.message);
    } finally {
        if (wasInitialLoad) {
            showWeatherLoading(false);
        }
    }
}

// Display weather data in the UI
function displayWeatherData(currentWeather, forecast) {
    // Update current weather
    document.getElementById('cityName').textContent = currentWeather.city;
    document.getElementById('country').textContent = currentWeather.country;
    document.getElementById('temperature').textContent = currentWeather.temperature;
    document.getElementById('feelsLike').textContent = currentWeather.feels_like;
    document.getElementById('description').textContent = currentWeather.description;
    document.getElementById('humidity').textContent = currentWeather.humidity;
    document.getElementById('windSpeed').textContent = `${currentWeather.wind_speed} m/s`;
    document.getElementById('sunrise').textContent = currentWeather.sunrise;
    document.getElementById('sunset').textContent = currentWeather.sunset;
    document.getElementById('lastUpdated').textContent = currentWeather.last_updated;

    // Update weather icon with animation
    const iconElement = document.getElementById('currentIcon');
    const iconCode = currentWeather.icon;
    const icon = weatherIcons[iconCode] || '☀️';

    // Add fade out animation
    iconElement.style.opacity = '0';
    setTimeout(() => {
        iconElement.textContent = icon;
        iconElement.style.opacity = '1';
    }, 200);

    // Update forecast
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = '';

    forecast.forEach(day => {
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';

        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        forecastItem.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <div class="forecast-icon">${weatherIcons[day.icon] || '☀️'}</div>
            <div class="forecast-temps">
                <span class="forecast-high">${day.temp_max}°</span>
                <span class="forecast-low">${day.temp_min}°</span>
            </div>
            <div class="forecast-desc">${day.description}</div>
        `;

        forecastContainer.appendChild(forecastItem);
    });

    // Show content
    showWeatherContent();
}

// Event handlers
function setupWeatherEventListeners() {
    // City search
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('cityInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            // Save current city to tool state
            const currentCity = document.getElementById('cityInput').value;
            StorageService.setToolState('dev-tool-weather', { city: currentCity });

            window.isWeatherInitialLoad = true; // Reset to show loading
            loadWeatherData();
        });
    }

    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                // Save current city to tool state
                const currentCity = document.getElementById('cityInput').value;
                StorageService.setToolState('dev-tool-weather', { city: currentCity });

                window.isWeatherInitialLoad = true; // Reset to show loading
                loadWeatherData();
            }
        });
    }

    // Popular cities
    const cityButtons = document.querySelectorAll('.city-btn');
    cityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const city = btn.dataset.city;
            document.getElementById('cityInput').value = city;

            // Save selected city to tool state
            StorageService.setToolState('dev-tool-weather', { city: city });

            window.isWeatherInitialLoad = true; // Reset to show loading
            loadWeatherData();
        });
    });

    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            window.isWeatherInitialLoad = true; // Reset to show loading
            loadWeatherData();
        });
    }
}

// UI helper functions
function showWeatherLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'flex' : 'none';
    }
}

function hideWeatherError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.style.display = 'none';
    }
}

function showWeatherError(msg) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    if (errorState && errorMessage) {
        errorMessage.textContent = msg;
        errorState.style.display = 'flex';
    }
    showWeatherLoading(false);
}

function hideWeatherContent() {
    const content = document.getElementById('weatherContent');
    if (content) {
        content.style.display = 'none';
    }
}

function showWeatherContent() {
    const content = document.getElementById('weatherContent');
    if (content) {
        content.style.display = 'flex';  // Changed from 'block' to 'flex' to maintain flexbox layout
    }
}

// Auto-load weather on page load
// Load saved city from tool state
const weatherState = StorageService.getToolState('dev-tool-weather', { city: 'New York' });
const cityInput = document.getElementById('cityInput');
if (cityInput) {
    cityInput.value = weatherState.city || 'New York';
}

loadWeatherData();

// Set up event listeners
setupWeatherEventListeners();

// Set up cleanup observer
setupWeatherCleanupObserver();

// End of script execution guard
}