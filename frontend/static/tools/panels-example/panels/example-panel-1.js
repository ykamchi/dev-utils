// Panel 1 - Basic Information Panel
window.example_panel_1 = {
    name: 'Panel 1',
    icon: '📊',
    description: 'Basic information and statistics',

    // Initialize the panel
    init(container, headerStatusContainer) {
        console.log('[Panel 1] Initializing...');
        this.container = container;
        this.headerStatusContainer = headerStatusContainer;
    },

    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[Panel 1] Destroying...');


        console.log('[Panel 1] Destroyed');
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.showDetails(); },
            title: "Details",
            icon: "ℹ️"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.showDetails(); },
            title: "Details",
            icon: "ℹ️"
        },
        {
            callback: function() { this.resetStats(); },
            title: "Reset",
            icon: "🔄"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[Panel 1] Expanded');
    },

    // onCollapse event triggered
    onCollapse(collapsedStatusContainer) {
        console.log('[Panel 1] Collapsed');
    },

    // Render the panel content
    render() {
        return `
            <div class="panel-1-content">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="label">Status:</span>
                        <span class="value">Active</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Version:</span>
                        <span class="value">1.0.0</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Uptime:</span>
                        <span class="value">24h 32m</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Memory:</span>
                        <span class="value">2.4 GB / 8 GB</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Panel-specific methods
    refreshData() {
        console.log('Refreshing Panel 1 data...');
        // Simulate data refresh
        const statusElement = document.querySelector('.panel-1-content .info-item:nth-child(3) .value');
        if (statusElement) {
            const now = new Date();
            statusElement.textContent = `${Math.floor(Math.random() * 72)}h ${Math.floor(Math.random() * 60)}m`;
        }
    },

    showDetails() {
        alert('Detailed system information would be shown here.');
    },

    toggleAutoRefresh() {
        console.log('Toggling auto refresh...');
        alert('Auto refresh toggled!');
    },

    exportData() {
        console.log('Exporting data...');
        alert('Data exported successfully!');
    },

    resetStats() {
        console.log('Resetting statistics...');
        // Reset uptime and memory values
        const uptimeElement = document.querySelector('.panel-1-content .info-item:nth-child(3) .value');
        const memoryElement = document.querySelector('.panel-1-content .info-item:nth-child(4) .value');
        if (uptimeElement) uptimeElement.textContent = '0h 0m';
        if (memoryElement) memoryElement.textContent = '0 GB / 8 GB';
        alert('Statistics reset!');
    }
};
