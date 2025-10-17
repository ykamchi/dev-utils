// PC Details Panel - Hardware and OS Information with Tabs
window.pc_details = {
    name: 'PC Details',
    icon: '💻',
    description: 'Comprehensive hardware and operating system information',
    currentTab: 'hardware',
    container: null,
    intervalId: null,

    // Initialize the panel
    init(container) {
        console.log('[PC Details Panel] Initializing...');

        this.container = container;
        this.load(container);
    },
    
    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[PC Details Panel] Destroying...');
        this.stopIntervals();
    },
    
    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.refreshData(); },
            title: "Refresh Data",
            icon: "🔄"
        },
        {
            callback: function() { this.exportInfo(); },
            title: "Export Info",
            icon: "📤"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[PC Details Panel] Expanded');
        await this.startIntervals();
    },

    // onCollapse event triggered
    onCollapse() {
        console.log('[PC Details Panel] Collapsed');
        this.stopIntervals();
    },


    // Render the panel content
    render() {
        return `
            <div class="pc-details-panel">
                <div class="tab-buttons">
                    <button class="tab-button active" data-tab="hardware" onclick="window.pc_details.switchTab('hardware')">
                        🖥️ Hardware
                    </button>
                    <button class="tab-button" data-tab="os" onclick="window.pc_details.switchTab('os')">
                        🖳️ OS & System
                    </button>
                </div>

                <div class="tab-content">
                    <div id="hardware-tab" class="tab-pane active">
                        <div class="info-section">
                            <h4>CPU Information</h4>
                            <div class="info-grid" id="cpu-info">
                                <div class="loading">Loading CPU data...</div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>Memory Information</h4>
                            <div class="info-grid" id="memory-info">
                                <div class="loading">Loading memory data...</div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>Storage Information</h4>
                            <div class="storage-list" id="storage-info">
                                <div class="loading">Loading storage data...</div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>Network Interfaces</h4>
                            <div class="network-list" id="network-info">
                                <div class="loading">Loading network data...</div>
                            </div>
                        </div>
                    </div>

                    <div id="os-tab" class="tab-pane">
                        <div class="info-section">
                            <h4>Operating System</h4>
                            <div class="info-grid" id="os-info">
                                <div class="loading">Loading OS data...</div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>System Information</h4>
                            <div class="info-grid" id="system-info">
                                <div class="loading">Loading system data...</div>
                            </div>
                        </div>

                        <div class="info-section">
                            <h4>Active Users</h4>
                            <div class="users-list" id="users-info">
                                <div class="loading">Loading users data...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Load panel content
    async load(container) {
        try {
            container.innerHTML = this.render();
            await this.loadData();
        } catch (error) {
            container.innerHTML = '<p>Error loading PC details panel</p>';
            console.error('PC details panel error:', error);
        }
    },

    // Unload panel (cleanup)
    unload(container) {
        console.log('PC details panel unloaded');
    },

    // Switch between tabs
    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        const tabButtons = this.container.querySelectorAll('.tab-button');
        const tabPanes = this.container.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            if (button.dataset.tab === tabName) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        tabPanes.forEach(pane => {
            if (pane.id === `${tabName}-tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    },

    // Load all data
    async loadData() {
        await Promise.all([
            this.loadHardwareData(),
            this.loadOSData()
        ]);
    },

    // Refresh data
    async refreshData() {
        await this.loadData();
    },

    // Start automatic data updates
    async startIntervals() {
        // Initial load
        await this.refreshData();

        // Set up interval for updates every 30 seconds
        this.intervalId = setInterval(async () => {
            await this.refreshData();
        }, 30000);
    },

    // Stop automatic data updates
    stopIntervals() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Load hardware information
    async loadHardwareData() {
        try {
            const response = await fetch('/api/dev-tool-system-info/hardware');
            const result = await response.json();

            if (result.success) {
                this.updateHardwareDisplay(result.data);
            } else {
                this.showHardwareError('Failed to load hardware data');
            }
        } catch (error) {
            this.showHardwareError('Network error loading hardware data');
            console.error('Hardware data error:', error);
        }
    },

    // Load OS information
    async loadOSData() {
        try {
            const response = await fetch('/api/dev-tool-system-info/os');
            const result = await response.json();

            if (result.success) {
                this.updateOSDisplay(result.data);
            } else {
                this.showOSError('Failed to load OS data');
            }
        } catch (error) {
            this.showOSError('Network error loading OS data');
            console.error('OS data error:', error);
        }
    },

    // Update hardware display
    updateHardwareDisplay(data) {
        this.updateCPUInfo(data.cpu);
        this.updateMemoryInfo(data.memory);
        this.updateStorageInfo(data.disks);
        this.updateNetworkInfo(data.network);
    },

    // Update CPU information display
    updateCPUInfo(cpu) {
        const container = this.container.querySelector('#cpu-info');
        if (!container) return;

        container.innerHTML = `
            <div class="info-row"><span class="label">Physical Cores:</span><span class="value">${cpu.physical_cores || 'N/A'}</span></div>
            <div class="info-row"><span class="label">Logical Cores:</span><span class="value">${cpu.logical_cores || 'N/A'}</span></div>
            <div class="info-row"><span class="label">Current Frequency:</span><span class="value">${cpu.cpu_freq_current ? cpu.cpu_freq_current.toFixed(1) + ' MHz' : 'N/A'}</span></div>
            <div class="info-row"><span class="label">Max Frequency:</span><span class="value">${cpu.cpu_freq_max ? cpu.cpu_freq_max.toFixed(1) + ' MHz' : 'N/A'}</span></div>
            <div class="info-row"><span class="label">CPU Usage:</span><span class="value">${cpu.cpu_percent ? cpu.cpu_percent.toFixed(1) + '%' : 'N/A'}</span></div>
            <div class="info-row"><span class="label">Per Core Usage:</span><span class="value">${cpu.cpu_percent_per_core ? cpu.cpu_percent_per_core.map(p => p.toFixed(1) + '%').join(', ') : 'N/A'}</span></div>
        `;
    },

    // Update memory information display
    updateMemoryInfo(memory) {
        const container = this.container.querySelector('#memory-info');
        if (!container) return;

        container.innerHTML = `
            <div class="info-row"><span class="label">Total Memory:</span><span class="value">${memory.total_gb} GB</span></div>
            <div class="info-row"><span class="label">Used Memory:</span><span class="value">${memory.used_gb} GB (${memory.percentage}%)</span></div>
            <div class="info-row"><span class="label">Available Memory:</span><span class="value">${memory.available_gb} GB</span></div>
            <div class="info-row"><span class="label">Cached Memory:</span><span class="value">${memory.cached_gb} GB</span></div>
            <div class="info-row"><span class="label">Buffers:</span><span class="value">${memory.buffers_gb} GB</span></div>
        `;
    },

    // Update storage information display
    updateStorageInfo(disks) {
        const container = this.container.querySelector('#storage-info');
        if (!container) return;

        if (!disks || disks.length === 0) {
            container.innerHTML = '<div class="no-data">No disk information available</div>';
            return;
        }

        const diskHtml = disks.map(disk => `
            <div class="disk-item">
                <div class="disk-header">
                    <strong>${disk.device}</strong> (${disk.filesystem})
                </div>
                <div class="disk-details">
                    <div>Mount: ${disk.mountpoint}</div>
                    <div>Total: ${disk.total_gb} GB</div>
                    <div>Used: ${disk.used_gb} GB (${disk.percentage}%)</div>
                    <div>Free: ${disk.free_gb} GB</div>
                </div>
                <div class="disk-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${disk.percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = diskHtml;
    },

    // Update network information display
    updateNetworkInfo(network) {
        const container = this.container.querySelector('#network-info');
        if (!container) return;

        if (!network || network.length === 0) {
            container.innerHTML = '<div class="no-data">No network interfaces found</div>';
            return;
        }

        const networkHtml = network.map(interface => `
            <div class="network-item">
                <div class="network-header">
                    <strong>${interface.name}</strong>
                </div>
                <div class="network-addresses">
                    ${interface.addresses.map(addr => `
                        <div class="address">
                            <span class="ip">${addr.ip}</span>
                            <span class="netmask">${addr.netmask}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        container.innerHTML = networkHtml;
    },

    // Update OS display
    updateOSDisplay(data) {
        this.updateOSInfo(data);
        this.updateSystemInfo(data);
        this.updateUsersInfo(data.users);
    },

    // Update OS information display
    updateOSInfo(data) {
        const container = document.getElementById('os-info');
        if (!container) return;

        container.innerHTML = `
            <div class="info-row"><span class="label">System:</span><span class="value">${data.system}</span></div>
            <div class="info-row"><span class="label">Release:</span><span class="value">${data.release}</span></div>
            <div class="info-row"><span class="label">Version:</span><span class="value">${data.version}</span></div>
            <div class="info-row"><span class="label">Architecture:</span><span class="value">${data.architecture ? data.architecture.join(', ') : 'Unknown'}</span></div>
            <div class="info-row"><span class="label">Processor:</span><span class="value">${data.processor || 'Unknown'}</span></div>
            <div class="info-row"><span class="label">Python Version:</span><span class="value">${data.python_version}</span></div>
        `;
    },

    // Update system information display
    updateSystemInfo(data) {
        const container = this.container.querySelector('#system-info');
        if (!container) return;

        const uptime = this.formatUptime(data.uptime_seconds);
        const bootTime = new Date(data.boot_time).toLocaleString();

        container.innerHTML = `
            <div class="info-row"><span class="label">Hostname:</span><span class="value">${data.hostname}</span></div>
            <div class="info-row"><span class="label">Boot Time:</span><span class="value">${bootTime}</span></div>
            <div class="info-row"><span class="label">Uptime:</span><span class="value">${uptime}</span></div>
            <div class="info-row"><span class="label">Machine:</span><span class="value">${data.machine}</span></div>
        `;
    },

    // Update users information display
    updateUsersInfo(users) {
        const container = this.container.querySelector('#users-info');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = '<div class="no-data">No active users found</div>';
            return;
        }

        const usersHtml = users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <strong>${user.name}</strong>
                    <div class="user-details">
                        Terminal: ${user.terminal || 'N/A'} |
                        Host: ${user.host || 'Local'} |
                        Started: ${new Date(user.started).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHtml;
    },

    // Format uptime seconds into human readable format
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        return parts.join(' ') || 'Less than 1 minute';
    },

    // Show hardware error
    showHardwareError(message) {
        const containers = ['cpu-info', 'memory-info', 'storage-info', 'network-info'];
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="error">${message}</div>`;
            }
        });
    },

    // Show OS error
    showOSError(message) {
        const containers = ['os-info', 'system-info', 'users-info'];
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = `<div class="error">${message}</div>`;
            }
        });
    },

    // Export information
    exportInfo() {
        // This would export the information to a file or clipboard
        alert('Export functionality would be implemented here');
    }
};