// SVG Service for Dev Tools App
// Handles SVG icon content and generation for UI components

const SVGService = {
    // Storage for loaded SVG content
    svgContents: {},

    // Cache of icons that don't exist (to avoid repeated failed requests)
    missingIcons: new Set(),

    // Initialize service (no-op for now, icons load on demand)
    init() {
        console.log('[SVGService] SVG service initialized (lazy loading enabled)');
    },

    // Get SVG content as string by icon name (loads on demand)
    getSVGContent(iconName) {
        // Return cached content if already loaded
        if (this.svgContents[iconName]) {
            return this.svgContents[iconName];
        }

        // Return empty if we know this icon doesn't exist
        if (this.missingIcons.has(iconName)) {
            return '';
        }

        // Try to load the icon
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', `/static/assets/icons/${iconName}.svg`, false); // synchronous
            xhr.send();

            if (xhr.status === 200) {
                this.svgContents[iconName] = xhr.responseText;
                console.log(`[SVGService] Loaded SVG: ${iconName}`);
                return this.svgContents[iconName];
            } else {
                // Icon doesn't exist
                this.missingIcons.add(iconName);
                return '';
            }
        } catch (error) {
            // Error loading icon
            this.missingIcons.add(iconName);
            return '';
        }
    },

    // Get list of available icon names (returns currently loaded icons)
    getAvailableIcons() {
        return Object.keys(this.svgContents);
    },

    // Preload specific icons (useful for critical icons)
    preloadIcons(iconNames) {
        iconNames.forEach(iconName => {
            this.getSVGContent(iconName); // This will load and cache it
        });
    }
};

// Initialize the service when the script loads
SVGService.init();

// Preload critical icons that are used immediately
SVGService.preloadIcons([
    'info',
    'collapse',
    'fullscreen',
    'exit-fullscreen',
    'triangle-up-red',
    'triangle-down-blue'
]);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGService;
} else {
    window.SVGService = SVGService;
}