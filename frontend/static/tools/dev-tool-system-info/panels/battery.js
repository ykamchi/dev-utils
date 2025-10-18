// Battery Status Panel - Comprehensive Battery Information
window.battery = {
    name: 'Battery',
    icon: '🔋',
    description: 'Battery status and power information',
    intervalId: null,
    container: null,
    headerStatusContainer: null,
    collapsedStatusContainer: null,

    // Initialize the panel
    async init(container, headerStatusContainer) {
        console.log('[Battery Panel] Initializing...');

        // Store container reference - this container holds the panel content
        this.container = container;

        // Store header status container reference - this container holds the status in the panel header 
        this.headerStatusContainer = headerStatusContainer;

        // Start the battery monitoring
        await this.startBatteryMonitor();
    },

    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[Battery Panel] Destroying...');
        
        this.stopBatteryMonitor();
        console.log('Battery panel destroyed');
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.refreshBattery(); },
            title: "Refresh Battery",
            icon: "🔄"
        },
        {
            callback: function() { this.toggleDetails(); },
            title: "Toggle Details",
            icon: "ℹ️"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[Battery Panel] Expanded');
    },

    // onCollapse event triggered
    async onCollapse(collapsedStatusContainer) {
        console.log('[Battery Panel] Collapsed');

        // Store collapsed status container reference - this container holds the status in collapsed mode   
        this.collapsedStatusContainer = collapsedStatusContainer;

        // Start the battery monitoring
        this.startBatteryMonitor();
    },


    // Panel state
    showDetails: true,

    // Render the panel content
    render() {
        console.log('[Battery Panel] Rendering content...');

        return `
            <div class="battery-panel">
                <div class="battery-header">
                    <div class="battery-icon" id="battery-icon">🔋</div>
                    <div class="battery-main-info">
                        <div class="battery-percentage" id="battery-percentage">--%</div>
                        <div class="battery-status" id="battery-status">Loading...</div>
                    </div>
                </div>

                <div class="battery-progress-container">
                    <div class="battery-progress-bar">
                        <div class="battery-progress-fill" id="battery-progress-fill" style="width: 0%"></div>
                    </div>
                </div>

                <div class="battery-details" id="battery-details">
                    <div class="detail-row">
                        <span class="label">Charging:</span>
                        <span class="value" id="charging-status">-</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Time Remaining:</span>
                        <span class="value" id="time-remaining">-</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Power Source:</span>
                        <span class="value" id="power-source">-</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Critical Level:</span>
                        <span class="value" id="critical-status">-</span>
                    </div>
                </div>

                <div class="battery-advice" id="battery-advice"></div>
            </div>
        `;
    },

    // Start battery monitoring
    async startBatteryMonitor() {
        // Initial load
        await this.refreshBattery();

        // Update every 30 seconds (battery status doesn't change that frequently)
        this.intervalId = setInterval(async () => {
            await this.refreshBattery();
        }, 30000);
    },

    // Stop battery monitoring
    stopBatteryMonitor() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Refresh battery data
    async refreshBattery() {
        try {
            const response = await fetch('/api/dev-tool-system-info/battery');
            const result = await response.json();

            if (result.success) {
                this.updateDisplay(result.data);
            } else {
                this.showError('Failed to load battery data');
            }
        } catch (error) {
            this.showError('Network error loading battery');
            console.error('Battery refresh error:', error);
        }
    },

    // Update the display with new battery data
    updateDisplay(batteryData) {
        // Update the panel content only if container is available
        if (this.container) {
            const percentageElement = this.container.querySelector('.battery-percentage');
            const statusElement = this.container.querySelector('.battery-status');
            const iconElement = this.container.querySelector('.battery-icon');
            const progressFill = this.container.querySelector('.battery-progress-fill');
            const chargingElement = this.container.querySelector('#charging-status');
            const timeElement = this.container.querySelector('#time-remaining');
            const powerElement = this.container.querySelector('#power-source');
            const criticalElement = this.container.querySelector('#critical-status');
            const adviceElement = this.container.querySelector('.battery-advice');

            if (!batteryData.available) {
                // No battery available (desktop system)
                if (percentageElement) percentageElement.textContent = 'N/A';
                if (statusElement) statusElement.textContent = 'No Battery';
                if (iconElement) iconElement.textContent = '🖥️';
                if (progressFill) progressFill.style.width = '0%';
                if (adviceElement) {
                    adviceElement.textContent = 'This system does not have a battery (likely a desktop computer)';
                    adviceElement.className = 'battery-advice info';
                }
                this.hideDetails();
                return;
            }

            // Update main display
            if (percentageElement) percentageElement.textContent = `${batteryData.percent}%`;
            if (progressFill) {
                progressFill.style.width = `${batteryData.percent}%`;
                // Color based on percentage
                if (batteryData.percent < 20) {
                    progressFill.style.backgroundColor = 'var(--color-warning-error)';
                } else if (batteryData.percent < 50) {
                    progressFill.style.backgroundColor = 'var(--color-highlight)';
                } else {
                    progressFill.style.backgroundColor = 'var(--color-positive-bg-strong)';
                }
            }

            // Update status and icon
            let statusText = '';
            let iconText = '🔋';

            if (batteryData.charging) {
                statusText = 'Charging';
                iconText = '🔌';
            } else if (batteryData.percent < 10) {
                statusText = 'Critical';
                iconText = '🪫';
            } else if (batteryData.percent < 20) {
                statusText = 'Low';
                iconText = '🪫';
            } else if (batteryData.percent > 95) {
                statusText = 'Full';
                iconText = '🔋';
            } else {
                statusText = 'Discharging';
            }

            if (statusElement) statusElement.textContent = statusText;
            if (iconElement) iconElement.textContent = iconText;

            // Update details
            if (chargingElement) chargingElement.textContent = batteryData.charging ? 'Yes' : 'No';
            if (timeElement) timeElement.textContent = batteryData.time_left_formatted || 'Unknown';
            if (powerElement) powerElement.textContent = batteryData.power_plugged ? 'AC Power' : 'Battery';
            if (criticalElement) criticalElement.textContent = batteryData.critical ? 'Yes' : 'No';

            // Show advice
            this.updateAdvice(batteryData);
        }

        // Update header status with battery percentage
        if (this.headerStatusContainer) {
            if (!batteryData.available) {
                this.headerStatusContainer.textContent = "🖥️ No Battery";
            } else {
                const icon = batteryData.charging ? '🔌' : (batteryData.percent < 20 ? '🪫' : '🔋');
                this.headerStatusContainer.textContent = `${icon} ${batteryData.percent}%`;
            }
        }

        // Update collapsed status with battery percentage
        if (this.collapsedStatusContainer) {
            if (!batteryData.available) {
                this.collapsedStatusContainer.textContent = "🖥️ No Battery";
            } else {
                const icon = batteryData.charging ? '🔌' : (batteryData.percent < 20 ? '🪫' : '🔋');
                this.collapsedStatusContainer.textContent = `${icon} ${batteryData.percent}%`;
            }
        }
    },

    // Update battery advice
    updateAdvice(batteryData) {
        if (!this.container) return;
        
        const adviceElement = this.container.querySelector('.battery-advice');
        if (!adviceElement) return;

        let advice = '';
        let adviceClass = 'battery-advice';

        if (!batteryData.available) {
            return; // Already handled above
        }

        if (batteryData.critical) {
            advice = '⚠️ Battery level is critical! Connect to power source immediately.';
            adviceClass += ' warning';
        } else if (batteryData.percent < 20 && !batteryData.charging) {
            advice = '⚠️ Battery level is low. Consider connecting to power.';
            adviceClass += ' warning';
        } else if (batteryData.charging && batteryData.percent > 95) {
            advice = 'ℹ️ Battery is fully charged. You can disconnect from power.';
            adviceClass += ' info';
        } else if (batteryData.charging) {
            advice = `ℹ️ Charging... ${batteryData.time_left_formatted} until full.`;
            adviceClass += ' info';
        } else if (batteryData.time_left_formatted && batteryData.time_left_formatted !== 'Unknown') {
            advice = `ℹ️ ${batteryData.time_left_formatted} of battery life remaining.`;
            adviceClass += ' info';
        }

        adviceElement.textContent = advice;
        adviceElement.className = adviceClass;
    },

    // Toggle details visibility
    toggleDetails() {
        if (!this.container) return;
        
        this.showDetails = !this.showDetails;
        const detailsElement = this.container.querySelector('.battery-details');

        if (detailsElement) {
            if (this.showDetails) {
                detailsElement.style.display = 'block';
            } else {
                detailsElement.style.display = 'none';
            }
        }
    },

    // Hide details section
    hideDetails() {
        const detailsElement = this.container.querySelector('.battery-details');
        if (detailsElement) {
            detailsElement.style.display = 'none';
        }
        this.showDetails = false;
    },

    // Show error state
    showError(message) {
        // Update main panel content
        if (this.container) {
            const percentageElement = this.container.querySelector('.battery-percentage');
            const statusElement = this.container.querySelector('.battery-status');
            const adviceElement = this.container.querySelector('.battery-advice');

            if (percentageElement) percentageElement.textContent = '--%';
            if (statusElement) statusElement.textContent = `❌ ${message}`;
            if (adviceElement) {
                adviceElement.textContent = 'Unable to monitor battery status';
                adviceElement.className = 'battery-advice error';
            }
        }

        // Update header status with error
        if (this.headerStatusContainer) {
            this.headerStatusContainer.textContent = "🚫 Error";
            this.headerStatusContainer.title = message;
        }

        // Update collapsed status with error
        if (this.collapsedStatusContainer) {
            this.collapsedStatusContainer.textContent = "🚫 Error";
            this.collapsedStatusContainer.title = message;
        }
    }
};