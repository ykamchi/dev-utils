// Main Application JavaScript
// Initialize all modules and handle app-level functionality

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dev Tools App - Initializing...');
    
    try {
        // Initialize theme manager first
        ThemeService.init();
        console.log('Theme Service initialized');
        
        // Initialize drawer manager
        DrawerManager.init();
        console.log('Drawer Manager initialized');
        
        // Initialize tool loader
        await ToolsService.init();
        console.log('Tools Service initialized');
        
        // Auto-select last used tool after a short delay
        setTimeout(() => {
            ToolsService.autoSelectLastTool();
        }, 500);
        
        console.log('Dev Tools App - Initialization complete');
        
    } catch (error) {
        console.error('Failed to initialize Dev Tools App:', error);
    }
});

// Drawer Manager Module
const DrawerManager = {
    isOpen: false,
    
    init() {
        this.isOpen = this.loadState();
        this.bindEvents();
        this.updateToggleButton();
        
        // Apply initial state
        if (this.isOpen) {
            const drawer = document.getElementById('toolsDrawer');
            if (drawer) {
                drawer.classList.add('open');
            }
        }
    },
    
    bindEvents() {
        const toggleBtn = document.getElementById('drawerToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
        
        // Close drawer when clicking overlay (mobile only)
        const overlay = document.getElementById('drawerOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateToggleButton();
            // Close drawer on resize if switching to mobile
            if (window.innerWidth <= 768 && this.isOpen) {
                this.close();
            }
        });
    },
    
    toggle() {
        this.isOpen ? this.close() : this.open();
    },
    
    open() {
        this.isOpen = true;
        const drawer = document.getElementById('toolsDrawer');
        if (drawer) {
            drawer.classList.add('open');
        }
        
        // Show overlay on mobile
        if (window.innerWidth <= 768) {
            const overlay = document.getElementById('drawerOverlay');
            if (overlay) {
                overlay.classList.add('show');
            }
        }
        
        this.updateToggleButton();
        this.saveState();
    },
    
    close() {
        this.isOpen = false;
        const drawer = document.getElementById('toolsDrawer');
        if (drawer) {
            drawer.classList.remove('open');
        }
        
        // Hide overlay
        const overlay = document.getElementById('drawerOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        
        this.updateToggleButton();
        this.saveState();
    },
    
    updateToggleButton() {
        const toggleBtn = document.getElementById('drawerToggleBtn');
        if (toggleBtn) {
            // Keep burger emoji constant, use CSS class for visual state
            if (this.isOpen) {
                toggleBtn.classList.add('drawer-open');
                toggleBtn.title = 'Close Tools Drawer';
            } else {
                toggleBtn.classList.remove('drawer-open');
                toggleBtn.title = 'Open Tools Drawer';
            }
        }
    },
    
    saveState() {
        localStorage.setItem('drawerOpen', this.isOpen.toString());
    },
    
    loadState() {
        const saved = localStorage.getItem('drawerOpen');
        return saved === 'true';
    }
};

// Global app utilities
const App = {
    // Show notification (you can enhance this with a proper toast system)
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // TODO: Implement proper notification system
    },
    
    // Get app version
    getVersion() {
        return '1.0.0';
    },
    
    // Get app name
    getName() {
        return 'Dev Tools App';
    }
};

// Make App globally available
window.App = App;