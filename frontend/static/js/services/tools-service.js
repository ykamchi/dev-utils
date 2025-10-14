// Tools Service Module
// Handles tool selection, loading, and execution

const ToolsService = {
    toolsState: {},
    activeToolName: null,
    
    // Initialize tool loader
    async init() {
        await this.loadWelcomeScreen();
    },

    // Load welcome screen HTML
    async loadWelcomeScreen() {
        console.log('[ToolsService] Loading welcome screen...');

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

    // Load all available tools from the backend
    async loadTools() {
        console.log('[ToolsService] Loading tools from backend...');

        try {
            const response = await Utils.fetchJSON('/api/tools');

            if (response.success) {
                this.setToolsState(response.tools);
                return true;
            } else {
                console.error('Failed to load tools:', response.error || 'Unknown error');
                return false;
            }
        } catch (error) {
            console.error('Error loading tools:', error);
            return false;
        }
    },

    // Select and load a tool
    async selectTool(toolName) {
        console.log(`[ToolsService] Selecting tool: ${toolName}`);

        try {
            // Check if this is the same tool
            if (this.activeToolName === toolName) {
                console.log(`[ToolsService] Tool ${toolName} is already active`);
                return;
            }

            // Get tool info from state
            const toolState = this.getToolState(toolName);
            if (!toolState) {
                throw new Error(`Tool '${toolName}' not found`);
            }

            // Update UI to show selection
            ToolsListService.updateToolSelection(toolName);
            
            // Show loading overlay
            this.showLoadingOverlay(true);
            
            // Hide welcome screen and show tool content
            const welcomeScreen = document.getElementById('welcomeScreen');
            const toolContent = document.getElementById('toolContent');
            
            if (welcomeScreen) welcomeScreen.style.display = 'none';
            if (toolContent) toolContent.style.display = 'block';
            
            // Load tool header
            await this.loadToolHeader(toolName);

            // Load tool content
            await this.loadToolContent(toolName);
                        
            this.activeToolName = toolName;
            
            // Save selected tool to storage
            StorageService.setAppPreference('lastSelectedTool', toolName);
            
        } catch (error) {
            console.error('Error selecting tool:', error);
            ToolsListService.showError(`Failed to load tool: ${toolName}`);
        } finally {
            this.showLoadingOverlay(false);
        }
    },

    // Load tool header with icon and name
    async loadToolHeader(toolName) {
        console.log(`[ToolsService] Loading header for tool: ${toolName}`);

        // Get toolState from state
        const toolState = this.getToolState(toolName);
        if (!toolState) {
            console.warn(`Tool state not found for: ${toolName}`);
            return;
        }

        const toolIcon = document.getElementById('toolIcon');
        const toolNameElement = document.getElementById('toolName');
        const toolDescription = document.getElementById('toolDescription');

        if (toolIcon && toolState.icon) {
            toolIcon.textContent = toolState.icon;
        }

        if (toolNameElement && toolState.name) {
            toolNameElement.textContent = toolState.name;
        }

        if (toolDescription && toolState.description) {
            toolDescription.textContent = toolState.description;
        }
    },

    // Load tool content (HTML/JS)
    async loadToolContent(toolName) {
        console.log(`[ToolsService] Loading content for tool: ${toolName}`);

        // Get tool content container
        const toolContent = document.getElementById('toolContent');
        if (!toolContent) {
            console.error(`Tool content container not found for tool: ${toolName}`);
            return;
        }

        // Create tool container
        const toolContainer = document.createElement('div');
        toolContainer.className = 'tool-container';

        // TODO: Need to set a destructor to notify the tool when it's removed/unloaded
        // and remove the code from the current tools
        toolContainer.dataset.toolName = toolName;
        
        // Load tool HTML and get the content type
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

    },

    // Load tool-specific content HTML. 
    // If index.html exists, load it. Otherwise, try to load panels.
    async loadToolHTML(toolName, toolContainer) {
        console.log(`[ToolsService] Loading HTML for tool: ${toolName}`);
        
        try {
            if (await this.loadToolIndexHTML(toolName, toolContainer)) {
                console.log(`[ToolsService] Loaded index.html for tool: ${toolName}`);

                // Try to load tool script (if any)
                await this.loadToolScript(toolName, toolContainer);
                return;

            } else if (await this.loadToolPanelsHTML(toolName, toolContainer)) {
                console.log(`[ToolsService] Loaded panels for tool: ${toolName}`);
                return;

            } else {

                // Fail to load index.html or panels, show error
                console.error(`[ToolsService] Failed to load both index.html and panels for tool: ${toolName}`);
                toolContainer.innerHTML = `<div class="tool-error"><h3>Failed to load tool</h3><p>Could not load index.html or panels for tool: ${toolName}</p><p>Error: ${error.message}</p></div>`;
                return; 
            }
        } catch (error) {
            // Fail to load index.html or panels, show error
            console.error(`[ToolsService] Error loading content for tool: ${toolName}`, error);
            toolContainer.innerHTML = `<div class="tool-error"><h3>Failed to load tool</h3><p>Could not load index.html or panels for tool: ${toolName}</p><p>Error: ${error.message}</p></div>`;
        }
    },

    // Load tool HTML if index.html exists
    async loadToolIndexHTML(toolName, toolContainer) {
        console.log(`[ToolsService] Attempting to load index.html for tool: ${toolName}`);
        
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

    // Try to load panels HTML for a tool that doesn't have HTML
    async loadToolPanelsHTML(toolName, toolContainer) {
        console.log(`[ToolsService] Attempting to load panels for tool: ${toolName}`);

        // FIRST: Create the DOM structure so PanelsService.initForTool can find the elements
        // const toolState = this.toolsState[toolName] || {};
        const panelElement = this.createPanelsToolHTML();
        toolContainer.appendChild(panelElement);

        // THEN: Initialize panels (DOM now exists for initializeUI)
        console.log(`[ToolsService] Calling PanelsService.initForTool for: ${toolName}`);
        await PanelsService.initForTool(toolName);

        // TODO: Need to show a nice html message if no panels were found
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

        // Create HTML for tools that use the panels system
    createPanelsToolHTML() {
        console.log('[ToolsService] Creating panels tool HTML structure');

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


    // Load tool-specific CSS
    async loadToolCSS(toolName) {
        console.log(`[ToolsService] Loading CSS for tool: ${toolName}`);

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
    async loadToolScript(toolName, toolContainer) {
        console.log(`[ToolsService] Loading script for tool: ${toolName}`);

        // Get toolState from state
        const toolState = this.getToolState(toolName);
        if (!toolState) {
            console.warn(`Tool info not found for: ${toolName}`);
            return;
        }

        // Remove existing tool scripts
        const existingScript = document.querySelector(`script[data-tool="${toolName}"]`);
        if (existingScript) {
            existingScript.remove();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/static/tools/${toolName}/script.js`;
            script.dataset.tool = toolName;
            script.onload = async () => {
                    try {
                        // Get tool info from the loaded script
                        const toolInfo = await this.getToolInfo(toolName);
                        this.toolsState.toolInfo = toolInfo;
                        toolInfo.init(toolContainer);  // <-- Pass the tool container to init
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                };
                script.onerror = () => {
                    reject(new Error(`Failed to load tool script: ${panelName}`));
                };
            
            document.head.appendChild(script);
        });
    },

    // Get tool information from loaded script
    async getToolInfo(toolName) {
        const toolObject = window['tool_script'];

        if (!toolObject) {
            throw new Error(`Tool object not found: ${toolName}`);
        }

        if (!toolObject.init || typeof toolObject.init !== 'function') {
            throw new Error(`Tool ${toolName}: 'init' property is required and must be a function`);
        }
        
        return {
            init: toolObject.init.bind(toolObject),
        };
    },

    // Show/hide loading overlay
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },

    // Auto-select last used tool
    async autoSelectLastTool() {
        console.log('[ToolsService] Attempting to auto-select last used tool');
        
        const lastTool = StorageService.getAppPreference('lastSelectedTool');
        const toolsState = this.getToolsState();
        if (lastTool && toolsState[lastTool]) {
            await this.selectTool(lastTool);
        } else {
            // No tool selected, ensure welcome screen is visible
            const welcomeScreen = document.getElementById('welcomeScreen');
            const toolContent = document.getElementById('toolContent');
            if (welcomeScreen) welcomeScreen.style.display = 'flex';
            if (toolContent) toolContent.style.display = 'none';
        }
    },

    // Tools state management methods
    setToolsState(tools) {
        this.toolsState = tools;
    },

    getToolsState() {
        return this.toolsState;
    },

    getToolState(toolName) {
        return this.toolsState[toolName] || null;
    }
};

// Make ToolsService globally available
window.ToolsService = ToolsService;