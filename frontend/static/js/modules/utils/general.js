// Utility functions for Dev Tools App
// Based on bedrock-utils general.js

const Utils = {
    // Local storage helpers (same as bedrock-utils)
    getLocalStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (error) {
            console.warn(`Failed to get localStorage item ${key}:`, error);
            return defaultValue;
        }
    },

    setLocalStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn(`Failed to set localStorage item ${key}:`, error);
        }
    },

    // Additional utility functions for dev tools
    removeLocalStorageItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove localStorage item ${key}:`, error);
        }
    },

    // Session storage helpers
    getSessionStorageItem(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item !== null ? item : defaultValue;
        } catch (error) {
            console.warn(`Failed to get sessionStorage item ${key}:`, error);
            return defaultValue;
        }
    },

    setSessionStorageItem(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (error) {
            console.warn(`Failed to set sessionStorage item ${key}:`, error);
        }
    },

    removeSessionStorageItem(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.warn(`Failed to remove sessionStorage item ${key}:`, error);
        }
    },

    // JSON storage helpers
    getStorageJSON(key, defaultValue = null, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            const item = storage.getItem(key);
            return item !== null ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Failed to get JSON from storage ${key}:`, error);
            return defaultValue;
        }
    },

    setStorageJSON(key, value, useSession = false) {
        try {
            const storage = useSession ? sessionStorage : localStorage;
            storage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Failed to set JSON to storage ${key}:`, error);
        }
    },

    // Tool state management
    getToolState(toolName, defaultState = {}) {
        return this.getStorageJSON(`dev-tools-${toolName}-state`, defaultState);
    },

    setToolState(toolName, state) {
        this.setStorageJSON(`dev-tools-${toolName}-state`, state);
    },

    // App preferences
    getAppPreference(key, defaultValue = null) {
        return this.getLocalStorageItem(`dev-tools-pref-${key}`, defaultValue);
    },

    setAppPreference(key, value) {
        this.setLocalStorageItem(`dev-tools-pref-${key}`, value);
    },

    // Format utilities
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (format === 'short') {
            return d.toLocaleDateString();
        } else if (format === 'long') {
            return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
        } else if (format === 'iso') {
            return d.toISOString();
        }
        return d.toString();
    },

    // DOM utilities
    createElement(tag, className = '', textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    },

    // Event utilities
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },

    // API utilities
    async fetchJSON(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}