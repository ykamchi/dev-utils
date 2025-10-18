// Kubernetes Logs Panel - Displays logs from Kubernetes pods
window.k8slogs = {
    name: 'K8s Logs',
    icon: '📋',
    description: 'Kubernetes pod logs viewer',
    intervalId: null,
    container: null,
    headerStatusContainer: null,
    selectedNamespace: null,
    selectedPod: null,
    currentFontSize: 12, // Current font size for logs

    // Render initial HTML content
    render() {
        return `
            <div class="k8s-logs-container">
                <div class="k8s-logs-controls">
                    <div class="k8s-logs-select-group">
                        <label>Namespace:</label>
                        <select id="namespaceSelect" class="k8s-logs-select">
                            <option value="">Select namespace...</option>
                        </select>

                        <label>Pod:</label>
                        <select id="podSelect" class="k8s-logs-select" disabled>
                            <option value="">Select pod...</option>
                        </select>
                    </div>

                    <div class="k8s-logs-button-row">
                        <button id="refreshLogsBtn" class="k8s-logs-refresh-btn" disabled>
                            Refresh Logs
                        </button>
                        
                        <div class="k8s-logs-font-controls">
                            <button id="decreaseFontBtn" class="k8s-logs-font-btn" title="Decrease font size">🔍-</button>
                            <button id="increaseFontBtn" class="k8s-logs-font-btn" title="Increase font size">🔍+</button>
                        </div>
                    </div>
                </div>

                <div id="logsContainer" class="k8s-logs-container-element" tabindex="0">
                    Select a namespace and pod to view logs...
                </div>
            </div>
        `;
    },

    // Initialize the panel
    async init(container, headerStatusContainer) {
        console.log('[K8s Logs Panel] Initializing...');

        // Store container reference
        this.container = container;
        this.headerStatusContainer = headerStatusContainer;

        // Load saved font size, namespace, and pod from storage
        const savedState = StorageService.getToolState('dev-tool-senseip', {});
        this.currentFontSize = savedState.k8sLogsFontSize || 12;
        const savedNamespace = savedState.k8sSelectedNamespace;
        const savedPod = savedState.k8sSelectedPod;

        // Apply the saved font size to the logs container
        const logsContainer = this.container.querySelector('#logsContainer');
        if (logsContainer) {
            logsContainer.style.fontSize = this.currentFontSize + 'px';
        }

        // Load namespaces
        await this.loadNamespaces();

        // Auto-select saved namespace if it exists
        if (savedNamespace) {
            const namespaceSelect = this.container.querySelector('#namespaceSelect');
            // Check if the saved namespace exists in the options
            const namespaceOption = namespaceSelect.querySelector(`option[value="${savedNamespace}"]`);
            if (namespaceOption) {
                namespaceSelect.value = savedNamespace;
                this.selectedNamespace = savedNamespace;
                // Load pods for the selected namespace and potentially select saved pod
                await this.loadPods(savedNamespace, savedPod);
            }
        }

        // Set up event listeners
        this.setupEventListeners();
    },

    // Destroy the panel (cleanup)
    destroy() {
        console.log('[K8s Logs Panel] Destroying...');

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.refreshLogs(); },
            title: "Refresh Logs",
            icon: "🔄"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.refreshLogs(); },
            title: "Refresh Logs",
            icon: "🔄"
        }
    ],

    // onExpand event
    onExpand() {
        console.log('[K8s Logs Panel] Expanded');
    },

    // onCollapse event
    onCollapse() {
        console.log('[K8s Logs Panel] Collapsed');
    },

    // Setup event listeners
    setupEventListeners() {
        const namespaceSelect = this.container.querySelector('#namespaceSelect');
        const podSelect = this.container.querySelector('#podSelect');
        const refreshBtn = this.container.querySelector('#refreshLogsBtn');

        namespaceSelect.addEventListener('change', (e) => {
            this.selectedNamespace = e.target.value;
            
            // Save selected namespace to storage
            const currentState = StorageService.getToolState('dev-tool-senseip', {});
            currentState.k8sSelectedNamespace = this.selectedNamespace;
            StorageService.setToolState('dev-tool-senseip', currentState);
            
            if (this.selectedNamespace) {
                this.loadPods(this.selectedNamespace);
            } else {
                podSelect.innerHTML = '<option value="">Select pod...</option>';
                podSelect.disabled = true;
                refreshBtn.disabled = true;
            }
        });

        podSelect.addEventListener('change', (e) => {
            this.selectedPod = e.target.value;
            
            // Save selected pod to storage
            const currentState = StorageService.getToolState('dev-tool-senseip', {});
            currentState.k8sSelectedPod = this.selectedPod;
            StorageService.setToolState('dev-tool-senseip', currentState);
            
            refreshBtn.disabled = !this.selectedPod;
            if (this.selectedPod) {
                this.loadLogs();
            }
        });

        refreshBtn.addEventListener('click', () => {
            this.loadLogs();
        });

        // Font size control buttons
        const decreaseFontBtn = this.container.querySelector('#decreaseFontBtn');
        const increaseFontBtn = this.container.querySelector('#increaseFontBtn');

        decreaseFontBtn.addEventListener('click', () => {
            this.changeFontSize(-1);
        });

        increaseFontBtn.addEventListener('click', () => {
            this.changeFontSize(1);
        });

                // Text selection event listeners for logs container
        const logsContainer = this.container.querySelector('#logsContainer');
        if (logsContainer) {
            let originalDraggable = null;

            // Prevent panel dragging when interacting with logs container
            logsContainer.addEventListener('mousedown', (e) => {
                // Temporarily disable panel dragging
                const panel = this.container.closest('.expanded-panel');
                if (panel) {
                    originalDraggable = panel.draggable;
                    panel.draggable = false;
                }
                e.stopPropagation();
            });

            logsContainer.addEventListener('mouseup', (e) => {
                // Restore panel dragging
                const panel = this.container.closest('.expanded-panel');
                if (panel && originalDraggable !== null) {
                    panel.draggable = originalDraggable;
                    originalDraggable = null;
                }
                e.stopPropagation();
            });

            logsContainer.addEventListener('mousemove', (e) => {
                // Stop propagation to prevent panel drag during mouse movement
                e.stopPropagation();
            });

            // Prevent HTML5 drag and drop from interfering
            logsContainer.addEventListener('dragstart', (e) => {
                // Prevent drag from starting on the logs container
                e.preventDefault();
                e.stopPropagation();
            });

            // Focus the container when clicked to enable text selection
            logsContainer.addEventListener('click', (e) => {
                if (e.target === logsContainer) {
                    logsContainer.focus();
                }
                e.stopPropagation();
            });

            // Prevent scroll interference during text selection
            logsContainer.addEventListener('selectstart', (e) => {
                // Allow text selection to proceed
                e.stopPropagation();
            });
        }
    },

    // Change font size of logs container
    changeFontSize(delta) {
        const minFontSize = 8;
        const maxFontSize = 24;
        
        this.currentFontSize = Math.max(minFontSize, Math.min(maxFontSize, this.currentFontSize + delta));
        
        const logsContainer = this.container.querySelector('#logsContainer');
        if (logsContainer) {
            logsContainer.style.fontSize = this.currentFontSize + 'px';
        }

        // Save font size to storage
        const currentState = StorageService.getToolState('dev-tool-senseip', {});
        currentState.k8sLogsFontSize = this.currentFontSize;
        StorageService.setToolState('dev-tool-senseip', currentState);
    },

    // Update status in header
    updateStatus(message) {
        if (this.headerStatusContainer) {
            this.headerStatusContainer.innerHTML = `<span style="font-size: 12px; color: #666;">${message}</span>`;
        }
    },

    // Load namespaces from API
    async loadNamespaces() {
        console.log('[K8s Logs Panel] Loading namespaces...');

        try {
            this.updateStatus('Loading namespaces...');

            const response = await fetch('/api/dev-tool-senseip/namespaces');
            const result = await response.json();

            if (result.success) {
                this.populateNamespaceSelect(result.namespaces);
                this.updateStatus(`Loaded ${result.namespaces.length} namespaces`);
            } else {
                this.showError('Failed to load namespaces: ' + result.error);
            }

        } catch (error) {
            console.error('[K8s Logs Panel] Error loading namespaces:', error);
            this.showError('Failed to load namespaces');
        }
    },

    // Populate namespace dropdown
    populateNamespaceSelect(namespaces) {
        const select = this.container.querySelector('#namespaceSelect');
        select.innerHTML = '<option value="">Select namespace...</option>';

        namespaces.forEach(namespace => {
            const option = document.createElement('option');
            option.value = namespace;
            option.textContent = namespace;
            select.appendChild(option);
        });
    },

    // Load pods for selected namespace
    async loadPods(namespace, savedPod = null) {
        console.log(`[K8s Logs Panel] Loading pods for namespace: ${namespace}`);

        try {
            this.updateStatus(`Loading pods for ${namespace}...`);

            const response = await fetch(`/api/dev-tool-senseip/pods/${namespace}`);
            const result = await response.json();

            if (result.success) {
                this.populatePodSelect(result.pods, savedPod);
                this.updateStatus(`Loaded ${result.pods.length} pods`);
            } else {
                this.showError('Failed to load pods: ' + result.error);
            }

        } catch (error) {
            console.error('[K8s Logs Panel] Error loading pods:', error);
            this.showError('Failed to load pods');
        }
    },

    // Populate pod dropdown
    populatePodSelect(pods, savedPod = null) {
        const select = this.container.querySelector('#podSelect');
        select.innerHTML = '<option value="">Select pod...</option>';
        select.disabled = false;

        pods.forEach(pod => {
            const option = document.createElement('option');
            option.value = pod;
            option.textContent = pod;
            select.appendChild(option);
        });

        // Auto-select saved pod if it exists
        if (savedPod && pods.includes(savedPod)) {
            select.value = savedPod;
            this.selectedPod = savedPod;
            // Enable refresh button and load logs
            const refreshBtn = this.container.querySelector('#refreshLogsBtn');
            refreshBtn.disabled = false;
            this.loadLogs();
        }
    },

    // Load logs for selected pod
    async loadLogs() {
        if (!this.selectedNamespace || !this.selectedPod) {
            return;
        }

        console.log(`[K8s Logs Panel] Loading logs for ${this.selectedNamespace}/${this.selectedPod}`);

        try {
            this.updateStatus(`Loading logs for ${this.selectedPod}...`);

            const response = await fetch(`/api/dev-tool-senseip/logs/${this.selectedNamespace}/${this.selectedPod}`);
            const result = await response.json();

            if (result.success) {
                this.displayLogs(result.logs);
                this.updateStatus(`Logs loaded for ${this.selectedPod}`);
            } else {
                this.showError('Failed to load logs: ' + result.error);
            }

        } catch (error) {
            console.error('[K8s Logs Panel] Error loading logs:', error);
            this.showError('Failed to load logs');
        }
    },

    // Refresh logs (same as loadLogs but for button)
    refreshLogs() {
        if (this.selectedNamespace && this.selectedPod) {
            this.loadLogs();
        }
    },

    // Display logs in the container
    displayLogs(logs) {
        const logsContainer = this.container.querySelector('#logsContainer');
        logsContainer.textContent = logs || 'No logs available';
        logsContainer.scrollTop = logsContainer.scrollHeight; // Scroll to bottom
    },

    // Show error message
    showError(message) {
        const logsContainer = this.container.querySelector('#logsContainer');
        logsContainer.innerHTML = `<span style="color: #f44336;">❌ Error: ${message}</span>`;
        this.updateStatus('Error loading data');
    }
};