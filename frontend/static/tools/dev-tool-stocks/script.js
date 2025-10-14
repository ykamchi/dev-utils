// Stocks Tool Script
// Standardized object-based architecture with init method

window.tool_script = {
    // Configurable polling interval (30 seconds default)
    pollingInterval: 30000,

    // State variables
    stocksPollingId: null,
    isStocksInitialLoad: true,
    stocksObserver: null,

    // Initialize the stocks tool
    init(container) {
        console.log('[Stocks Tool] Initializing stocks tool...');

        setTimeout(() => {
            this.loadStockData();
            this.setupStocksEventListeners();
            this.setupStocksCleanupObserver();            
        });
    },

    // Number formatting function for large values
    formatLargeNumber: function(num) {
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
    },

    // Start polling for stock updates
    startStocksPolling: function() {
        this.stopStocksPolling(); // Clear any existing polling

        this.stocksPollingId = setInterval(() => {
            this.loadStockData();
        }, this.pollingInterval);
    },

    // Stop polling for stock updates
    stopStocksPolling: function() {
        if (this.stocksPollingId) {
            clearInterval(this.stocksPollingId);
            this.stocksPollingId = null;
        }
    },

    // Set up cleanup observer to stop polling when tool is removed
    setupStocksCleanupObserver: function() {
        const container = document.querySelector('.tool-container[data-tool="dev-tool-stocks"]');

        if (container && window.MutationObserver) {
            this.stocksObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.removedNodes.forEach((node) => {
                            if (node === container || container.contains(node)) {
                                this.stopStocksPolling();
                                if (this.stocksObserver) {
                                    this.stocksObserver.disconnect();
                                }
                            }
                        });
                    }
                });
            });

            // Observe the parent container for removal
            if (container.parentNode) {
                this.stocksObserver.observe(container.parentNode, { childList: true, subtree: true });
            }
        }
    },

    // Load stock data from server
    loadStockData: async function() {
        console.log('[Stocks Tool] Loading stock data...');

        const stocksContent = document.getElementById('stocksContent');
        if (!stocksContent) {
            return; // Tool not loaded yet
        }

        let wasInitialLoad = this.isStocksInitialLoad;

        try {
            // Only show loading on initial load, not on polling updates
            if (this.isStocksInitialLoad) {
                this.showStocksLoading(true);
            }
            this.hideStocksError();

            // Only hide content on initial load, not on polling updates
            if (this.isStocksInitialLoad) {
                this.hideStocksContent();
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

            // Load news for the selected stock
            const newsResponse = await fetch(`/api/dev-tool-stocks/news?symbol=${encodeURIComponent(symbol)}`);
            if (!newsResponse.ok) {
                throw new Error(`Server error: ${newsResponse.status}`);
            }
            const newsResult = await newsResponse.json();
            if (!newsResult.success) {
                throw new Error(newsResult.error || 'Failed to load news');
            }

            this.displayStockData(quoteResult.data, newsResult.data);
            this.isStocksInitialLoad = false; // Mark that initial load is complete

            // Start polling after initial load is complete
            this.startStocksPolling();
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.showStocksError(error.message);
        } finally {
            if (wasInitialLoad) {
                this.showStocksLoading(false);
            }
        }
    },

    // Display stock data in the UI
    displayStockData: function(stockData, newsData) {
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
        document.getElementById('stockVolume').textContent = this.formatLargeNumber(stockData.volume);
        document.getElementById('stockPrevClose').textContent = `$${stockData.previous_close.toFixed(2)}`;
        document.getElementById('lastUpdate').textContent = stockData.last_updated;

        // Clear additional data fields since we don't have real data
        document.getElementById('marketCap').textContent = 'N/A';
        document.getElementById('peRatio').textContent = 'N/A';

        // Update news section
        const newsContainer = document.getElementById('marketStocks');
        newsContainer.innerHTML = '';

        if (newsData && newsData.length > 0) {
            newsData.forEach(news => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';

                newsCard.innerHTML = `
                    <div class="news-title">
                        <a href="${news.url}" target="_blank" rel="noopener noreferrer">${news.title}</a>
                    </div>
                    <div class="news-description">${news.description}</div>
                `;

                newsContainer.appendChild(newsCard);
            });
        } else {
            newsContainer.innerHTML = '<div class="no-news">No recent news found for this stock.</div>';
        }

        // Show content
        this.showStocksContent();
    },

    // Event handlers
    setupStocksEventListeners: function() {
        // Stock search
        const searchBtn = document.getElementById('searchBtn');
        const stockInput = document.getElementById('stockInput');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.isStocksInitialLoad = true; // Reset to show loading
                this.loadStockData();
            });
        }

        if (stockInput) {
            stockInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.isStocksInitialLoad = true; // Reset to show loading
                    this.loadStockData();
                }
            });
        }

        // Popular stocks
        const stockButtons = document.querySelectorAll('.stock-btn');
        stockButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const symbol = btn.dataset.symbol;
                document.getElementById('stockInput').value = symbol;
                this.isStocksInitialLoad = true; // Reset to show loading
                this.loadStockData();
            });
        });

        // Retry button
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.isStocksInitialLoad = true; // Reset to show loading
                this.loadStockData();
            });
        }
    },

    // UI helper functions
    showStocksLoading: function(show) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = show ? 'flex' : 'none';
        }
    },

    hideStocksError: function() {
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'none';
        }
    },

    showStocksError: function(msg) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');
        if (errorState && errorMessage) {
            errorMessage.textContent = msg;
            errorState.style.display = 'flex';
        }
        this.showStocksLoading(false);
    },

    hideStocksContent: function() {
        const content = document.getElementById('stocksContent');
        if (content) {
            content.style.display = 'none';
        }
    },

    showStocksContent: function() {
        const content = document.getElementById('stocksContent');
        if (content) {
            content.style.display = 'flex';  // Changed from 'block' to 'flex' to maintain flexbox layout
        }
    }
};