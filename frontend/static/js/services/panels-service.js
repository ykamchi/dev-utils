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
        });
        
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
        if (typeof panelObject.onExpand !== 'function') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'onExpand' property is required and must be a function`);
        }
        if (typeof panelObject.onCollapse !== 'function') {
            throw new Error(`[PanelsService] Panel ${panelName}: 'onCollapse' property is required and must be a function`);
        }

        return {
            name: panelObject.name,
            icon: panelObject.icon,
            description: panelObject.description,
            render: panelObject.render.bind(panelObject),
            init: panelObject.init.bind(panelObject),
            collapseModeButtons: panelObject.collapseModeButtons,
            expandModeButtons: panelObject.expandModeButtons,
            onExpand: panelObject.onExpand.bind(panelObject),
            onCollapse: panelObject.onCollapse.bind(panelObject)
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
        this.currentViewMode = StorageService.getLocalStorageItem(`panels-view-mode-${this.toolName}`, 'vertical');

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

        const panelsContainer = this.createPanelsContainer();

        this.initializeDragAndDrop();

        if (firstPanel) {
            this.expandPanel(firstPanel);
        }
    },

    // Helper function to generate button elements from button objects
    generateButtons(buttons, panelName) {
        if (!buttons || !Array.isArray(buttons)) return null;

        const container = document.createElement('div');
        container.className = 'panel-buttons';

        // Get the panel object from the global window
        const panelObjectName = panelName.replace(/-/g, '_');
        const panelObject = window[panelObjectName];

        buttons.forEach((button, index) => {
            const btnElement = document.createElement('button');
            btnElement.className = 'panel-header-button';
            btnElement.title = button.title;
            btnElement.textContent = button.icon;
            btnElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (panelObject && typeof button.callback === 'function') {
                    button.callback.call(panelObject);
                }
            });
            container.appendChild(btnElement);
        });

        return container;
    },

    // Create a collapsed panel button for the secondary toolbar
    createCollapsedPanel(panelName, panelInfo) {
        console.log(`[PanelsService] Creating collapsed panel button for: ${panelName}`);

        const panelButton = document.createElement('div');
        panelButton.className = 'collapsed-panel collapsed';
        panelButton.dataset.panelName = panelName;
        panelButton.dataset.toolName = this.toolName;

        // Create panel info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'collapsed-panel-info';

        // Create icon div
        const iconDiv = document.createElement('div');
        iconDiv.className = 'collapsed-panel-icon';
        iconDiv.textContent = panelInfo.icon;
        infoDiv.appendChild(iconDiv);

        // Create name div
        const nameDiv = document.createElement('div');
        nameDiv.className = 'collapsed-panel-name';
        nameDiv.textContent = panelInfo.name;
        infoDiv.appendChild(nameDiv);

        // Create status div
        const statusDiv = document.createElement('div');
        statusDiv.className = 'collapsed-panel-status';
        infoDiv.appendChild(statusDiv);

        panelButton.appendChild(infoDiv);

        // Add buttons if they exist
        if (panelInfo.collapseModeButtons) {
            const buttonsContainer = this.generateButtons(panelInfo.collapseModeButtons, panelName);
            if (buttonsContainer) {
                buttonsContainer.className = 'collapsed-panel-buttons';
                panelButton.appendChild(buttonsContainer);
            }
        }

        // Add click handler
        panelButton.addEventListener('click', () => {
            this.togglePanel(panelName);
        });

        // Trigger onCollapse event for the panel
        panelInfo.onCollapse(statusDiv);

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
        console.log(`[PanelsService] Expanding panel: ${panelName}`);

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

        // Update UI - remove from collapsed, add to expanded
        this.removePanelFromCollapsedContainer(panelName);
        this.addPanelToPanelsContainer(panelName);        
        
        // Trigger onExpand event to the panel
        panelInfo.onExpand();
    },

    // Collapse a specific panel
    collapsePanel(panelName) {
        console.log(`[PanelsService] Collapsing panel: ${panelName}`);

        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) return;

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

        // Update UI - remove from expanded, add to collapsed
        this.addPanelToCollapsedContainer(panelName);
        this.removePanelFromPanelsContainer(panelName);        
        
    },

    // Create and setup the panels container
    createPanelsContainer() {
        console.log('[PanelsService] Creating panels container');

        // Clear content area
        this.panelsState.contentArea.innerHTML = '';

        // Create container for expanded panels
        const panelsContainer = document.createElement('div');
        panelsContainer.className = `expanded-panels-container view-mode-${this.currentViewMode}`;

        this.panelsState.contentArea.appendChild(panelsContainer);

        return panelsContainer;
    },

    // Add a panel to the existing panels container
    addPanelToPanelsContainer(panelName) {
        console.log(`[PanelsService] Adding panel to panels container: ${panelName}`);

        const panelsContainer = this.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (!panelsContainer) {
            console.error('Panels container not found');
            return;
        }

        const panelElement = this.createPanelElement(panelName);
        if (panelElement) {
            panelsContainer.appendChild(panelElement);
        }

        this.initializeDragAndDrop();
    },

    // Remove a panel from the panels container
    removePanelFromPanelsContainer(panelName) {
        console.log(`[PanelsService] Removing panel from panels container: ${panelName}`);

        const panelsContainer = this.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (!panelsContainer) {
            console.error('Panels container not found');
            return;
        }

        const panelElement = panelsContainer.querySelector(`[data-panel-name="${panelName}"]`);
        if (panelElement) {
            panelsContainer.removeChild(panelElement);
        }
        
    },

    // Add a panel to the collapsed container
    addPanelToCollapsedContainer(panelName) {
        console.log(`[PanelsService] Adding panel to collapsed container: ${panelName}`);

        const collapsedContainer = this.panelsState.secondaryToolbar.querySelector('#collapsedPanelsContainer');
        if (!collapsedContainer) {
            console.error('Collapsed container not found');
            return;
        }

        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) return;

        const panelButton = this.createCollapsedPanel(panelName, panelInfo);
        collapsedContainer.appendChild(panelButton);
    },

    // Remove a panel from the collapsed container
    removePanelFromCollapsedContainer(panelName) {
        console.log(`[PanelsService] Removing panel from collapsed container: ${panelName}`);

        const collapsedContainer = this.panelsState.secondaryToolbar.querySelector('#collapsedPanelsContainer');
        if (!collapsedContainer) {
            console.error('Collapsed container not found');
            return;
        }

        const panelElement = collapsedContainer.querySelector(`[data-panel-name="${panelName}"]`);
        if (panelElement) {
            collapsedContainer.removeChild(panelElement);
        }
    },

    // Create a panel element for expanded display
    createPanelElement(panelName) {
        console.log(`[PanelsService] Creating panel element for: ${panelName}`);

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
        const { header: panelHeader, statusDiv: headerStatusContainer } = this.createPanelHeader(panelName);
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
            panelInfo.init(contentContainer, headerStatusContainer);
        } catch (error) {
            console.error(`Error initializing panel ${panelName}:`, error);
        }

        return panelElement;
    },

    // Create panel header with emoji, name, and collapse button
    createPanelHeader(panelName) {
        console.log(`[PanelsService] Creating panel header for: ${panelName}`);

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

        // Create status section
        const statusDiv = document.createElement('div');
        statusDiv.className = 'panel-status';
        header.appendChild(statusDiv);

        // Create right section
        const rightDiv = document.createElement('div');
        rightDiv.className = 'panel-header-right';

        // Create buttons container or a placeholder div if no buttons are defined for expandModeButtons
        let buttonsContainer;
        if (panelInfo.expandModeButtons) {
            buttonsContainer = this.generateButtons(panelInfo.expandModeButtons, panelName);
        } else {
            buttonsContainer = document.createElement('div');
        }

        if (buttonsContainer) {
            buttonsContainer.className = 'panel-header-buttons';

            // Add information button
            const infoBtn = document.createElement('button');
            infoBtn.className = 'panel-header-button';
            infoBtn.title = 'Panel information';
            infoBtn.dataset.panel = panelName;
            infoBtn.textContent = '❔';
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPanelInfo(panelName, infoBtn);
            });
            buttonsContainer.appendChild(infoBtn);

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

        return { header, statusDiv };
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
        console.log(`[PanelsService] Setting view mode to: ${mode}`);

        if (!['vertical', 'horizontal', 'grid'].includes(mode)) {
            console.error(`Invalid view mode: ${mode}`);
            return;
        }
        this.currentViewMode = mode;
        
        // Update the class on the existing panels container instead of re-rendering
        const container = this.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (container) {
            container.className = `expanded-panels-container view-mode-${mode}`;
        }
        
        StorageService.setLocalStorageItem(`panels-view-mode-${this.toolName}`, this.currentViewMode);
    },

    // Initialize drag and drop for panels
    initializeDragAndDrop() {
        console.log('[PanelsService] Initializing drag and drop for panels');

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
        
        // Determine if we should insert before or after based on mouse position
        const rect = dropTarget.getBoundingClientRect();
        const isAfter = e.clientX > rect.left + rect.width / 2;
        
        // Reorder panels
        this.reorderPanels(draggedPanel, dropPanel, isAfter);
        
        // Move the DOM element instead of recreating all panels
        const draggedElement = this.dragState.draggedElement;
        if (draggedElement && dropTarget) {
            const parent = dropTarget.parentNode;
            if (isAfter) {
                parent.insertBefore(draggedElement, dropTarget.nextSibling);
            } else {
                parent.insertBefore(draggedElement, dropTarget);
            }
        }
    },

    // Reorder panels in expand order
    reorderPanels(draggedPanel, targetPanel, insertAfter = false) {
        console.log(`[PanelsService] Reordering panels: ${draggedPanel} -> ${targetPanel}, insertAfter: ${insertAfter}`);

        const currentIndex = this.panelsState.expandOrder.indexOf(draggedPanel);
        const targetIndex = this.panelsState.expandOrder.indexOf(targetPanel);

        if (currentIndex === -1 || targetIndex === -1) return;

        // Remove dragged panel from current position
        this.panelsState.expandOrder.splice(currentIndex, 1);

        // Insert at target position (after if insertAfter is true)
        const insertPosition = insertAfter ? targetIndex + 1 : targetIndex;
        this.panelsState.expandOrder.splice(insertPosition, 0, draggedPanel);
    },

    // Show panel information popup
    showPanelInfo(panelName, buttonElement) {
        const panelInfo = this.panelsState.panelsInfo.get(panelName);
        if (!panelInfo) return;

        // Remove any existing popup
        const existingPopup = document.querySelector('.panel-info-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'panel-info-popup';

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-button';
        closeBtn.textContent = '✕';
        closeBtn.onclick = () => popup.remove();

        // Create content
        const title = document.createElement('h3');
        title.className = 'popup-title';
        title.innerHTML = `${panelInfo.icon} ${panelInfo.name}`;

        const description = document.createElement('p');
        description.className = 'popup-description';
        description.textContent = panelInfo.description;

        // Assemble popup
        popup.appendChild(closeBtn);
        popup.appendChild(title);
        popup.appendChild(description);

        // Add to body first to get correct dimensions
        document.body.appendChild(popup);

        // Position the popup near the button
        if (buttonElement) {
            const buttonRect = buttonElement.getBoundingClientRect();
            const popupRect = popup.getBoundingClientRect();

            // Position below the button, aligned to the left
            popup.style.left = `${buttonRect.left}px`;
            popup.style.top = `${buttonRect.bottom + 5}px`;

            // Ensure popup doesn't go off-screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const popupWidth = popup.offsetWidth;
            const popupHeight = popup.offsetHeight;

            // Check if popup goes off the right edge
            if (buttonRect.left + popupWidth > viewportWidth) {
                popup.style.left = `${viewportWidth - popupWidth - 10}px`;
            }

            // Check if popup goes off the bottom edge
            if (buttonRect.bottom + popupHeight + 5 > viewportHeight) {
                popup.style.top = `${buttonRect.top - popupHeight - 5}px`;
            }
        }

        // Close on outside click
        const closeOnOutsideClick = (e) => {
            if (!popup.contains(e.target) && e.target !== buttonElement) {
                popup.remove();
                document.removeEventListener('click', closeOnOutsideClick);
            }
        };

        // Delay adding the click listener to avoid immediate closure
        setTimeout(() => {
            document.addEventListener('click', closeOnOutsideClick);
        }, 10);
    }
};

// Make PanelsService globally available
window.PanelsService = PanelsService;
