/**
 * Dev Tool Stocks - Frontend JavaScript
 * Handles loading and displaying stock information
 */

// Prevent multiple script executions
if (window.stocksScriptLoaded) {
    // Script already loaded, skip initialization
} else {
    window.stocksScriptLoaded = true;

    // Clean up any existing polling from previous loads
    if (window.stocksPollingIntervalId) {
        clearInterval(window.stocksPollingIntervalId);
        window.stocksPollingIntervalId = null;
    }

// Prevent multiple initialization
if (typeof window.isStocksInitialLoad === 'undefined') {
    window.isStocksInitialLoad = true;
}

// Polling management
window.stocksPollingIntervalId = window.stocksPollingIntervalId || null;

// Number formatting function for large values
function formatLargeNumber(num) {
    if (num === 0) return '$0';

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum >= 1e12) {
        return `$${sign}${(absNum / 1e12).toFixed(1)}T`;
    } else if (absNum >= 1e9) {
        return `$${sign}${(absNum / 1e9).toFixed(1)}B`;
    } else if (absNum >= 1e6) {
        const millions = absNum / 1e6;
        return `$${sign}${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    } else if (absNum >= 1e3) {
        const thousands = absNum / 1e3;
        return `$${sign}${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
    } else {
        return `$${sign}${absNum.toFixed(2)}`;
    }
}

function startStocksPolling() {
    // Clear any existing interval first
    stopStocksPolling();

    // Start new polling interval (update every 30 seconds for stocks)
    window.stocksPollingIntervalId = setInterval(loadStockData, 30000);
}

function stopStocksPolling() {
    if (window.stocksPollingIntervalId) {
        clearInterval(window.stocksPollingIntervalId);
        window.stocksPollingIntervalId = null;
    }
}

// Cleanup function - called when tool is unloaded
function cleanupStocksTool() {
    stopStocksPolling();
    // Reset initial load flag for next tool load
    window.isStocksInitialLoad = true;
    window.stocksScriptLoaded = false;
}

// Set up cleanup when tool container is removed
function setupStocksCleanupObserver() {
    const toolContainer = document.querySelector('.tool-container[data-tool-name="dev-tool-stocks"]');
    if (!toolContainer) return;

    // Create mutation observer to watch for removal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node === toolContainer || node.contains(toolContainer)) {
                    cleanupStocksTool();
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
    window.addEventListener('beforeunload', cleanupStocksTool);
}

// Load stock data from server
async function loadStockData() {
    const stocksContent = document.getElementById('stocksContent');
    if (!stocksContent) {
        return; // Tool not loaded yet
    }

    let wasInitialLoad = window.isStocksInitialLoad;

    try {
        // Only show loading on initial load, not on polling updates
        if (window.isStocksInitialLoad) {
            showStocksLoading(true);
        }
        hideStocksError();

        // Only hide content on initial load, not on polling updates
        if (window.isStocksInitialLoad) {
            hideStocksContent();
        }

        const symbol = document.getElementById('stockInput').value || 'AAPL';

        // Load current stock quote
        const quoteResponse = await fetch(`/api/dev-tool-stocks/quote?symbol=${encodeURIComponent(symbol)}`);
        if (!quoteResponse.ok) {
            throw new Error(`Server error: ${quoteResponse.status}`);
        }
        const quoteResult = await quoteResponse.json();
        if (!quoteResult.success) {
            throw new Error(quoteResult.error || 'Failed to load stock data');
        }

        // Load popular stocks for market overview
        const popularResponse = await fetch('/api/dev-tool-stocks/popular');
        if (!popularResponse.ok) {
            throw new Error(`Server error: ${popularResponse.status}`);
        }
        const popularResult = await popularResponse.json();
        if (!popularResult.success) {
            throw new Error(popularResult.error || 'Failed to load popular stocks');
        }

        // Load quotes for popular stocks
        const marketStocks = [];
        for (const popularSymbol of popularResult.data.slice(0, 6)) {  // Limit to 6
            try {
                const marketResponse = await fetch(`/api/dev-tool-stocks/quote?symbol=${encodeURIComponent(popularSymbol)}`);
                if (marketResponse.ok) {
                    const marketResult = await marketResponse.json();
                    if (marketResult.success) {
                        marketStocks.push(marketResult.data);
                    }
                }
            } catch (e) {
                // Skip failed requests
                continue;
            }
        }

        displayStockData(quoteResult.data, marketStocks);
        window.isStocksInitialLoad = false; // Mark that initial load is complete

        // Start polling after initial load is complete
        startStocksPolling();
    } catch (error) {
        console.error('Error loading stock data:', error);
        showStocksError(error.message);
    } finally {
        if (wasInitialLoad) {
            showStocksLoading(false);
        }
    }
}

// Display stock data in the UI
function displayStockData(stockData, marketStocks) {
    // Update current stock
    document.getElementById('stockSymbol').textContent = stockData.symbol;
    document.getElementById('stockPrice').textContent = `$${stockData.price.toFixed(2)}`;

    const changeElement = document.getElementById('stockChange');
    const changePercentElement = document.getElementById('changePercent');

    const change = stockData.change;
    const changePercent = stockData.change_percent;

    changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
    changePercentElement.textContent = changePercent;

    // Color coding for positive/negative changes
    const isPositive = change >= 0;
    changeElement.className = `stock-change ${isPositive ? 'positive' : 'negative'}`;
    changePercentElement.className = `detail-value ${isPositive ? 'positive' : 'negative'}`;

    // Update other stock details
    document.getElementById('stockVolume').textContent = formatLargeNumber(stockData.volume);
    document.getElementById('stockPrevClose').textContent = `$${stockData.previous_close.toFixed(2)}`;
    document.getElementById('lastUpdate').textContent = stockData.last_updated;

    // Mock additional data (market cap, P/E ratio)
    document.getElementById('marketCap').textContent = formatLargeNumber(stockData.price * 1000000000);
    document.getElementById('peRatio').textContent = (Math.random() * 50 + 10).toFixed(1);

    // Update market overview
    const marketStocksContainer = document.getElementById('marketStocks');
    marketStocksContainer.innerHTML = '';

    marketStocks.forEach(stock => {
        const stockCard = document.createElement('div');
        stockCard.className = 'market-stock-card';

        const isPositive = stock.change >= 0;

        stockCard.innerHTML = `
            <div class="market-stock-symbol">${stock.symbol}</div>
            <div class="market-stock-price">$${stock.price.toFixed(2)}</div>
            <div class="market-stock-change ${isPositive ? 'positive' : 'negative'}">
                ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
            </div>
        `;

        marketStocksContainer.appendChild(stockCard);
    });

    // Show content
    showStocksContent();
}

// Event handlers
function setupStocksEventListeners() {
    // Stock search
    const searchBtn = document.getElementById('searchBtn');
    const stockInput = document.getElementById('stockInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            window.isStocksInitialLoad = true; // Reset to show loading
            loadStockData();
        });
    }

    if (stockInput) {
        stockInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.isStocksInitialLoad = true; // Reset to show loading
                loadStockData();
            }
        });
    }

    // Popular stocks
    const stockButtons = document.querySelectorAll('.stock-btn');
    stockButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const symbol = btn.dataset.symbol;
            document.getElementById('stockInput').value = symbol;
            window.isStocksInitialLoad = true; // Reset to show loading
            loadStockData();
        });
    });

    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            window.isStocksInitialLoad = true; // Reset to show loading
            loadStockData();
        });
    }
}

// UI helper functions
function showStocksLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'flex' : 'none';
    }
}

function hideStocksError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.style.display = 'none';
    }
}

function showStocksError(msg) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    if (errorState && errorMessage) {
        errorMessage.textContent = msg;
        errorState.style.display = 'flex';
    }
    showStocksLoading(false);
}

function hideStocksContent() {
    const content = document.getElementById('stocksContent');
    if (content) {
        content.style.display = 'none';
    }
}

function showStocksContent() {
    const content = document.getElementById('stocksContent');
    if (content) {
        content.style.display = 'flex';  // Changed from 'block' to 'flex' to maintain flexbox layout
    }
}

// Auto-load stock on page load
loadStockData();

// Set up event listeners
setupStocksEventListeners();

// Set up cleanup observer
setupStocksCleanupObserver();

// End of script execution guard
}