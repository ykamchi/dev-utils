// Tools Service Module
// Handles loading and managing tools in the drawer

const ToolsService = {
    toolsState: {},
    activeToolName: null,
    
    // Initialize tool loader
    async init() {
        this.bindEvents();
        await this.loadTools();
        await this.loadWelcomeScreen();
    },

    // Bind event listeners
    bindEvents() {
        const refreshBtn = document.getElementById('refreshToolsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTools());
        }
    },

    // Load all available tools from the backend
    async loadTools() {
        try {
            this.showLoading(true);
            const response = await StorageService.fetchJSON('/api/tools');
            
            if (response.success) {
                this.toolsState = response.tools;
                this.renderToolsList();
            } else {
                this.showError('Failed to load tools: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error loading tools:', error);
            this.showError('Failed to connect to backend');
        } finally {
            this.showLoading(false);
        }
    },

    // Load welcome screen HTML
    async loadWelcomeScreen() {
        try {
            const response = await fetch('/static/welcome-screen.html');
            if (response.ok) {
                const html = await response.text();
                const contentArea = document.getElementById('contentArea');
                if (contentArea) {
                    // Insert welcome screen at the beginning of content area
                    contentArea.insertAdjacentHTML('afterbegin', html);
                }
            } else {
                console.error('Failed to load welcome screen:', response.status);
            }
        } catch (error) {
            console.error('Error loading welcome screen:', error);
        }
    },

    // Refresh tools from backend
    async refreshTools() {
        try {
            const refreshBtn = document.getElementById('refreshToolsBtn');
            const refreshIcon = refreshBtn?.querySelector('.refresh-icon');
            
            // Add spinning animation
            if (refreshIcon) {
                refreshIcon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    refreshIcon.style.transform = '';
                }, 300);
            }

            const response = await StorageService.fetchJSON('/api/tools/refresh', {
                method: 'POST'
            });
            
            if (response.success) {
                this.toolsState = response.tools;
                this.renderToolsList();
            } else {
                this.showError('Failed to refresh tools: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error refreshing tools:', error);
            this.showError('Failed to refresh tools');
        }
    },

    // Render the tools list in the drawer
    renderToolsList() {
        const toolsList = document.getElementById('toolsList');
        if (!toolsList) return;

        // Clear existing content
        toolsList.innerHTML = '';

        const toolNames = Object.keys(this.toolsState);
        
        if (toolNames.length === 0) {
            const noToolsDiv = document.createElement('div');
            noToolsDiv.className = 'no-tools';
            
            const heading = document.createElement('h4');
            heading.textContent = 'No Tools Available';
            
            const paragraph = document.createElement('p');
            paragraph.textContent = 'Add tools to the backend/tools directory to get started.';
            
            noToolsDiv.appendChild(heading);
            noToolsDiv.appendChild(paragraph);
            toolsList.appendChild(noToolsDiv);
            return;
        }

        // Sort tools by name
        toolNames.sort();

        // Create tool items
        toolNames.forEach(toolName => {
            const toolItem = this.createToolItem(toolName);
            toolsList.appendChild(toolItem);
        });

        // Update tools count in welcome screen
        const toolsCountElement = document.getElementById('toolsCount');
        if (toolsCountElement) {
            toolsCountElement.textContent = toolNames.length;
        }
    },

    // Create a single tool item element
    createToolItem(toolName) {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        toolItem.dataset.toolName = toolName;
        
        const toolInfo = this.toolsState[toolName];
        const name = toolInfo.name || toolName;
        const description = toolInfo.description || 'No description available';
        const category = toolInfo.category || 'general';
        const icon = toolInfo.icon || '🔧';

        // Create tool icon element
        const toolIcon = document.createElement('div');
        toolIcon.className = 'tool-icon';
        toolIcon.textContent = icon;

        // Create tool name element
        const toolNameElement = document.createElement('div');
        toolNameElement.className = 'tool-name';
        toolNameElement.textContent = name;

        // Create tool description element
        const toolDescription = document.createElement('div');
        toolDescription.className = 'tool-description';
        toolDescription.textContent = description;

        // Create tool category element
        const toolCategory = document.createElement('div');
        toolCategory.className = 'tool-category';
        toolCategory.textContent = category;

        // Append all elements to tool item
        toolItem.appendChild(toolIcon);
        toolItem.appendChild(toolNameElement);
        toolItem.appendChild(toolDescription);
        toolItem.appendChild(toolCategory);

        // Add click event
        toolItem.addEventListener('click', () => {
            this.selectTool(toolName);
        });

        return toolItem;
    },

    // Select and load a tool
    async selectTool(toolName) {
        try {
            // Get tool info from state
            const toolInfo = this.toolsState[toolName];
            if (!toolInfo) {
                throw new Error(`Tool '${toolName}' not found`);
            }

            // Update UI to show selection
            this.updateToolSelection(toolName);
            
            // Show loading overlay
            this.showLoadingOverlay(true);
            
            // Hide welcome screen and show tool content
            const welcomeScreen = document.getElementById('welcomeScreen');
            const toolContent = document.getElementById('toolContent');
            
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (toolContent) toolContent.style.display = 'block';
            
            // Load tool content
            await this.loadToolContent(toolName);
            
            // Update tool header
            this.updateToolHeader(toolName);
            
            this.activeToolName = toolName;
            
            // Save selected tool to storage
            StorageService.setAppPreference('lastSelectedTool', toolName);
            
        } catch (error) {
            console.error('Error selecting tool:', error);
            this.showError(`Failed to load tool: ${toolName}`);
        } finally {
            this.showLoadingOverlay(false);
        }
    },

    // Update visual selection of tools
    updateToolSelection(selectedToolName) {
        const toolItems = document.querySelectorAll('.tool-item');
        toolItems.forEach(item => {
            if (item.dataset.toolName === selectedToolName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    // Load tool content (HTML/JS)
    async loadToolContent(toolName) {
        const toolContent = document.getElementById('toolContent');
        if (!toolContent) {
            console.error(`Tool content container not found for tool: ${toolName}`);
            return;
        }

        // Get tool info from state
        const toolInfo = this.toolsState[toolName];
        if (!toolInfo) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        // Create tool container
        const toolContainer = document.createElement('div');
        toolContainer.className = 'tool-container';
        toolContainer.dataset.toolName = toolName;
        
        // Load tool HTML
        await this.loadToolHTML(toolName, toolContainer);

        // Clear and add new content
        toolContent.innerHTML = '';
        toolContent.appendChild(toolContainer);

        // Try to load tool CSS
        try {
            await this.loadToolCSS(toolName);
        } catch (error) {
            console.warn(`No CSS found for tool: ${toolName}`);
        }

        // Try to load tool JavaScript
        try {
            await this.loadToolScript(toolName);
        } catch (error) {
            console.warn(`No script found for tool: ${toolName}`);
        }

        // Panels are now handled exclusively in loadToolHTML -> loadToolPanels
        // No need for redundant initialization here
    },

    // Create HTML for tools that use the panels system
    createPanelsToolHTML(toolName, toolInfo) {
        const container = document.createElement('div');
        container.className = 'panels-tool-container';

        const toolbar = document.createElement('div');
        toolbar.className = 'panels-secondary-toolbar';
        toolbar.id = 'secondaryToolbar';
        toolbar.innerHTML = '<!-- Collapsed panels will be inserted here by PanelsService -->';

        const contentArea = document.createElement('div');
        contentArea.className = 'panels-content-area';
        contentArea.id = 'panelsContent';
        contentArea.innerHTML = '<!-- Panel content will be inserted here by PanelsService -->';

        container.appendChild(toolbar);
        container.appendChild(contentArea);

        return container;
    },

    // Load tool-specific content HTML
    async loadToolHTML(toolName, toolContainer) {
        try {
            if (await this.loadToolIndexHTML(toolName, toolContainer)) {
                return;
            } else if (await this.loadToolPanels(toolName, toolContainer)) {
                return;
            } else {
                // Fail to load index.html or panels, show error
                toolContainer.innerHTML = `<div class="tool-error"><h3>Failed to load tool</h3><p>Could not load index.html or panels for tool: ${toolName}</p><p>Error: ${error.message}</p></div>`;
            }
        } catch (error) {
            // Fail to load index.html or panels, show error
            toolContainer.innerHTML = `<div class="tool-error"><h3>Failed to load tool</h3><p>Could not load index.html or panels for tool: ${toolName}</p><p>Error: ${error.message}</p></div>`;
        }
    },

    // Load tool HTML if index.html exists
    async loadToolIndexHTML(toolName, toolContainer) {
        const htmlResponse = await fetch(`/static/tools/${toolName}/index.html`);
        if (htmlResponse.ok) {
            // index.html file exists, load it
            const html = await htmlResponse.text();
            toolContainer.innerHTML = html;
            return true
        } else {
            return false; // Indicate that index.html was not found
        }
    },

    // Try to load panels for a tool that doesn't have HTML
    async loadToolPanels(toolName, toolContainer) {
        // Check if PanelsService is available
        if (typeof PanelsService === 'undefined') {
            throw new Error('PanelsService not available');
        }

        // FIRST: Create the DOM structure so PanelsService.initForTool can find the elements
        const toolInfo = this.toolsState[toolName] || {};
        const panelElement = this.createPanelsToolHTML(toolName, toolInfo);
        toolContainer.appendChild(panelElement);

        // THEN: Initialize panels (DOM now exists for initializeUI)
        await PanelsService.initForTool(toolName);

        // Check if any panels were actually loaded
        if (PanelsService.panelsState && PanelsService.panelsState.panelsInfo.size > 0) {
            // Panels were found and initialized successfully
            return true;
        } else {
            // No panels found, remove the DOM we just created
            toolContainer.removeChild(panelElement);
            return false;
        }
    },

    // Load tool-specific CSS
    async loadToolCSS(toolName) {
        // Remove existing tool stylesheets
        const existingLink = document.querySelector(`link[data-tool="${toolName}"]`);
        if (existingLink) {
            existingLink.remove();
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `/static/tools/${toolName}/style.css`;
        link.dataset.tool = toolName;
        link.onerror = () => {
            // CSS not found or failed to load - this is expected for tools without CSS
        };
        
        document.head.appendChild(link);
    },

    // Load tool-specific JavaScript
    async loadToolScript(toolName) {
        // Remove existing tool scripts
        const existingScript = document.querySelector(`script[data-tool="${toolName}"]`);
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = `/static/tools/${toolName}/script.js`;
        script.dataset.tool = toolName;
        script.onerror = () => {
            // Script not found or failed to load - this is expected for tools without JS
        };
        
        document.head.appendChild(script);
    },

    // Show/hide loading state in tools list
    showLoading(show) {
        const toolsList = document.getElementById('toolsList');
        if (!toolsList) return;

        if (show) {
            toolsList.innerHTML = '<div class="loading-tools">Loading tools...</div>';
        }
    },

    // Show/hide loading overlay
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },

    // Show error message
    showError(message) {
        console.error('Tools Service Error:', message);
        // You could implement a toast notification or error display here
        alert('Error: ' + message);
    },

    // Update tool header with icon and name
    updateToolHeader(toolName) {
        const toolInfo = this.toolsState[toolName];
        if (!toolInfo) {
            console.warn(`Tool info not found for: ${toolName}`);
            return;
        }

        const toolIcon = document.getElementById('toolIcon');
        const toolNameElement = document.getElementById('toolName');
        const toolDescription = document.getElementById('toolDescription');
        
        if (toolIcon && toolInfo.icon) {
            toolIcon.textContent = toolInfo.icon;
        }
        
        if (toolNameElement && toolInfo.name) {
            toolNameElement.textContent = toolInfo.name;
        }

        if (toolDescription && toolInfo.description) {
            toolDescription.textContent = toolInfo.description;
        }
    },

    // Auto-select last used tool
    async autoSelectLastTool() {
        const lastTool = StorageService.getAppPreference('lastSelectedTool');
        if (lastTool && this.toolsState[lastTool]) {
            await this.selectTool(lastTool);
        } else {
            // No tool selected, ensure welcome screen is visible
            const welcomeScreen = document.getElementById('welcomeScreen');
            const toolContent = document.getElementById('toolContent');
            if (welcomeScreen) welcomeScreen.style.display = 'flex';
            if (toolContent) toolContent.style.display = 'none';
        }
    }
};

// Make ToolsService globally available
window.ToolsService = ToolsService;