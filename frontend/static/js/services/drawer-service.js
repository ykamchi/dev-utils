// Drawer Service Module
// Handles the tools drawer open/close functionality and responsive behavior

const DrawerService = {
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

// Make DrawerService globally available
window.DrawerService = DrawerService;