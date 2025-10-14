// Panel Service (Panels Manager)
// Handles panel-based tools with secondary toolbar and expand/collapse functionality

const PanelsService = {
    panelsState: null, // Current tool's panel data
    toolName: null,
    currentViewMode: 'horizontal', // 'vertical', 'horizontal', 'grid'
    dragState: null, // For drag and drop

    // Initialize panel service for a specific tool
    async init(toolName) {
        console.log(`[PanelsService] Initializing PanelsService for tool: ${toolName}`);

        // Destroy panels from the previous tool before initializing the new one
        // this.destroyPanels(this.toolName);

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

        // Always reinitialize UI since DOM may have been recreated
        setTimeout(() => {
            this.initializeUI();    
        }, 100);
        
    },

    // Discover panels for a tool
    async discoverPanels() {
        console.log(`[PanelsService] Discovering panels for tool: ${this.toolName}`);

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
                            console.warn(`[PanelsService] Failed to load panel: ${panelName}`, error);
                        }
                    }
                }
            } else {
                console.warn(`[PanelsService] Failed to fetch panels for ${this.toolName}: ${response.status}`);
            }
        } catch (error) {
            console.error(`[PanelsService] Error discovering panels for ${this.toolName}:`, error);
        }
    },

    // Load a single panel
    async loadPanelInfo(panelName) {
        console.log(`[PanelsService] Loading panel info for: ${panelName}`);

        return new Promise((resolve, reject) => {
            console.log(`[PanelsService] Loading panel script: ${panelName}`);
            const script = document.createElement('script');
            script.src = `/static/tools/${this.toolName}/panels/${panelName}.js`;
            script.onload = async () => {
                try {
                    // Get panel info from the loaded script
                    const panelInfo = await this.getPanelInfo(panelName);

                    // Store panel info
                    this.panelsState.panelsInfo.set(panelName, panelInfo);
                    console.log(`[PanelsService] Loaded panel: ${panelName} with panel info: `, panelInfo);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            script.onerror = () => {
                reject(new Error(`[PanelsService] Failed to load panel script: ${panelName}`));
            };
            document.head.appendChild(script);
        });
    },

    // Get panel information from loaded script
    async getPanelInfo(panelName) {
        console.log(`[PanelsService] Getting panel info for: ${panelName}`);

        // Convert panel filename to global object name (hyphens become underscores)
        // e.g., 'panel-1' becomes 'panel_1' to match the global object defined in the script
        const panelObjectName = panelName.replace(/-/g, '_');
        const panelObject = window[panelObjectName];

        if (!panelObject) {
            throw new Error(`[PanelsService] Panel object not found: ${panelObjectName}`);
        }

        // Required fields - throw errors if missing
        if (!panelObject.name || typeof panelObject.name !== 'string') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'name' property is required and must be a string`);
        }
        if (!panelObject.icon || typeof panelObject.icon !== 'string') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'icon' property is required and must be a string`);
        }
        if (!panelObject.render || typeof panelObject.render !== 'function') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'render' property is required and must be a function`);
        }
        if (!panelObject.description || typeof panelObject.description !== 'string') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'description' property is required and must be a string`);
        }
        if (!panelObject.init || typeof panelObject.init !== 'function') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'init' property is required and must be a function`);
        }
        if (!panelObject.destroy || typeof panelObject.destroy !== 'function') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'destroy' property is required and must be a function`);
        }
        if (!Array.isArray(panelObject.collapseModeButtons)) {
            throw new Error(`[PanelsService] Panel ${panelName}: 'collapseModeButtons' property is required and must be an array`);
        }
        if (!Array.isArray(panelObject.expandModeButtons)) {
            throw new Error(`[PanelsService] Panel ${panelName}: 'expandModeButtons' property is required and must be an array`);
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

    // Add view mode controls to tool header
    addViewModeControls() {
        console.log('[PanelsService] Adding view mode controls to tool header');

        // Remove any existing toolbar-left-section to prevent duplicates
        const existingLeftSection = document.querySelector('.toolbar-left-section');
        if (existingLeftSection) {
            existingLeftSection.remove();
        }

        // Create left section for view mode controls
        const leftSection = document.createElement('div');
        leftSection.className = 'toolbar-left-section';

        // Create view mode controls container
        const viewModeControls = document.createElement('div');
        viewModeControls.className = 'view-mode-controls';

        // Create view mode buttons container
        const viewModeButtons = document.createElement('div');
        viewModeButtons.className = 'view-mode-buttons';

        // Create buttons
        const modes = [
            { mode: 'vertical', title: 'Vertical Layout', text: 'Vertical' },
            { mode: 'horizontal', title: 'Horizontal Layout', text: 'Horizontal' },
            { mode: 'grid', title: 'Grid Layout', text: 'Grid' }
        ];

        modes.forEach(({ mode, title, text }) => {
            const button = document.createElement('button');
            button.className = `view-mode-btn ${this.currentViewMode === mode ? 'active' : ''}`;
            button.setAttribute('data-mode', mode);
            button.setAttribute('title', title);
            button.textContent = text;
            viewModeButtons.appendChild(button);
        });

        // Assemble the structure
        viewModeControls.appendChild(viewModeButtons);
        leftSection.appendChild(viewModeControls);

        // Add to tool header after tool-description
        const toolHeader = document.querySelector('.tool-header');
        const toolDescription = document.getElementById('toolDescription');
        
        if (toolHeader && toolDescription) {
            // Insert after tool-description
            toolDescription.insertAdjacentElement('afterend', leftSection);
        }

        // Add event listeners
        leftSection.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.setViewMode(mode);
                // Update active state
                leftSection.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // Initialize UI for panels
    initializeUI() {
        console.log('[PanelsService] Initializing UI for panels');
        
        // Load view mode preference
        this.loadViewModePreference();

        // Get fresh DOM references since they may have been recreated
        this.panelsState.secondaryToolbar = document.getElementById('secondaryToolbar');
        this.panelsState.contentArea = document.getElementById('panelsContent');

        if (!this.panelsState.secondaryToolbar || !this.panelsState.contentArea) {
            console.error('Secondary toolbar or content area not found');
            return;
        }

        // Clear existing content
        this.panelsState.secondaryToolbar.innerHTML = '';

        // Create collapsed panels container in secondary toolbar
        const collapsedContainer = document.createElement('div');
        collapsedContainer.className = 'toolbar-right-section';
        collapsedContainer.id = 'collapsedPanelsContainer';
        this.panelsState.secondaryToolbar.appendChild(collapsedContainer);

        // Add view mode controls to tool header
        this.addViewModeControls();

        // Initialize collapse order with all panels (they start collapsed)
        this.panelsState.collapseOrder = Array.from(this.panelsState.panelsInfo.keys());

        // Create secondary toolbar panels for all panels initially (they're all collapsed)
        const collapsedContainerRef = this.panelsState.secondaryToolbar.querySelector('#collapsedPanelsContainer');
        for (const [panelName, panelInfo] of this.panelsState.panelsInfo) {
            const panelButton = this.createCollapsedPanel(panelName, panelInfo);
            collapsedContainerRef.appendChild(panelButton);
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
            btnElement.className = 'panel-header-button';
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
        const collapsedContainer = this.panelsState.secondaryToolbar.querySelector('#collapsedPanelsContainer');
        if (collapsedContainer) {
            collapsedContainer.innerHTML = '';
        }

        // Create panels only for collapsed panels, ordered by collapse order
        for (const panelName of this.panelsState.collapseOrder) {
            if (!this.panelsState.expandedPanels.has(panelName)) {
                const panelInfo = this.panelsState.panelsInfo.get(panelName);
                if (panelInfo) {
                    const panelButton = this.createCollapsedPanel(panelName, panelInfo);
                    collapsedContainer.appendChild(panelButton);
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
        panelsContainer.className = `expanded-panels-container view-mode-${this.currentViewMode}`;

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

        // Initialize drag and drop
        this.initializeDragAndDrop();
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
        panelElement.draggable = true;

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
            collapseBtn.className = 'panel-header-button';
            collapseBtn.title = 'Collapse panel';
            collapseBtn.dataset.panel = panelName;
            collapseBtn.textContent = '📁';
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
    },

    // Set view mode
    setViewMode(mode) {
        if (!['vertical', 'horizontal', 'grid'].includes(mode)) {
            console.error(`Invalid view mode: ${mode}`);
            return;
        }
        this.currentViewMode = mode;
        this.updatePanelContent();
        this.saveViewModePreference();
    },

    // Get current view mode
    getViewMode() {
        return this.currentViewMode;
    },

    // Save view mode preference to localStorage
    saveViewModePreference() {
        try {
            localStorage.setItem(`panels-view-mode-${this.toolName}`, this.currentViewMode);
        } catch (error) {
            console.warn('Failed to save view mode preference:', error);
        }
    },

    // Load view mode preference from localStorage
    loadViewModePreference() {
        try {
            const saved = localStorage.getItem(`panels-view-mode-${this.toolName}`);
            if (saved && ['vertical', 'horizontal', 'grid'].includes(saved)) {
                this.currentViewMode = saved;
            }
        } catch (error) {
            console.warn('Failed to load view mode preference:', error);
        }
    },

    // Initialize drag and drop for panels
    initializeDragAndDrop() {
        const container = this.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (!container) return;

        // Make panels draggable
        const panels = container.querySelectorAll('.expanded-panel');
        panels.forEach(panel => {
            panel.draggable = true;
            panel.addEventListener('dragstart', this.handleDragStart.bind(this));
            panel.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Make container a drop zone
        container.addEventListener('dragover', this.handleDragOver.bind(this));
        container.addEventListener('drop', this.handleDrop.bind(this));
    },

    // Handle drag start
    handleDragStart(e) {
        this.dragState = {
            draggedPanel: e.target.dataset.panelName,
            draggedElement: e.target
        };
        e.target.style.opacity = '0.5';
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    // Handle drag end
    handleDragEnd(e) {
        if (this.dragState) {
            e.target.style.opacity = '1';
            e.target.classList.remove('dragging');
            this.dragState = null;
        }
        
        // Remove drag-over class from container
        const container = this.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (container) {
            container.classList.remove('drag-over');
        }
    },

    // Handle drag over
    handleDragOver(e) {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';
        
        // Add visual feedback
        const container = e.currentTarget;
        container.classList.add('drag-over');
    },

    // Handle drop
    handleDrop(e) {
        e.preventDefault();
        
        if (!this.dragState) return;

        const container = e.currentTarget;
        const draggedPanel = this.dragState.draggedPanel;
        const dropTarget = e.target.closest('.expanded-panel');

        if (!dropTarget || dropTarget.dataset.panelName === draggedPanel) {
            return;
        }

        const dropPanel = dropTarget.dataset.panelName;
        
        // Reorder panels
        this.reorderPanels(draggedPanel, dropPanel);
        
        // Update UI
        this.updatePanelContent();
    },

    // Reorder panels in expand order
    reorderPanels(draggedPanel, targetPanel) {
        const currentIndex = this.panelsState.expandOrder.indexOf(draggedPanel);
        const targetIndex = this.panelsState.expandOrder.indexOf(targetPanel);

        if (currentIndex === -1 || targetIndex === -1) return;

        // Remove dragged panel from current position
        this.panelsState.expandOrder.splice(currentIndex, 1);

        // Insert at target position
        this.panelsState.expandOrder.splice(targetIndex, 0, draggedPanel);
    }
};

// Make PanelsService globally available
window.PanelsService = PanelsService;
