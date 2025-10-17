// Panel 2 - Interactive Controls Panel
window.example_panel_2 = {
    name: 'Panel 2',
    icon: '🎛️',
    description: 'Interactive controls and settings',

    // Initialize the panel
    init(container, headerStatusContainer) {
        console.log('[Panel 2] Initializing...');
        this.container = container;
        this.headerStatusContainer = headerStatusContainer;
    },

    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[Panel 2] Destroying...');

        console.log('[Panel 2] Destroyed');
    },


    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.updateMetrics(); },
            title: "Update",
            icon: "📊"
        },
        {
            callback: function() { this.saveConfig(); },
            title: "Save",
            icon: "💾"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.resetChart(); },
            title: "Reset Chart",
            icon: "📈"
        },
        {
            callback: function() { this.exportChart(); },
            title: "Export",
            icon: "📤"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[Panel 2] Expanded');
    },

    // onCollapse event triggered
    onCollapse(collapsedStatusContainer) {
        console.log('[Panel 2] Collapsed');
    },

    // Render the panel content
    render() {
        return `
            <div class="panel-2-content">
                <div class="chart-container">
                    <canvas id="performance-chart" width="300" height="200"></canvas>
                </div>
                <div class="metrics">
                    <div class="metric">
                        <span class="metric-label">CPU Usage:</span>
                        <span class="metric-value">45%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 45%"></div>
                        </div>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Memory Usage:</span>
                        <span class="metric-value">67%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 67%"></div>
                        </div>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Disk I/O:</span>
                        <span class="metric-value">23%</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 23%"></div>
                        </div>
                    </div>
                </div>
                <div class="panel-actions">
                    <button class="btn-primary" onclick="panel_2.updateChart()">Update Chart</button>
                    <button class="btn-secondary" onclick="panel_2.exportData()">Export</button>
                </div>
            </div>
        `;
    },

    // Panel-specific methods
    updateVolume(value) {
        this.currentVolume = value;
        document.getElementById('volume-value').textContent = value + '%';
        console.log('Volume updated to:', value);
    },

    changeTheme(theme) {
        this.currentTheme = theme;
        console.log('Theme changed to:', theme);
        // In a real implementation, this would change the actual theme
        alert(`Theme changed to: ${theme}`);
    },

    startProcess() {
        this.processStatus = 'Running';
        document.getElementById('process-status').textContent = 'Running';
        this.animateProgress();
        console.log('Process started');
    },

    pauseProcess() {
        this.processStatus = 'Paused';
        document.getElementById('process-status').textContent = 'Paused';
        console.log('Process paused');
    },

    stopProcess() {
        this.processStatus = 'Stopped';
        document.getElementById('process-status').textContent = 'Stopped';
        document.getElementById('progress-fill').style.width = '0%';
        console.log('Process stopped');
    },

    resetSettings() {
        // Reset volume
        document.getElementById('volume-slider').value = 50;
        this.updateVolume(50);

        // Reset theme
        document.getElementById('theme-select').value = 'light';
        this.changeTheme('light');

        // Reset process
        this.stopProcess();
        this.processStatus = 'Ready';
        document.getElementById('process-status').textContent = 'Ready';

        console.log('Settings reset');
    },

    animateProgress() {
        if (this.processStatus !== 'Running') return;

        const progressFill = document.getElementById('progress-fill');
        let width = 0;

        const interval = setInterval(() => {
            if (this.processStatus !== 'Running' || width >= 100) {
                clearInterval(interval);
                if (width >= 100) {
                    this.processStatus = 'Completed';
                    document.getElementById('process-status').textContent = 'Completed';
                }
                return;
            }
            width += 2;
            progressFill.style.width = width + '%';
        }, 100);
    },

    // New button methods
    toggleFullscreen() {
        console.log('Toggling fullscreen mode...');
        alert('Fullscreen mode toggled!');
    },

    saveConfig() {
        console.log('Saving configuration...');
        alert('Configuration saved!');
    },

    updateMetrics() {
        console.log('Updating metrics...');
        // Update CPU and Memory values randomly
        const cpuValue = Math.floor(Math.random() * 100);
        const memoryValue = Math.floor(Math.random() * 100);

        const cpuElement = document.querySelector('.panel-2-content .metric:nth-child(1) .metric-value');
        const memoryElement = document.querySelector('.panel-2-content .metric:nth-child(2) .metric-value');
        const cpuFill = document.querySelector('.panel-2-content .metric:nth-child(1) .progress-fill');
        const memoryFill = document.querySelector('.panel-2-content .metric:nth-child(2) .progress-fill');

        if (cpuElement) cpuElement.textContent = cpuValue + '%';
        if (memoryElement) memoryElement.textContent = memoryValue + '%';
        if (cpuFill) cpuFill.style.width = cpuValue + '%';
        if (memoryFill) memoryFill.style.width = memoryValue + '%';

        alert('Metrics updated!');
    },

    resetChart() {
        console.log('Resetting chart...');
        alert('Chart reset!');
    },

    exportChart() {
        console.log('Exporting chart...');
        alert('Chart exported!');
    }
};
