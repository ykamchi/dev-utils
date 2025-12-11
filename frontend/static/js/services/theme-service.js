// Theme Service Module
// Handles theme switching and persistence
// Based on bedrock-utils theme-manager.js with exact same themes

const ThemeService = {
    currentTheme: 'default', // Default theme

    // Initialize theme on page load
    init() {
        // Load saved theme from localStorage
        this.loadTheme();

        // Apply the theme
        this.applyTheme();

        // Update theme selector
        this.updateSelector();
    },

    // Load theme from localStorage
    loadTheme() {
        try {
            const savedTheme = StorageService.getLocalStorageItem('dev-tools-theme');
            if (savedTheme && this.isValidTheme(savedTheme)) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.warn('Failed to load theme from localStorage:', error);
        }
    },

    // Save current theme to localStorage
    saveTheme() {
        try {
            StorageService.setLocalStorageItem('dev-tools-theme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    },

    // Check if theme is valid (same themes as bedrock-utils)
    isValidTheme(theme) {
        const validThemes = [
            'default', 
            'monochrome', 
            'mahogany', 
            'regal-dark', 
            'sage-stone', 
            'provincial', 
            'dark-modern', 
            'light-modern', 
            'github-dark', 
            'solarized-dark', 
            'dracula', 
            'one-dark-pro',
            'natural-neutral',
            'natural-green',
            'natural-blue',
            'natural-red'
        ];
        return validThemes.includes(theme);
    },

    // Set theme to a specific value
    setTheme(theme) {
        if (this.isValidTheme(theme)) {
            this.currentTheme = theme;
            this.saveTheme();
            this.applyTheme();
            this.updateSelector();
            
            // Keep focus on the theme selector for better UX
            const selector = document.getElementById('theme-select');
            if (selector) {
                selector.focus();
            }
        }
    },

    // Apply the current theme to the document
    applyTheme() {
        const body = document.getElementById('page-body');
        if (!body) return;
        
        // Remove any existing theme classes
        body.className = '';

        // Add the new theme class, if it's not the default
        if (this.currentTheme !== 'default') {
            body.classList.add('theme-' + this.currentTheme);
        }
    },

    // Update the theme selector based on current theme
    updateSelector() {
        const selector = document.getElementById('theme-select');
        if (selector) {
            selector.value = this.currentTheme;
        }
    }
};

// Make ThemeService globally available
window.ThemeService = ThemeService;