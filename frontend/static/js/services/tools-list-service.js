// Tools List Service Module
// Handles loading, rendering, and managing the tools list in the drawer

const ToolsListService = {
    // Initialize tools list service
    async init() {
        console.log('[Tools List Service] Initializing...');

        this.bindEvents();
        await this.loadAndRenderTools();
    },

    // Load tools and render the list
    async loadAndRenderTools() {
        console.log('[Tools List Service] Loading and rendering tools into the drawer...');

        this.showLoading(true);
        const success = await ToolsService.loadTools();
        this.showLoading(false);
        
        if (success) {
            this.renderToolsList();
        } else {
            this.showError('Failed to load tools');
        }
    },

    // Bind event listeners for tools list
    bindEvents() {
        const refreshBtn = document.getElementById('refreshToolsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTools());
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

            const success = await ToolsService.loadTools();
            if (success) {
                this.renderToolsList();
            } else {
                this.showError('Failed to refresh tools');
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

        const toolNames = Object.keys(ToolsService.getToolsState());

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

        const toolInfo = ToolsService.getToolState(toolName);
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
            ToolsService.selectTool(toolName);
        });

        return toolItem;
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

    // Show/hide loading state in tools list
    showLoading(show) {
        const toolsList = document.getElementById('toolsList');
        if (!toolsList) return;

        if (show) {
            toolsList.innerHTML = '<div class="loading-tools">Loading tools...</div>';
        }
    },

    // Show error message
    showError(message) {
        console.error('Tools List Service Error:', message);
        // You could implement a toast notification or error display here
        alert('Error: ' + message);
    }
};

// Make ToolsListService globally available
window.ToolsListService = ToolsListService;