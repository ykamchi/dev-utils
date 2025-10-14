// Network Interfaces Panel - Comprehensive Network Information
window.network = {
    name: 'Network',
    icon: '🌐',
    description: 'Network interfaces and connection information',
    intervalId: null,
    container: null,

    // Initialize the panel
    init(container) {
        this.container = container;
        this.load(container);
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { window.network.refreshNetwork(); },
            title: "Refresh Network",
            icon: "🔄"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { window.network.toggleDetails(); },
            title: "Toggle Details",
            icon: "ℹ️"
        }
    ],

    // Panel state
    showDetails: true,

    // Render the panel content
    render() {
        return `
            <div class="network-panel">
                <div class="network-summary">
                    <div class="network-icon">🌐</div>
                    <div class="network-main-info">
                        <div class="network-interfaces-count">-- interfaces</div>
                        <div class="network-status">Loading...</div>
                    </div>
                </div>

                <div class="network-interfaces" id="network-interfaces">
                    <!-- Interfaces will be populated here -->
                </div>

                <div class="network-details" id="network-details">
                    <div class="network-totals">
                        <h4>Total Network Traffic</h4>
                        <div class="traffic-stats">
                            <div class="stat-row">
                                <span class="label">Data Sent:</span>
                                <span class="value" id="total-sent">--</span>
                            </div>
                            <div class="stat-row">
                                <span class="label">Data Received:</span>
                                <span class="value" id="total-recv">--</span>
                            </div>
                            <div class="stat-row">
                                <span class="label">Packets Sent:</span>
                                <span class="value" id="total-packets-sent">--</span>
                            </div>
                            <div class="stat-row">
                                <span class="label">Packets Received:</span>
                                <span class="value" id="total-packets-recv">--</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="network-advice" id="network-advice"></div>
            </div>
        `;
    },

    // Load panel content
    async load(container) {
        try {
            container.innerHTML = this.render();
            await this.startNetworkMonitor();
        } catch (error) {
            container.innerHTML = '<p>Error loading network panel</p>';
            console.error('Network panel error:', error);
        }
    },

    // Unload panel (cleanup)
    unload(container) {
        this.stopNetworkMonitor();
        console.log('Network panel unloaded');
    },

    // Start network monitoring
    async startNetworkMonitor() {
        // Initial load
        await this.refreshNetwork();

        // Update every 10 seconds (network stats change more frequently)
        this.intervalId = setInterval(async () => {
            await this.refreshNetwork();
        }, 10000);
    },

    // Stop network monitoring
    stopNetworkMonitor() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Refresh network data
    async refreshNetwork() {
        try {
            const response = await fetch('/api/dev-tool-system-info/network');
            const result = await response.json();

            if (result.success) {
                this.updateDisplay(result.data);
            } else {
                this.showError('Failed to load network data');
            }
        } catch (error) {
            this.showError('Network error loading network info');
            console.error('Network refresh error:', error);
        }
    },

    // Update the display with new network data
    updateDisplay(networkData) {
        const container = this.container;

        if (networkData.error) {
            this.showError(networkData.error);
            return;
        }

        const interfacesCount = container.querySelector('.network-interfaces-count');
        const statusElement = container.querySelector('.network-status');
        const interfacesContainer = container.querySelector('#network-interfaces');

        // Update summary
        const activeInterfaces = networkData.interfaces.filter(iface => iface.stats.isup).length;
        if (interfacesCount) {
            interfacesCount.textContent = `${networkData.interfaces.length} interfaces (${activeInterfaces} active)`;
        }
        if (statusElement) {
            statusElement.textContent = activeInterfaces > 0 ? 'Connected' : 'No active connections';
        }

        // Update interfaces list
        if (interfacesContainer) {
            interfacesContainer.innerHTML = networkData.interfaces.map(iface => this.renderInterface(iface)).join('');
        }

        // Update totals
        this.updateTotals(networkData.total_counters);

        // Show advice
        this.updateAdvice(networkData);
    },

    // Render a single network interface
    renderInterface(iface) {
        const addresses = iface.addresses.filter(addr => addr.family === 'IPv4' || addr.family === 'IPv6');
        const macAddress = iface.addresses.find(addr => addr.family === 'MAC');
        const isUp = iface.stats.isup;

        return `
            <div class="network-interface ${isUp ? 'active' : 'inactive'}">
                <div class="interface-header">
                    <div class="interface-name">
                        <span class="interface-icon">${isUp ? '🟢' : '🔴'}</span>
                        <span class="name">${iface.name}</span>
                    </div>
                    <div class="interface-status">
                        ${isUp ? 'Up' : 'Down'}
                        ${iface.stats.speed ? ` (${iface.stats.speed} Mbps)` : ''}
                    </div>
                </div>

                <div class="interface-details">
                    ${macAddress ? `<div class="detail-row"><span class="label">MAC:</span><span class="value">${macAddress.address}</span></div>` : ''}
                    ${addresses.map(addr => `
                        <div class="detail-row">
                            <span class="label">${addr.family}:</span>
                            <span class="value">${addr.address}${addr.netmask ? `/${this.netmaskToCIDR(addr.netmask)}` : ''}</span>
                        </div>
                    `).join('')}

                    <div class="traffic-row">
                        <div class="traffic-item">
                            <span class="label">Sent:</span>
                            <span class="value">${this.formatBytes(iface.counters.bytes_sent || 0)}</span>
                        </div>
                        <div class="traffic-item">
                            <span class="label">Received:</span>
                            <span class="value">${this.formatBytes(iface.counters.bytes_recv || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Update total network statistics
    updateTotals(totals) {
        const container = this.container;
        const sentElement = container.querySelector('#total-sent');
        const recvElement = container.querySelector('#total-recv');
        const packetsSentElement = container.querySelector('#total-packets-sent');
        const packetsRecvElement = container.querySelector('#total-packets-recv');

        if (sentElement) sentElement.textContent = this.formatBytes(totals.bytes_sent || 0);
        if (recvElement) recvElement.textContent = this.formatBytes(totals.bytes_recv || 0);
        if (packetsSentElement) packetsSentElement.textContent = this.formatNumber(totals.packets_sent || 0);
        if (packetsRecvElement) packetsRecvElement.textContent = this.formatNumber(totals.packets_recv || 0);
    },

    // Update network advice
    updateAdvice(networkData) {
        const adviceElement = this.container.querySelector('#network-advice');
        if (!adviceElement) return;

        let advice = '';
        let adviceClass = 'network-advice';

        const activeInterfaces = networkData.interfaces.filter(iface => iface.stats.isup).length;

        if (activeInterfaces === 0) {
            advice = '⚠️ No active network interfaces detected.';
            adviceClass += ' warning';
        } else if (activeInterfaces === 1) {
            advice = 'ℹ️ Connected via single interface.';
            adviceClass += ' info';
        } else {
            advice = `ℹ️ Connected via ${activeInterfaces} interfaces.`;
            adviceClass += ' info';
        }

        adviceElement.textContent = advice;
        adviceElement.className = adviceClass;
    },

    // Toggle details visibility
    toggleDetails() {
        this.showDetails = !this.showDetails;
        const detailsElement = this.container.querySelector('#network-details');

        if (detailsElement) {
            if (this.showDetails) {
                detailsElement.style.display = 'block';
            } else {
                detailsElement.style.display = 'none';
            }
        }
    },

    // Utility: Format bytes to human readable
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Utility: Format large numbers
    formatNumber(num) {
        return num.toLocaleString();
    },

    // Utility: Convert netmask to CIDR notation
    netmaskToCIDR(netmask) {
        if (!netmask) return '';
        const parts = netmask.split('.');
        let cidr = 0;
        for (const part of parts) {
            const binary = parseInt(part).toString(2);
            cidr += binary.split('1').length - 1;
        }
        return cidr;
    },

    // Show error state
    showError(message) {
        const container = this.container;
        const interfacesCount = container.querySelector('.network-interfaces-count');
        const statusElement = container.querySelector('.network-status');
        const adviceElement = container.querySelector('#network-advice');

        if (interfacesCount) interfacesCount.textContent = '-- interfaces';
        if (statusElement) statusElement.textContent = `❌ ${message}`;
        if (adviceElement) {
            adviceElement.textContent = 'Unable to monitor network status';
            adviceElement.className = 'network-advice error';
        }
    }
};