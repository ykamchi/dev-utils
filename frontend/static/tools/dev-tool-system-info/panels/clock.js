// Clock Panel - Current Time Display
window.clock = {
    name: 'Clock',
    icon: '🕐',
    description: 'Real-time clock with current time and date',
    intervalId: null,
    container: null,

    // Initialize the panel
    async init(container, headerStatusContainer) {
        console.log('[Clock Panel] Initializing...');

        // Store container reference - this container holds the panel content
        this.container = container;

        // Store header status container reference - this container holds the status in the panel header 
        this.headerStatusContainer = headerStatusContainer;

        // Start the clock updates
        await this.startClock();
    },

    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[Clock Panel] Destroying...');

        // Stop the clock updates
        this.stopClock();
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.toggleFormat(); },
            title: "Toggle Format",
            icon: "⚙️"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.toggleFormat(); },
            title: "Toggle Format",
            icon: "⚙️"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[Clock Panel] Expanded');
    },

    // onCollapse event triggered
    async onCollapse(collapsedStatusContainer) {
        console.log('[Clock Panel] Collapsed');

        // Store collapsed status container reference - this container holds the status in collapsed mode   
        this.collapsedStatusContainer = collapsedStatusContainer;

        // Start the clock updates
        this.startClock();
    },

    // Render the panel content
    render() {
        console.log('[Clock Panel] Rendering content...');

        return `
            <div class="clock-panel">
                <div class="time-display">
                    <div class="current-time">--:--:--</div>
                    <div class="current-date">Loading...</div>
                </div>
                <div class="time-details">
                    <div class="detail-row">
                        <span class="label">Day:</span>
                        <span class="value day-name">-</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Timezone:</span>
                        <span class="value timezone">UTC+0</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Format:</span>
                        <span class="value time-format">24-hour</span>
                    </div>
                </div>
                <div class="clock-status">
                    <span class="status-indicator">⏰ Active</span>
                </div>
            </div>
        `;
    },


    // Panel state
    use24Hour: true,
    showSeconds: true,

    // Start the clock updates
    async startClock() {
        console.log('[Clock Panel] Starting clock updates...');

        if (this.intervalId) {
            console.log('[Clock Panel] Clock updates already running. Aborting start.');
            return; // Already running
        }

        // Initial load
        await this.refreshTime();

        // Set up interval for updates every second
        this.intervalId = setInterval(async () => {
            await this.refreshTime();
        }, this.showSeconds ? 1000 : 60000);
    },

    // Stop the clock updates
    stopClock() {
        console.log('[Clock Panel] Stopping clock updates...');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Refresh time data
    async refreshTime() {
        try {
            const response = await fetch('/api/dev-tool-system-info/time');
            const result = await response.json();

            if (result.success) {
                this.updateDisplay(result.data);
            } else {
                this.showError('Failed to load time data');
            }
        } catch (error) {
            this.showError('Error loading time: ' + error.message);
            console.error('Time refresh error:', error);
        }
    },

    // Update the display with new time data
    updateDisplay(timeData) {
        // Update the panel content only if container is available
        if (this.container) {
            const timeElement = this.container.querySelector('.current-time');
            const dateElement = this.container.querySelector('.current-date');
            const dayElement = this.container.querySelector('.day-name');
            const timezoneElement = this.container.querySelector('.timezone');
            const formatElement = this.container.querySelector('.time-format');

            if (timeElement && dateElement && dayElement && timezoneElement && formatElement) {
                // Format time based on preferences
                const timeStr = this.formatTime(timeData.time);
                timeElement.textContent = timeStr;
                dateElement.textContent = timeData.date;
                dayElement.textContent = timeData.day;
                timezoneElement.textContent = `UTC${timeData.utc_offset >= 0 ? '+' : ''}${timeData.utc_offset}`;
                formatElement.textContent = this.use24Hour ? '24-hour' : '12-hour';
            }
        }

        // Update header status with current time
        if (this.headerStatusContainer) {
            this.headerStatusContainer.textContent = this.formatTime(timeData.time);
        }

        // Update collapsed status with current time
        if (this.collapsedStatusContainer) {
            this.collapsedStatusContainer.textContent = this.formatTime(timeData.time);
        }
    },

    // Format time string based on preferences
    formatTime(timeStr) {
        if (this.use24Hour) {
            return this.showSeconds ? timeStr : timeStr.substring(0, 5);
        } else {
            // Convert to 12-hour format
            const [hours, minutes, seconds] = timeStr.split(':');
            const hour12 = hours % 12 || 12;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const time12 = this.showSeconds ?
                `${hour12}:${minutes}:${seconds} ${ampm}` :
                `${hour12}:${minutes} ${ampm}`;
            return time12;
        }
    },

    // Toggle between 24-hour and 12-hour format
    toggleFormat() {
        console.log('[Clock Panel] Toggling time format...');

        this.use24Hour = !this.use24Hour;

        // Refresh immediately to show new format
        this.refreshTime();
    },

    // Show error state
    showError(message) {
        if (this.container) {
            const timeElement = this.container.querySelector('.current-time');
            const statusElement = this.container.querySelector('.clock-status');

            if (timeElement) {
                timeElement.textContent = '--:--:--';
            }
            if (statusElement) {
                statusElement.textContent = `❌ ${message}`;
                statusElement.style.color = 'var(--color-warning-error)';
            }
        }

        // Update header status with current time
        if (this.headerStatusContainer) {
            this.headerStatusContainer.textContent = "🚫 Error";
            this.headerStatusContainer.title = message;
        }

        // Update collapsed status with current time
        if (this.collapsedStatusContainer) {
            this.collapsedStatusContainer.textContent = " 🚫 Error";
            this.collapsedStatusContainer.title = message;
        }
    }
};