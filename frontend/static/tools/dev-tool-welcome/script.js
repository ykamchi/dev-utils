/**
 * Dev Tool Welcome - Frontend JavaScript
 * Handles loading and displaying the welcome message.
 */

// Load welcome message on initialization
async function loadWelcomeMessage() {
    try {
        showLoading(true);
        hideError();

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

        displayWelcomeMessage(result.data);

    } catch (error) {
        console.error('Error loading welcome message:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

// Display the welcome message
function displayWelcomeMessage(data) {
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
    showContent(true);
}

// UI state management
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

function showContent(show) {
    const welcomeContent = document.getElementById('welcomeContent');
    if (welcomeContent) {
        welcomeContent.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');

    if (errorState) {
        errorState.style.display = 'block';
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    showContent(false);
}

function hideError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.style.display = 'none';
    }
}

// Initialize when the tool loads
document.addEventListener('DOMContentLoaded', function() {
    loadWelcomeMessage();
});

// Auto-load on script execution (for dynamic loading)
loadWelcomeMessage();
