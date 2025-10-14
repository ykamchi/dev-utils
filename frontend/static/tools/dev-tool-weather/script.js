/**
 * Dev Tool Weather - Frontend JavaScript
 * Handles loading and displaying weather information
 */
window.tool_script = {
    container: null,
    pollingInterval: 600000, // 10 minutes for weather updates

    // Initialize the tool
    async init(container) {
        console.log('[Dev Tool Weather] Initializing...');

        // Store container reference
        this.container = container;

        // Load saved city from tool state
        const weatherState = StorageService.getToolState('dev-tool-weather', { city: 'New York' });
        const cityInput = document.getElementById('cityInput');
        if (cityInput) {
            cityInput.value = weatherState.city || 'New York';
        }

        setTimeout(async () => {
            // Auto-load weather data
            await this.loadWeatherData();

            // Set up event listeners
            this.setupWeatherEventListeners();

            // Set up cleanup observer
            this.setupWeatherCleanupObserver();
            
        });

    },

    // Polling management
    startWeatherPolling() {
        // Clear any existing interval first
        this.stopWeatherPolling();

        // Start new polling interval (update every 10 minutes for weather)
        this.weatherPollingIntervalId = setInterval(() => this.loadWeatherData(), this.pollingInterval);
    },

    stopWeatherPolling() {
        if (this.weatherPollingIntervalId) {
            clearInterval(this.weatherPollingIntervalId);
            this.weatherPollingIntervalId = null;
        }
    },

    // Cleanup function - called when tool is unloaded
    cleanupWeatherTool() {
        this.stopWeatherPolling();
        // Reset initial load flag for next tool load
        this.isWeatherInitialLoad = true;
        this.weatherScriptLoaded = false;
    },

    // Set up cleanup when tool container is removed
    setupWeatherCleanupObserver() {
        const toolContainer = document.querySelector('.tool-container[data-tool-name="dev-tool-weather"]');
        if (!toolContainer) return;

        // Create mutation observer to watch for removal
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === toolContainer || node.contains(toolContainer)) {
                        this.cleanupWeatherTool();
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
        window.addEventListener('beforeunload', () => this.cleanupWeatherTool());
    },

    // Weather icon mapping
    weatherIcons: {
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
    },

    // Load weather data from server
    async loadWeatherData() {
        console.log('[Dev Tool Weather] Loading weather data...');

        // Update last update time at the start of loading
        const lastUpdateTimeElement = document.getElementById('lastUpdateTime');
        if (lastUpdateTimeElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            lastUpdateTimeElement.textContent = timeString;
        }

        // Start polling after initial load is complete
        this.startWeatherPolling();

        const weatherContent = document.getElementById('weatherContent');
        if (!weatherContent) {
            return; // Tool not loaded yet
        }

        let wasInitialLoad = this.isWeatherInitialLoad;

        try {
            // Only show loading on initial load, not on polling updates
            if (this.isWeatherInitialLoad) {
                this.showWeatherLoading(true);
            }
            this.hideWeatherError();

            // Only hide content on initial load, not on polling updates
            if (this.isWeatherInitialLoad) {
                this.hideWeatherContent();
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

            this.displayWeatherData(currentResult.data, forecastResult.data);
            this.isWeatherInitialLoad = false; // Mark that initial load is complete

            // Start polling after initial load is complete
            this.startWeatherPolling();
        } catch (error) {
            console.error('Error loading weather data:', error);
            this.showWeatherError(error.message);
        } finally {
            if (wasInitialLoad) {
                this.showWeatherLoading(false);
            }
        }
    },

    // Display weather data in the UI
    displayWeatherData(currentWeather, forecast) {
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
        const icon = this.weatherIcons[iconCode] || '☀️';

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
                <div class="forecast-icon">${this.weatherIcons[day.icon] || '☀️'}</div>
                <div class="forecast-temps">
                    <span class="forecast-high">${day.temp_max}°</span>
                    <span class="forecast-low">${day.temp_min}°</span>
                </div>
                <div class="forecast-desc">${day.description}</div>
            `;

            forecastContainer.appendChild(forecastItem);
        });

        // Show content
        this.showWeatherContent();
    },

    // Event handlers
    setupWeatherEventListeners() {
        // City search
        const searchBtn = document.getElementById('searchBtn');
        const cityInput = document.getElementById('cityInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                // Save current city to tool state
                const currentCity = document.getElementById('cityInput').value;
                StorageService.setToolState('dev-tool-weather', { city: currentCity });

                this.isWeatherInitialLoad = true; // Reset to show loading
                this.loadWeatherData();
            });
        }

        if (cityInput) {
            cityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    // Save current city to tool state
                    const currentCity = document.getElementById('cityInput').value;
                    StorageService.setToolState('dev-tool-weather', { city: currentCity });

                    this.isWeatherInitialLoad = true; // Reset to show loading
                    this.loadWeatherData();
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

                this.isWeatherInitialLoad = true; // Reset to show loading
                this.loadWeatherData();
            });
        });

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.isWeatherInitialLoad = true; // Reset to show loading
                this.loadWeatherData();
            });
        }
    },

    // UI helper functions
    showWeatherLoading(show) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = show ? 'flex' : 'none';
        }
    },

    hideWeatherError() {
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'none';
        }
    },

    showWeatherError(msg) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        if (errorState && errorMessage) {
            errorMessage.textContent = msg;
            errorState.style.display = 'flex';
        }
        this.showWeatherLoading(false);
    },

    hideWeatherContent() {
        const content = document.getElementById('weatherContent');
        if (content) {
            content.style.display = 'none';
        }
    },

    showWeatherContent() {
        const content = document.getElementById('weatherContent');
        if (content) {
            content.style.display = 'flex';  // Changed from 'block' to 'flex' to maintain flexbox layout
        }
    },

    // Destroy the weather tool and clean up resources
    destroy: function(container) {
        console.log('[Weather Tool] Destroying weather tool...');
        
        // Stop polling
        this.stopWeatherPolling();
        
        // Remove event listeners
        window.removeEventListener('beforeunload', () => this.cleanupWeatherTool());
        
        // Reset state
        this.isWeatherInitialLoad = true;
        this.weatherScriptLoaded = false;
    }
};

