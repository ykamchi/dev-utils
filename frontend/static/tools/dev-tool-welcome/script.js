/**
 * Dev Tool Welcome - Frontend JavaScript
 * Handles loading and displaying the welcome message.
 */
window.tool_script = {
    container: null,

    // Initialize the panel
    async init(container) {
        console.log('[Dev Tool Welcome] Initializing...');

        // Store container reference - the tool container div that holds the tool content
        this.container = container;

        // Auto-load on script execution (for dynamic loading)
        await this.loadWelcomeMessage();

    },

    // Load welcome message on initialization
    async loadWelcomeMessage() {
        console.log('[Dev Tool Welcome] Loading welcome message...');

        try {
            this.showLoading(true);
            this.hideError();

            const response = await fetch('/api/dev-tool-welcome/message', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to load welcome message');
            }

            this.displayWelcomeMessage(result.data);

        } catch (error) {
            console.error('Error loading welcome message:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    },

    // Display the welcome message
    displayWelcomeMessage(data) {
        console.log('[Dev Tool Welcome] Displaying welcome message:', data);

        const welcomeMessage = document.getElementById('welcomeMessage');
        const welcomeSubtitle = document.getElementById('welcomeSubtitle');
        const serverTime = document.getElementById('serverTime');
        const serverStatus = document.getElementById('serverStatus');
        const timestamp = document.getElementById('timestamp');

        if (welcomeMessage) {
            welcomeMessage.textContent = data.message;
        }

        if (welcomeSubtitle) {
            welcomeSubtitle.textContent = data.subtitle;
        }

        if (serverTime) {
            serverTime.textContent = data.server_time;
        }

        if (serverStatus) {
            serverStatus.innerHTML = `
                <span class="status-icon">💚</span>
                <span>${data.status}</span>
            `;
        }

        if (timestamp) {
            timestamp.textContent = data.timestamp;
        }

        // Show the content
        this.showContent(true);
    },

    // UI state management
    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = show ? 'block' : 'none';
        }
    },

    showContent(show) {
        const welcomeContent = document.getElementById('welcomeContent');
        if (welcomeContent) {
            welcomeContent.style.display = show ? 'block' : 'none';
        }
    },

    showError(message) {
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');

        if (errorState) {
            errorState.style.display = 'block';
        }

        if (errorMessage) {
            errorMessage.textContent = message;
        }

        showContent(false);
    },

    hideError() {
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'none';
        }
    }
};
