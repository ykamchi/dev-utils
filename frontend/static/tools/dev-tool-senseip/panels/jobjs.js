// Jobs Panel - Displays job information from SQL Server
window.jobjs = {
    name: 'Jobs',
    icon: '📋',
    description: 'Job monitoring and status information',
    intervalId: null,
    container: null,
    headerStatusContainer: null,
    tableComponent: null,
    currentSort: { column: 'jobId', direction: 'desc' }, // Current sort state
    maxResults: 20, // Current max results
    suspended: false, // Track if polling is suspended

    // Get CSS class for status badges
    getStatusClass(status) {
        if (!status) return 'status-default';

        const statusLower = status.toLowerCase();

        if (statusLower.includes('completed') || statusLower.includes('success')) {
            return 'status-completed';
        } else if (statusLower.includes('failed') || statusLower.includes('error')) {
            return 'status-failed';
        } else if (statusLower.includes('running') || statusLower.includes('processing')) {
            return 'status-running';
        } else if (statusLower.includes('pending') || statusLower.includes('queued') || statusLower.includes('created')) {
            return 'status-pending';
        }

        return 'status-default';
    },

    // Table configuration
    tableConfig: {
        columns: [
            { key: 'companyId', label: 'Company ID', sortable: true },
            { key: 'queueId', label: 'Queue ID', sortable: true },
            { key: 'jobId', label: 'Job ID', sortable: true },
            { key: 'jobStatus', label: 'Status', sortable: true },
            { key: 'jobName', label: 'Job Name', sortable: true, truncate: true },
            { key: 'creationTimestamp', label: 'Created', sortable: true },
            { key: 'jobDetails', label: 'Job Details', sortable: true, truncate: true }
        ],
        sorting: {
            enabled: true
        },
        resizable: true, // Enable column resizing
        cellRenderers: {
            jobStatus: function(value, row, column) {
                // Create custom status badge element
                const badge = document.createElement('span');
                badge.className = 'status-badge ' + window.jobjs.getStatusClass(value);
                badge.textContent = value;
                return badge;
            }
        },
        storageKey: 'dev-tool-senseip'
    },

    // Render initial HTML content
    render() {
        return `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <h3>Loading Jobs...</h3>
                <p>Fetching job information from the database</p>
                <div style="margin-top: 20px;">
                    <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
    },

    // Initialize the panel
    async init(container, headerStatusContainer) {
        console.log('[Jobs Panel] Initializing...');

        // Store container reference
        this.container = container;
        this.headerStatusContainer = headerStatusContainer;

        // Load sort state
        this.loadSortState();

        // Set up container structure with filter area and table area
        this.setupContainerStructure();

        // Update sort info display with loaded state
        this.updateSortInfo();

        // Update polling status indicator with loaded state
        this.updatePollingStatusIndicator();

        // Initialize table component in the table area
        this.tableComponent = new TableComponent({
            ...this.tableConfig,
            container: this.tableContainer
        });

        // Set up table event handlers
        this.setupTableEventHandlers();

        // Set up filter event handlers
        this.setupFilterEventHandlers();

        // Initial load
        await this.loadJobs();

        // Auto-refresh every 10 seconds (unless suspended)
        if (!this.suspended) {
            this.intervalId = setInterval(() => {
                this.loadJobs();
            }, 10000);
        }
    },

    // Setup table event handlers
    setupTableEventHandlers() {
        if (!this.tableComponent) return;

        // Handle sort changes
        this.tableComponent.onSort = (sortEvent) => {
            console.log('[Jobs Panel] Sort requested:', sortEvent);
            // Toggle sort direction if same column, otherwise set new column with asc
            if (this.currentSort && this.currentSort.column === sortEvent.column) {
                this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                this.currentSort = {
                    column: sortEvent.column,
                    direction: 'asc'
                };
            }
            // Save sort state
            this.saveSortState();
            // Update sort info display
            this.updateSortInfo();
            // Reload data with new sort
            this.loadJobs();
        };

        // Handle retry
        this.tableComponent.onRetry = () => {
            this.loadJobs();
        };
    },

    // Get display name for sort column
    getSortDisplayName(columnKey) {
        const columnMap = {
            'companyId': 'Company ID',
            'queueId': 'Queue ID',
            'jobId': 'Job ID',
            'jobStatus': 'Status',
            'jobName': 'Job Name',
            'creationTimestamp': 'Created',
            'jobDetails': 'Job Details'
        };
        return columnMap[columnKey] || columnKey;
    },

    // Setup container structure with filter area and table area
    setupContainerStructure() {
        this.container.innerHTML = `
            <div class="jobs-filter-area">
                <div class="filter-controls">
                    <button class="polling-status-btn" type="button">${this.getPollingStatusIndicator()}</button>
                    <label for="max-results-input">Max Results:</label>
                    <input type="number" id="max-results-input" class="max-results-input"
                           min="10" max="300" step="10" value="${this.maxResults}">
                    <span class="sort-info">Sorted by: ${this.getSortDisplayName(this.currentSort.column)} (${this.currentSort.direction.toUpperCase()})</span>
                </div>
            </div>
            <div class="jobs-table-area">
                <!-- Table will be rendered here -->
            </div>
        `;

        // Store reference to table container
        this.tableContainer = this.container.querySelector('.jobs-table-area');
    },

    // Setup filter event handlers
    setupFilterEventHandlers() {
        const maxResultsInput = this.container.querySelector('#max-results-input');
        if (maxResultsInput) {
            maxResultsInput.addEventListener('change', (e) => {
                this.handleMaxResultsChange(e.target.value);
            });
        }

        const pollingStatusBtn = this.container.querySelector('.polling-status-btn');
        if (pollingStatusBtn) {
            pollingStatusBtn.addEventListener('click', () => {
                this.toggleSuspendResume();
            });
        }
    },

    // Handle max results change
    handleMaxResultsChange(value) {
        let numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 10) numValue = 10;
        if (numValue > 300) numValue = 300;

        // Update input value if it was clamped
        const input = this.container.querySelector('#max-results-input');
        if (input && parseInt(input.value) !== numValue) {
            input.value = numValue;
        }

        this.maxResults = numValue;
        this.saveSortState(); // Save includes maxResults now
        this.loadJobs(); // Reload with new max results
    },

    // Update sort info display
    updateSortInfo() {
        const sortInfoElement = this.container.querySelector('.sort-info');
        if (sortInfoElement) {
            sortInfoElement.textContent = `Sorted by: ${this.getSortDisplayName(this.currentSort.column)} (${this.currentSort.direction.toUpperCase()})`;
        }
    },

    // Save sort state to storage
    saveSortState() {
        try {
            StorageService.setToolState('dev-tool-senseip-sort', {
                column: this.currentSort.column,
                direction: this.currentSort.direction,
                maxResults: this.maxResults,
                suspended: this.suspended
            });
        } catch (error) {
            console.warn('[Jobs Panel] Failed to save sort state:', error);
        }
    },

    // Load sort state from storage
    loadSortState() {
        try {
            const saved = StorageService.getToolState('dev-tool-senseip-sort');
            if (saved) {
                if (saved.column && saved.direction) {
                    this.currentSort = {
                        column: saved.column,
                        direction: saved.direction
                    };
                }
                if (saved.maxResults) {
                    this.maxResults = saved.maxResults;
                }
                if (typeof saved.suspended === 'boolean') {
                    this.suspended = saved.suspended;
                }
            }
        } catch (error) {
            console.warn('[Jobs Panel] Failed to load sort state:', error);
        }
    },

    // Destroy the panel (cleanup)
    destroy() {
        console.log('[Jobs Panel] Destroying...');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.loadJobs(); },
            title: "Refresh Jobs",
            icon: "🔄"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.loadJobs(); },
            title: "Refresh Jobs",
            icon: "🔄"
        }
    ],

    // onExpand event
    onExpand() {
        console.log('[Jobs Panel] Expanded');
    },

    // onCollapse event
    onCollapse() {
        console.log('[Jobs Panel] Collapsed');
    },

        // Suspend polling
    suspend() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.suspended = true;
        this.saveSortState(); // Save suspended state
        this.updateStatus('Polling suspended');
        this.updatePollingStatusIndicator();
        console.log('[Jobs Panel] Polling suspended');
    },

    // Resume polling
    resume() {
        if (!this.intervalId && this.suspended) {
            this.intervalId = setInterval(() => {
                this.loadJobs();
            }, 10000);
        }
        this.suspended = false;
        this.saveSortState(); // Save suspended state
        this.updateStatus('Polling resumed');
        this.updatePollingStatusIndicator();
        console.log('[Jobs Panel] Polling resumed');
    },

    // Toggle suspend/resume
    toggleSuspendResume() {
        if (this.suspended) {
            this.resume();
        } else {
            this.suspend();
        }
    },

    // Get current status message
    getStatusMessage() {
        if (this.suspended) {
            return 'Suspended';
        }
        return 'Active';
    },

    // Get polling status indicator HTML
    getPollingStatusIndicator() {
        const icon = this.suspended ? '⏸️' : '▶️';
        const text = this.suspended ? 'Suspended' : 'Active';
        return `${icon} ${text}`;
    },

    // Update polling status indicator
    updatePollingStatusIndicator() {
        const statusElement = this.container.querySelector('.polling-status-btn');
        if (statusElement) {
            statusElement.textContent = this.getPollingStatusIndicator();
            statusElement.style.color = this.suspended ? '#ff6b6b' : '#4CAF50';
        }
    },

    // Update status in header
    updateStatus(message) {
        if (this.headerStatusContainer) {
            const suspendIndicator = this.suspended ? ' <span style="color: #ff6b6b;">⏸️ SUSPENDED</span>' : '';
            this.headerStatusContainer.innerHTML = `<span style="font-size: 12px; color: #666;">${message}${suspendIndicator}</span>`;
        }
    },

    // Load jobs data from API
    async loadJobs() {
        console.log('[Jobs Panel] Loading jobs...');

        if (!this.tableComponent) return;

        try {
            this.updateStatus(`Loading... (${this.getStatusMessage()})`);
            this.tableComponent.setLoading(true);

            // Use current sort and max results from panel state
            const response = await fetch(`/api/dev-tool-senseip/jobs?maxResults=${this.maxResults}&sortColumn=${this.currentSort.column}&sortDirection=${this.currentSort.direction}`);
            const result = await response.json();

            if (result.success) {
                this.tableComponent.updateData(result.jobs);
                this.updateStatus(`Loaded ${result.jobs.length} jobs (${this.getStatusMessage()})`);
            } else {
                this.tableComponent.setError(result.error);
                this.updateStatus(`Error loading data (${this.getStatusMessage()})`);
            }

        } catch (error) {
            console.error('[Jobs Panel] Error loading jobs:', error);
            this.tableComponent.setError('Failed to load jobs data');
            this.updateStatus(`Error loading data (${this.getStatusMessage()})`);
        }
    }
};