/**
 * Dev Tool RSS - Frontend JavaScript
 * Handles RSS feed selection and display
 */
window.tool_script = {
    container: null,
    currentFeedId: null,
    feedsData: {},
    pollingInterval: 300000, // 5 minutes for RSS updates

    // Initialize the tool
    async init(container) {
        console.log('[Dev Tool RSS] Initializing...');

        // Store container reference
        this.container = container;

        // Load RSS feeds
        await this.loadFeeds();

        // Set up event listeners
        this.setupEventListeners();

        // Set up cleanup observer
        this.setupCleanupObserver();
    },

    // Load available RSS feeds
    async loadFeeds() {
        try {
            this.showLoading('Loading RSS feeds...');

            const response = await fetch('/api/dev-tool-rss/feeds');
            const data = await response.json();

            if (data.success) {
                // Convert array to object keyed by ID for easy lookup
                if (Array.isArray(data.feeds)) {
                    this.feedsData = {};
                    data.feeds.forEach(feed => {
                        this.feedsData[feed.id] = feed;
                    });
                } else {
                    this.feedsData = data.feeds;
                }
                this.renderFeedGrid(data.feeds);
                this.populateFilters(data.feeds, data.categories);
                this.hideLoading();
            } else {
                throw new Error(data.error || 'Failed to load feeds');
            }
        } catch (error) {
            console.error('[Dev Tool RSS] Error loading feeds:', error);
            this.showError('Failed to load RSS feeds. Please try again.');
        }
    },

    // Render feed selection grid
    renderFeedGrid(feeds) {
        const feedGrid = this.container.querySelector('#feedGrid');
        if (!feedGrid) return;

        feedGrid.innerHTML = '';

        // Handle both object and array formats
        let feedEntries;
        if (Array.isArray(feeds)) {
            feedEntries = feeds.map(feed => [feed.id, feed]);
        } else {
            feedEntries = Object.entries(feeds);
        }

        feedEntries.forEach(([feedId, feed]) => {
            const feedCard = document.createElement('div');
            feedCard.className = 'feed-card';
            feedCard.dataset.feedId = feedId;
            feedCard.dataset.category = feed.category;
            feedCard.dataset.country = feed.country;
            feedCard.dataset.language = feed.language;

            // If feed.image exists, render it; otherwise show category icon as main icon
            const imageHtml = feed.image
                ? `<img class="feed-logo" src="${feed.image}" alt="${feed.name} logo" onerror="this.style.display='none'" />`
                : `<div class="feed-icon">${this.getCategoryIcon(feed.category)}</div>`;

            feedCard.innerHTML = `
                ${imageHtml}
                <div class="feed-details">
                    <h3 class="feed-name">${feed.name}</h3>
                    <p class="feed-description">${feed.description}</p>
                    <div class="feed-tags">
                        <span class="feed-tag category-tag">${feed.category}</span>
                        <span class="feed-tag country-tag">${feed.country}</span>
                    </div>
                </div>
                <div class="feed-arrow">→</div>
            `;

            feedCard.addEventListener('click', () => this.selectFeed(feedId));
            feedGrid.appendChild(feedCard);
        });
    },

    // Get icon for feed category
    getCategoryIcon(category) {
        const icons = {
            'news': '📰',
            'technology': '💻',
            'science': '🔬',
            'business': '💼',
            'sports': '⚽',
            'entertainment': '🎬'
        };
        return icons[category] || '📰';
    },

    // Populate filter dropdowns
    populateFilters(feeds, categories) {
        // Handle both object and array formats
        let feedValues;
        if (Array.isArray(feeds)) {
            feedValues = feeds;
        } else {
            feedValues = Object.values(feeds);
        }

        // Category filter
        const categoryFilter = this.container.querySelector('#categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryFilter.appendChild(option);
            });
        }

        // Country filter
        const countries = [...new Set(feedValues.map(f => f.country))].sort();
        const countryFilter = this.container.querySelector('#countryFilter');
        if (countryFilter) {
            countryFilter.innerHTML = '<option value="">All Countries</option>';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });
        }

        // Language filter
        const languages = [...new Set(feedValues.map(f => f.language))].sort();
        const languageFilter = this.container.querySelector('#languageFilter');
        if (languageFilter) {
            languageFilter.innerHTML = '<option value="">All Languages</option>';
            languages.forEach(language => {
                const option = document.createElement('option');
                option.value = language.toUpperCase();
                option.textContent = language.toUpperCase();
                languageFilter.appendChild(option);
            });
        }
    },

    // Select and load a feed
    async selectFeed(feedId) {
        if (!this.feedsData[feedId]) return;

        this.currentFeedId = feedId;
        const feed = this.feedsData[feedId];

        try {
            this.showLoading('Loading feed content...');

            // Update UI to show content section
            this.container.querySelector('#feedContentSection').style.display = 'flex';
            
            // Make feed grid compact when feed is open
            const feedGrid = this.container.querySelector('.feed-grid');
            if (feedGrid) {
                feedGrid.classList.add('compact');
            }

            // Update feed info
            this.container.querySelector('#selectedFeedTitle').textContent = feed.name;
            this.container.querySelector('#selectedFeedDescription').textContent = feed.description;
            this.container.querySelector('#feedCategory').textContent = feed.category;
            this.container.querySelector('#feedCountry').textContent = feed.country;

            // Load feed content
            await this.loadFeedContent(feedId);

        } catch (error) {
            console.error('[Dev Tool RSS] Error selecting feed:', error);
            this.showError('Failed to load feed content. Please try again.');
        }
    },

    // Load feed content
    async loadFeedContent(feedId) {
        try {
            const response = await fetch(`/api/dev-tool-rss/feed/${feedId}`);
            const data = await response.json();

            if (data.success) {
                this.renderArticles(data.items);
                this.container.querySelector('#lastUpdated').textContent =
                    `Last updated: ${new Date(data.last_updated + 'Z').toLocaleString()}`;
                this.hideLoading();
            } else {
                throw new Error(data.error || 'Failed to load feed content');
            }
        } catch (error) {
            console.error('[Dev Tool RSS] Error loading feed content:', error);
            this.renderError(error.message);
            this.container.querySelector('#lastUpdated').textContent = 'Error loading feed';
            this.hideLoading();
        }
    },

    // Render articles list
    renderArticles(articles) {
        const articlesList = this.container.querySelector('#articlesList');
        if (!articlesList) return;

        articlesList.innerHTML = '';

        if (articles.length === 0) {
            articlesList.innerHTML = `
                <div class="no-articles">
                    <div class="no-articles-icon">📭</div>
                    <p>No articles available</p>
                </div>
            `;
            return;
        }

        articles.forEach((article, index) => {
            const articleElement = document.createElement('article');
            articleElement.className = 'article-item';

            const publishedDate = new Date(article.published + 'Z').toLocaleString();

            articleElement.innerHTML = `
                <div class="article-header">
                    <h4 class="article-title">${article.title}</h4>
                    <div class="article-meta">
                        <span class="article-date">${publishedDate}</span>
                        ${article.author ? `<span class="article-author">by ${article.author}</span>` : ''}
                    </div>
                </div>
                <div class="article-content">
                    <p class="article-description">${article.description}</p>
                    <div class="article-actions">
                        <a href="${article.link}" target="_blank" class="read-more-btn">
                            Read Full Article →
                        </a>
                    </div>
                </div>
            `;

            articlesList.appendChild(articleElement);
        });
    },

    // Render error message in articles list
    renderError(errorMessage) {
        const articlesList = this.container.querySelector('#articlesList');
        if (!articlesList) return;

        articlesList.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <p class="error-text">${errorMessage}</p>
            </div>
        `;
    },

    // Filter feeds based on selected filters
    filterFeeds() {
        const categoryFilter = this.container.querySelector('#categoryFilter').value;
        const countryFilter = this.container.querySelector('#countryFilter').value;
        const languageFilter = this.container.querySelector('#languageFilter').value;

        const feedCards = this.container.querySelectorAll('.feed-card');

        feedCards.forEach(card => {
            const category = card.dataset.category;
            const country = card.dataset.country;
            const language = card.dataset.language;

            const categoryMatch = !categoryFilter || category === categoryFilter;
            const countryMatch = !countryFilter || country === countryFilter;
            const languageMatch = !languageFilter || language === languageFilter;

            if (categoryMatch && countryMatch && languageMatch) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    },

    // Close the current feed
    closeFeed() {
        this.container.querySelector('#feedContentSection').style.display = 'none';
        
        // Restore full feed grid when feed is closed
        const feedGrid = this.container.querySelector('.feed-grid');
        if (feedGrid) {
            feedGrid.classList.remove('compact');
        }
        
        this.currentFeedId = null;
    },

    // Refresh current feed
    async refreshFeed() {
        if (this.currentFeedId) {
            await this.loadFeedContent(this.currentFeedId);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Filter change events
        this.container.querySelector('#categoryFilter')?.addEventListener('change', () => this.filterFeeds());
        this.container.querySelector('#countryFilter')?.addEventListener('change', () => this.filterFeeds());
        this.container.querySelector('#languageFilter')?.addEventListener('change', () => this.filterFeeds());

        // Navigation events
        this.container.querySelector('#closeFeedBtn')?.addEventListener('click', () => this.closeFeed());
        this.container.querySelector('#refreshFeedBtn')?.addEventListener('click', () => this.refreshFeed());

        // Error handling
        this.container.querySelector('#retryBtn')?.addEventListener('click', () => this.loadFeeds());

        // Drag-to-scroll for compact feed grid
        this.setupDragToScroll();
    },

        // Setup drag-to-scroll functionality for compact feed grid
    setupDragToScroll() {
        const feedGrid = this.container.querySelector('.feed-grid');
        if (!feedGrid) return;

        let isDragging = false;
        let startX;
        let scrollLeft;
        let hasMoved = false;
        const dragThreshold = 5; // Minimum pixels to move before considering it a drag

        // Mouse events
        const handleMouseDown = (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.pageX - feedGrid.offsetLeft;
            scrollLeft = feedGrid.scrollLeft;
            feedGrid.style.cursor = 'grabbing';
            feedGrid.style.userSelect = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - feedGrid.offsetLeft;
            const deltaX = Math.abs(x - startX);
            
            // Check if movement exceeds threshold
            if (deltaX > dragThreshold) {
                hasMoved = true;
            }
            
            const walk = (x - startX) * 2; // Scroll speed multiplier
            feedGrid.scrollLeft = scrollLeft - walk;
        };

        const handleMouseUp = (e) => {
            const wasDragging = hasMoved;
            isDragging = false;
            hasMoved = false;
            feedGrid.style.cursor = 'grab';
            feedGrid.style.userSelect = '';
            
            // If it was a drag, prevent click events on child elements
            if (wasDragging) {
                e.stopPropagation();
                // Prevent click events on feed cards
                const feedCards = feedGrid.querySelectorAll('.feed-card');
                feedCards.forEach(card => {
                    card.style.pointerEvents = 'none';
                    setTimeout(() => {
                        card.style.pointerEvents = '';
                    }, 10);
                });
            }
        };

        const handleMouseLeave = () => {
            if (isDragging) {
                handleMouseUp({ stopPropagation: () => {} });
            }
        };

        // Touch events for mobile
        const handleTouchStart = (e) => {
            isDragging = true;
            hasMoved = false;
            startX = e.touches[0].pageX - feedGrid.offsetLeft;
            scrollLeft = feedGrid.scrollLeft;
        };

        const handleTouchMove = (e) => {
            if (!isDragging) return;
            const x = e.touches[0].pageX - feedGrid.offsetLeft;
            const deltaX = Math.abs(x - startX);
            
            // Check if movement exceeds threshold
            if (deltaX > dragThreshold) {
                hasMoved = true;
            }
            
            const walk = (x - startX) * 2;
            feedGrid.scrollLeft = scrollLeft - walk;
        };

        const handleTouchEnd = (e) => {
            const wasDragging = hasMoved;
            isDragging = false;
            hasMoved = false;
            
            // If it was a drag, prevent click events on child elements
            if (wasDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Add event listeners
        feedGrid.addEventListener('mousedown', handleMouseDown);
        feedGrid.addEventListener('mousemove', handleMouseMove);
        feedGrid.addEventListener('mouseup', handleMouseUp);
        feedGrid.addEventListener('mouseleave', handleMouseLeave);

        feedGrid.addEventListener('touchstart', handleTouchStart, { passive: false });
        feedGrid.addEventListener('touchmove', handleTouchMove, { passive: false });
        feedGrid.addEventListener('touchend', handleTouchEnd, { passive: false });

        // Set initial cursor style for compact mode
        const updateCursor = () => {
            if (feedGrid.classList.contains('compact')) {
                feedGrid.style.cursor = 'grab';
            } else {
                feedGrid.style.cursor = '';
            }
        };

        // Update cursor when compact class is added/removed
        const observer = new MutationObserver(updateCursor);
        observer.observe(feedGrid, { attributes: true, attributeFilter: ['class'] });

        // Initial cursor setup
        updateCursor();
    },

    // Setup cleanup observer
    setupCleanupObserver() {
        // Clean up when tool is destroyed
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node === this.container) {
                            this.destroy();
                        }
                    });
                }
            });
        });

        if (this.container?.parentNode) {
            observer.observe(this.container.parentNode, { childList: true });
        }
    },

    // Destroy the tool
    destroy() {
        console.log('[Dev Tool RSS] Destroying...');
        // Clean up polling if any
        if (this.pollingIntervalId) {
            clearInterval(this.pollingIntervalId);
        }
    },

    // Utility methods
    showLoading(message = 'Loading...') {
        // Hide error state
        this.container.querySelector('#errorState').style.display = 'none';
        this.container.querySelector('#rssContent').style.display = 'flex';

        // You could add a loading overlay here if needed
        console.log(`[Dev Tool RSS] ${message}`);
    },

    hideLoading() {
        // Remove loading state if any
    },

    showError(message) {
        this.container.querySelector('#errorState').style.display = 'flex';
        this.container.querySelector('#rssContent').style.display = 'none';
        this.container.querySelector('#errorMessage').textContent = message;
    }
};