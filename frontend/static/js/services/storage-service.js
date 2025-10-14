// Storage service for Dev Tools App
// Handles localStorage, sessionStorage, tool state management, and API utilities

const StorageService = {
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
    // Example usage:
    // const state = StorageService.getToolState('dev-tool-weather', { city: 'New York' });
    // StorageService.setToolState('dev-tool-weather', { city: 'London' });
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
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageService;
} else {
    window.StorageService = StorageService;
}