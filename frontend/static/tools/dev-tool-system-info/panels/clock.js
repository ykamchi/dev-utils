// Clock Panel - Current Time Display
window.clock = {
    name: 'Clock',
    icon: '🕐',
    description: 'Real-time clock with current time and date',
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
            callback: function() { window.clock.refreshTime(); },
            title: "Refresh Time",
            icon: "🔄"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { window.clock.toggleFormat(); },
            title: "Toggle Format",
            icon: "⚙️"
        }
    ],

    // Panel state
    use24Hour: true,
    showSeconds: true,

    // Render the panel content
    render() {
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

    // Load panel content
    async load(container) {
        try {
            container.innerHTML = this.render();
            await this.startClock();
        } catch (error) {
            container.innerHTML = '<p>Error loading clock panel</p>';
            console.error('Clock panel error:', error);
        }
    },

    // Unload panel (cleanup)
    unload(container) {
        this.stopClock();
        console.log('Clock panel unloaded');
    },

    // Start the clock updates
    async startClock() {
        // Initial load
        await this.refreshTime();

        // Set up interval for updates every second
        this.intervalId = setInterval(async () => {
            await this.refreshTime();
        }, 1000);
    },

    // Stop the clock updates
    stopClock() {
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
            this.showError('Network error loading time');
            console.error('Time refresh error:', error);
        }
    },

    // Update the display with new time data
    updateDisplay(timeData) {
        const container = this.container;
        const timeElement = container.querySelector('.current-time');
        const dateElement = container.querySelector('.current-date');
        const dayElement = container.querySelector('.day-name');
        const timezoneElement = container.querySelector('.timezone');
        const formatElement = container.querySelector('.time-format');

        if (timeElement && dateElement && dayElement && timezoneElement && formatElement) {
            // Format time based on preferences
            const timeStr = this.formatTime(timeData.time);
            timeElement.textContent = timeStr;
            dateElement.textContent = timeData.date;
            dayElement.textContent = timeData.day;
            timezoneElement.textContent = `UTC${timeData.utc_offset >= 0 ? '+' : ''}${timeData.utc_offset}`;
            formatElement.textContent = this.use24Hour ? '24-hour' : '12-hour';
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
        this.use24Hour = !this.use24Hour;
        // Refresh immediately to show new format
        this.refreshTime();
    },

    // Show error state
    showError(message) {
        const container = this.container;
        const timeElement = container.querySelector('.current-time');
        const statusElement = container.querySelector('.clock-status');

        if (timeElement) {
            timeElement.textContent = '--:--:--';
        }
        if (statusElement) {
            statusElement.textContent = `❌ ${message}`;
            statusElement.style.color = 'var(--color-warning-error)';
        }
    }
};