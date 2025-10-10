// Tool Loader Module
// Handles loading and managing tools in the drawer

const ToolLoader = {
    tools: {},
    activeTool: null,
    
    // Initialize tool loader
    async init() {
        this.bindEvents();
        await this.loadTools();
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
            const response = await Utils.fetchJSON('/api/tools');
            
            if (response.success) {
                this.tools = response.tools;
                this.renderToolsList();
                this.updateToolsCount();
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

            const response = await Utils.fetchJSON('/api/tools/refresh', {
                method: 'POST'
            });
            
            if (response.success) {
                this.tools = response.tools;
                this.renderToolsList();
                this.updateToolsCount();
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

        const toolNames = Object.keys(this.tools);
        
        if (toolNames.length === 0) {
            toolsList.innerHTML = `
                <div class="no-tools">
                    <h4>No Tools Available</h4>
                    <p>Add tools to the backend/tools directory to get started.</p>
                </div>
            `;
            return;
        }

        // Sort tools by name
        toolNames.sort();

        // Create tool items
        toolNames.forEach(toolName => {
            const tool = this.tools[toolName];
            const toolItem = this.createToolItem(toolName, tool);
            toolsList.appendChild(toolItem);
        });
    },

    // Create a single tool item element
    createToolItem(toolName, toolInfo) {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        toolItem.dataset.toolName = toolName;
        
        const name = toolInfo.name || toolName;
        const description = toolInfo.description || 'No description available';
        const category = toolInfo.category || 'general';
        const icon = toolInfo.icon || '🔧';

        toolItem.innerHTML = `
            <div class="tool-icon">${icon}</div>
            <div class="tool-name">${name}</div>
            <div class="tool-description">${description}</div>
            <div class="tool-category">${category}</div>
        `;

        // Add click event
        toolItem.addEventListener('click', () => {
            this.selectTool(toolName, toolInfo);
        });

        return toolItem;
    },

    // Select and load a tool
    async selectTool(toolName, toolInfo) {
        try {
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
            await this.loadToolContent(toolName, toolInfo);
            
            // Update tool header
            this.updateToolHeader(toolInfo);
            
            this.activeTool = toolName;
            
            // Save selected tool to storage
            Utils.setAppPreference('lastSelectedTool', toolName);
            
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
    async loadToolContent(toolName, toolInfo) {
        const toolContent = document.getElementById('toolContent');
        if (!toolContent) return;

        // Create tool container
        const toolContainer = document.createElement('div');
        toolContainer.className = 'tool-container';
        toolContainer.dataset.toolName = toolName;
        
        // Try to load tool HTML
        try {
            const htmlResponse = await fetch(`/static/tools/${toolName}/index.html`);
            if (htmlResponse.ok) {
                const html = await htmlResponse.text();
                toolContainer.innerHTML = html;
            } else {
                // Fallback: create basic tool layout
                toolContainer.innerHTML = this.createFallbackToolHTML(toolName, toolInfo);
            }
        } catch (error) {
            // Fallback: create basic tool layout
            toolContainer.innerHTML = this.createFallbackToolHTML(toolName, toolInfo);
        }

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
    },

    // Create fallback HTML for tools without custom HTML
    createFallbackToolHTML(toolName, toolInfo) {
        const name = toolInfo.name || toolName;
        const description = toolInfo.description || 'No description available';
        
        return `
            <div class="tool-header">
                <h2>${name}</h2>
                <p>${description}</p>
            </div>
            <div class="tool-body">
                <div class="tool-placeholder">
                    <p>This tool is under development.</p>
                    <p>Tool files should be placed in:</p>
                    <ul>
                        <li>Backend: <code>backend/tools/${toolName}/</code></li>
                        <li>Frontend: <code>frontend/static/tools/${toolName}/</code></li>
                    </ul>
                </div>
            </div>
        `;
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

    // Update tools count in welcome screen
    updateToolsCount() {
        const toolsCountElement = document.getElementById('toolsCount');
        if (toolsCountElement) {
            toolsCountElement.textContent = Object.keys(this.tools).length;
        }
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

    // Update tool header with icon and name
    updateToolHeader(toolInfo) {
        const toolIcon = document.getElementById('toolIcon');
        const toolName = document.getElementById('toolName');
        
        if (toolIcon && toolInfo.icon) {
            toolIcon.textContent = toolInfo.icon;
        }
        
        if (toolName && toolInfo.name) {
            toolName.textContent = toolInfo.name;
        }
    },

    // Show error message
    showError(message) {
        console.error(message);
        // You can implement a toast or modal here
        alert(message); // Simple fallback
    },

    // Auto-select last used tool
    async autoSelectLastTool() {
        const lastTool = Utils.getAppPreference('lastSelectedTool');
        if (lastTool && this.tools[lastTool]) {
            await this.selectTool(lastTool, this.tools[lastTool]);
        }
    }
};

// Make ToolLoader globally available
window.ToolLoader = ToolLoader;