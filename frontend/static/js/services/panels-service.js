// Panel Service (Panels Manager)
// Handles panel-based tools with secondary toolbar and expand/collapse functionality

const PanelsService = {
    panelsState: null, // Current tool's panel data
    toolName: null,

    // Initialize panel service for a specific tool
    async initForTool(toolName) {
        // Clean up panels from the previous tool before initializing the new one
        this.cleanupPanelScriptsForTool(this.toolName);

        // Set new tool name
        this.toolName = toolName; 

        // Always reset panel data for the new tool
        this.panelsState = {
            panelsInfo: new Map(), // panelName -> panel info
            expandedPanels: new Set(), // Set of currently expanded panel names
            expandOrder: [], // Array to track expand order
            collapseOrder: [], // Array to track collapse order for toolbar
            secondaryToolbar: null,
            contentArea: null
        };

        // Always discover and load panels for this tool
        await this.discoverPanels();

        setTimeout(() => {
            // Always reinitialize UI since DOM may have been recreated
        this.initializeUI();
        }, 100);
        
    },

    // Discover panels for a tool
    async discoverPanels() {
        try {
            // Get panels from backend API
            const response = await fetch(`/api/tools/${this.toolName}/panels`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.panels.length > 0) {
                    // Load panels from backend
                    for (const panelName of data.panels) {
                        try {
                            await this.loadPanelInfo(panelName);
                        } catch (error) {
                            console.warn(`Failed to load panel: ${panelName}`, error);
                        }
                    }
                }
            } else {
                console.warn(`Failed to fetch panels for ${this.toolName}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error discovering panels for ${this.toolName}:`, error);
        }
    },

    cleanupPanelScriptsForTool(toolName) {
        // If no tool name provided, nothing to clean up
        if (!toolName) return;

        console.log(`Cleaning up previous panel scripts and data for tool: ${toolName}`);
        // Remove previously loaded panel scripts from the document for this specific tool
        const existingScripts = document.querySelectorAll(`script[src^="/static/tools/${toolName}/panels/panel-"]`);
        existingScripts.forEach(script => script.remove());
        
        // Clear global panel objects using the actual panel names from current state
        // This is precise and only removes the panels that were actually loaded
        if (this.panelsState && this.panelsState.panelsInfo) {
            for (const panelName of this.panelsState.panelsInfo.keys()) {
                const panelObjectName = panelName.replace(/-/g, '_');
                if (window[panelObjectName]) {
                    delete window[panelObjectName];
                }
            }
        }
    },

    // Load a single panel
    async loadPanelInfo(panelName) {
        return new Promise((resolve, reject) => {
            console.log(`Loading panel script: ${panelName}`);
            const script = document.createElement('script');
            script.src = `/static/tools/${this.toolName}/panels/${panelName}.js`;
            script.onload = async () => {
                try {
                    // Get panel info from the loaded script
                    const panelInfo = await this.getPanelInfo(panelName);
                    this.panelsState.panelsInfo.set(panelName, panelInfo);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => {
                reject(new Error(`Failed to load panel script: ${panelName}`));
            };
            document.head.appendChild(script);
        });
    },

    // Get panel information from loaded script
    async getPanelInfo(panelName) {
        // Convert panel filename to global object name (hyphens become underscores)
        // e.g., 'panel-1' becomes 'panel_1' to match the global object defined in the script
        const panelObjectName = panelName.replace(/-/g, '_');
        const panelObject = window[panelObjectName];

        if (!panelObject) {
            throw new Error(`Panel object not found: ${panelObjectName}`);
        }

        // Required fields - throw errors if missing
        if (!panelObject.name || typeof panelObject.name !== 'string') {
            throw new Error(`Panel ${panelName}: 'name' property is required and must be a string`);
        }
        if (!panelObject.icon || typeof panelObject.icon !== 'string') {
            throw new Error(`Panel ${panelName}: 'icon' property is required and must be a string`);
        }
        if (!panelObject.render || typeof panelObject.render !== 'function') {
            throw new Error(`Panel ${panelName}: 'render' property is required and must be a function`);
        }
        if (!panelObject.description || typeof panelObject.description !== 'string') {
            throw new Error(`Panel ${panelName}: 'description' property is required and must be a string`);
        }
        if (!panelObject.init || typeof panelObject.init !== 'function') {
            throw new Error(`Panel ${panelName}: 'init' property is required and must be a function`);
        }
        if (!Array.isArray(panelObject.collapseModeButtons)) {
            throw new Error(`Panel ${panelName}: 'collapseModeButtons' property is required and must be an array`);
        }
        if (!Array.isArray(panelObject.expandModeButtons)) {
            throw new Error(`Panel ${panelName}: 'expandModeButtons' property is required and must be an array`);
        }

        return {
            name: panelObject.name,
            icon: panelObject.icon,
            description: panelObject.description,
            render: panelObject.render.bind(panelObject),
            init: panelObject.init.bind(panelObject),
            collapseModeButtons: panelObject.collapseModeButtons,
            expandModeButtons: panelObject.expandModeButtons
        };
    },

    // Initialize UI for panels
    initializeUI() {
        // Get fresh DOM references since they may have been recreated
        this.panelsState.secondaryToolbar = document.getElementById('secondaryToolbar');
        this.panelsState.contentArea = document.getElementById('panelsContent');

        if (!this.panelsState.secondaryToolbar || !this.panelsState.contentArea) {
            console.error('Secondary toolbar or content area not found');
            return;
        }

        // Clear existing content
        this.panelsState.secondaryToolbar.innerHTML = '';
        this.panelsState.contentArea.innerHTML = '';

        // Initialize collapse order with all panels (they start collapsed)
        this.panelsState.collapseOrder = Array.from(this.panelsState.panelsInfo.keys());

        // Create secondary toolbar panels for all panels initially (they're all collapsed)
        for (const [panelName, panelInfo] of this.panelsState.panelsInfo) {
            const panelButton = this.createCollapsedPanel(panelName, panelInfo);
            this.panelsState.secondaryToolbar.appendChild(panelButton);
        }

        // Set initial state - expand first panel
        const firstPanel = this.panelsState.panelsInfo.keys().next().value;
        if (firstPanel) {
            this.expandPanel(firstPanel);
        }
    },

    // Helper function to generate button elements from button objects
    generateButtons(buttons) {
        if (!buttons || !Array.isArray(buttons)) return null;

        const container = document.createElement('div');
        container.className = 'panel-buttons';

        buttons.forEach((button, index) => {
            const btnElement = document.createElement('button');
            btnElement.title = button.title;
            btnElement.textContent = button.icon;
            btnElement.addEventListener('click', (e) => {
                e.stopPropagation();
                button.callback();
            });
            container.appendChild(btnElement);
        });

        return container;
    },

    // Create a collapsed panel button for the secondary toolbar
    createCollapsedPanel(panelName, panelInfo) {
        const panelButton = document.createElement('div');
        panelButton.className = 'collapsed-panel collapsed';
        panelButton.dataset.panelName = panelName;
        panelButton.dataset.toolName = this.toolName;

        // Create panel info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'collapsed-panel-info';
        infoDiv.innerHTML = `
            <div class="collapsed-panel-icon">${panelInfo.icon}</div>
            <div class="collapsed-panel-name">${panelInfo.name}</div>
        `;
        panelButton.appendChild(infoDiv);

        // Add buttons if they exist
        if (panelInfo.collapseModeButtons) {
            const buttonsContainer = this.generateButtons(panelInfo.collapseModeButtons);
            if (buttonsContainer) {
                buttonsContainer.className = 'collapsed-panel-buttons';
                panelButton.appendChild(buttonsContainer);
            }
        }

        // Add click handler
        panelButton.addEventListener('click', () => {
            this.togglePanel(panelName);
        });

        return panelButton;
    },

    // Toggle panel expansion/collapse
    togglePanel(panelName) {
        if (this.panelsState.expandedPanels.has(panelName)) {
            // Collapse this panel
            this.collapsePanel(panelName);
        } else {
            // Expand this panel
            this.expandPanel(panelName);
        }
    },

    // Expand a panel
    expandPanel(panelName) {
        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) return;

        // Add to expanded panels
        this.panelsState.expandedPanels.add(panelName);

        // Update expand order (move to end if already exists)
        const orderIndex = this.panelsState.expandOrder.indexOf(panelName);
        if (orderIndex > -1) {
            this.panelsState.expandOrder.splice(orderIndex, 1);
        }
        this.panelsState.expandOrder.push(panelName);

        // Update UI
        this.updateCollapsedPanels();
        this.updatePanelContent();
    },

    // Collapse a specific panel
    collapsePanel(panelName) {
        // Remove from expanded panels
        this.panelsState.expandedPanels.delete(panelName);

        // Remove from expand order
        const orderIndex = this.panelsState.expandOrder.indexOf(panelName);
        if (orderIndex > -1) {
            this.panelsState.expandOrder.splice(orderIndex, 1);
        }

        // Add to collapse order (move to end if already exists)
        const collapseIndex = this.panelsState.collapseOrder.indexOf(panelName);
        if (collapseIndex > -1) {
            this.panelsState.collapseOrder.splice(collapseIndex, 1);
        }
        this.panelsState.collapseOrder.push(panelName);

        // If no panels are expanded, don't expand any
        if (this.panelsState.expandedPanels.size === 0) {
            // Don't expand any panel automatically
            return;
        }

        // Update UI
        this.updateCollapsedPanels();
        this.updatePanelContent();
    },

    // Update collapsed panel states - only show collapsed panels
    updateCollapsedPanels() {
        // Clear existing panels
        this.panelsState.secondaryToolbar.innerHTML = '';

        // Create panels only for collapsed panels, ordered by collapse order
        for (const panelName of this.panelsState.collapseOrder) {
            if (!this.panelsState.expandedPanels.has(panelName)) {
                const panelInfo = this.panelsState.panelsInfo.get(panelName);
                if (panelInfo) {
                    const panelButton = this.createCollapsedPanel(panelName, panelInfo);
                    this.panelsState.secondaryToolbar.appendChild(panelButton);
                }
            }
        }
    },

    // Update all panel content based on expand order
    updatePanelContent() {
        // Clear content area
        this.panelsState.contentArea.innerHTML = '';

        // Create container for expanded panels
        const panelsContainer = document.createElement('div');
        panelsContainer.className = 'expanded-panels-container';

        // Render expanded panels in expand order
        for (const panelName of this.panelsState.expandOrder) {
            if (this.panelsState.expandedPanels.has(panelName)) {
                const panelElement = this.createPanelElement(panelName);
                if (panelElement) {
                    panelsContainer.appendChild(panelElement);
                } else {
                    console.error(`Failed to create panel element for: ${panelName}`);
                }
            }
        }

        this.panelsState.contentArea.appendChild(panelsContainer);
    },

    // Create a panel element for expanded display
    createPanelElement(panelName) {
        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) {
            console.error(`Failed to create panel element for: ${panelName}`);
            return null;
        }

        const panelElement = document.createElement('div');
        panelElement.className = 'expanded-panel';
        panelElement.dataset.panelName = panelName;

        // Create panel header
        const panelHeader = this.createPanelHeader(panelName);
        if (panelHeader) {
            panelElement.appendChild(panelHeader);
        } else {
            console.error(`Failed to create panel header for: ${panelName}`);
        }

        // Create panel content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'panel-content';

        // Render panel content
        const content = panelInfo.render();
        if (typeof content === 'string') {
            contentContainer.innerHTML = content;
        } else {
            console.error(`Panel ${panelName}: render() must return a string, got ${typeof content}`);
            contentContainer.innerHTML = `
                <div class="panel-placeholder">
                    <h3>${panelInfo.name}</h3>
                    <p>Panel render error: render() must return a string.</p>
                </div>
            `;
        }

        panelElement.appendChild(contentContainer);

        // Initialize panel
        try {
            panelInfo.init(contentContainer);
        } catch (error) {
            console.error(`Error initializing panel ${panelName}:`, error);
        }

        return panelElement;
    },

    // Create panel header with emoji, name, and collapse button
    createPanelHeader(panelName) {
        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) {
            console.error(`Failed to create panel header for: ${panelName}`);
            return null;
        }

        const header = document.createElement('div');
        header.className = 'panel-header';

        // Create left section
        const leftDiv = document.createElement('div');
        leftDiv.className = 'panel-header-left';

        // Create emoji span
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'panel-emoji';
        emojiSpan.textContent = panelInfo.icon;
        leftDiv.appendChild(emojiSpan);

        // Create title span
        const titleSpan = document.createElement('span');
        titleSpan.className = 'panel-title';
        titleSpan.textContent = panelInfo.name;
        leftDiv.appendChild(titleSpan);

        header.appendChild(leftDiv);

        // Create right section
        const rightDiv = document.createElement('div');
        rightDiv.className = 'panel-header-right';

        // Create buttons container or a placeholder div if no buttons are defined for expandModeButtons
        let buttonsContainer;
        if (panelInfo.expandModeButtons) {
            buttonsContainer = this.generateButtons(panelInfo.expandModeButtons);
        } else {
            buttonsContainer = document.createElement('div');
        }

        if (buttonsContainer) {
            buttonsContainer.className = 'panel-header-buttons';

            // Add collapse button to the same container
            const collapseBtn = document.createElement('button');
            collapseBtn.title = 'Collapse panel';
            collapseBtn.dataset.panel = panelName;
            collapseBtn.innerHTML = '<span class="collapse-icon">📁</span>';
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.collapsePanel(panelName);
            });
            buttonsContainer.appendChild(collapseBtn);

            rightDiv.appendChild(buttonsContainer);
        }

        header.appendChild(rightDiv);

        return header;
    },

    // Get current expanded panels for a tool
    getExpandedPanels() {
        return this.panelsState ? Array.from(this.panelsState.expandedPanels) : [];
    },

    // Check if a panel is expanded
    isPanelExpanded(panelName) {
        return this.panelsState ? this.panelsState.expandedPanels.has(panelName) : false;
    },

    // Get expand order for a tool
    getExpandOrder() {
        return this.panelsState ? [...this.panelsState.expandOrder] : [];
    }
};

// Make PanelsService globally available
window.PanelsService = PanelsService;
