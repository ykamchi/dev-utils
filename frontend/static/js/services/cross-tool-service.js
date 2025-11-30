// Cross Tool Service - Handles cross-tool panel integration and resource loading
// Provides functionality to open panels from other tools in popups with proper resource management

class CrossToolService {
    // Open a panel from another tool in a popup
    static async openPanel(toolName, panelName, popupOptions = {}) {
        console.log(`[CrossToolService] Opening panel ${panelName} from tool ${toolName} in popup...`);

        let loadedStyles = null;
        let popupStyles = null;

        try {
            // Load the panel script and CSS dynamically
            await this.loadPanelScript(toolName, panelName);
            loadedStyles = await this.loadPanelStyles(toolName);

            // Get the panel object
            const panelObjectName = panelName.replace(/-/g, '_');
            const panel = window[panelObjectName];
            if (!panel) {
                throw new Error(`Panel object not found: ${panelObjectName}`);
            }

            // Create a container for the panel content
            const panelContainer = document.createElement('div');
            panelContainer.className = 'popup-panel-container';

            // Add minimal popup-specific styles for better display
            popupStyles = document.createElement('style');
            popupStyles.textContent = `
                .popup-panel-container {
                    /* Ensure panels fit well in popup containers */
                    max-width: 100%;
                    overflow-x: auto;
                }
            `;
            document.head.appendChild(popupStyles);

            // Render the panel content
            const panelContent = panel.render();
            if (typeof panelContent === 'string') {
                panelContainer.innerHTML = panelContent;
            } else {
                panelContainer.innerHTML = '<p>Error: Panel render failed</p>';
            }

            // Create popup with default options merged with provided options
            const defaultOptions = {
                icon: panel.icon,
                title: panel.name,
                content: panelContainer,
                closable: true,
                overlay: true,
                closeOnOutsideClick: true,
                width: 400,
                height: 'auto'
            };

            const finalOptions = { ...defaultOptions, ...popupOptions };
            const popup = new PopupComponent(finalOptions);

            popup.show();

            // Initialize the panel in the popup context
            if (panel.init) {
                try {
                    // Create a mock header status container
                    const mockHeaderStatus = document.createElement('div');
                    mockHeaderStatus.className = 'mock-header-status';
                    panelContainer.appendChild(mockHeaderStatus);

                    await panel.init(panelContainer, mockHeaderStatus);
                } catch (error) {
                    console.error(`Error initializing panel ${panelName}:`, error);
                }
            }

            // Handle popup close to cleanup panel and styles
            popup.onClose = () => {
                if (panel.destroy) {
                    try {
                        panel.destroy(panelContainer);
                    } catch (error) {
                        console.error(`Error destroying panel ${panelName}:`, error);
                    }
                }
                // Remove dynamically loaded styles
                if (loadedStyles) {
                    this.removePanelStyles(toolName);
                }
                // Remove popup-specific styles
                if (popupStyles && popupStyles.parentNode) {
                    popupStyles.parentNode.removeChild(popupStyles);
                }
            };

            return popup;

        } catch (error) {
            console.error(`Error opening panel ${panelName} from tool ${toolName}:`, error);

            // Cleanup on error
            if (loadedStyles) {
                this.removePanelStyles(toolName);
            }
            if (popupStyles && popupStyles.parentNode) {
                popupStyles.parentNode.removeChild(popupStyles);
            }

            throw error;
        }
    }

    // Helper method to load panel script from another tool
    static async loadPanelScript(toolName, panelName) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const panelObjectName = panelName.replace(/-/g, '_');
            if (window[panelObjectName]) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `/static/tools/${toolName}/panels/${panelName}.js`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load panel: ${panelName}`));
            document.head.appendChild(script);
        });
    }

    // Helper method to load panel styles from another tool
    static async loadPanelStyles(toolName) {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const styleId = `dynamic-style-${toolName}`;
            if (document.getElementById(styleId)) {
                resolve(true); // Already loaded
                return;
            }

            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = `/static/tools/${toolName}/style.css`;
            link.onload = () => resolve(true);
            link.onerror = () => reject(new Error(`Failed to load styles for: ${toolName}`));
            document.head.appendChild(link);
        });
    }

    // Helper method to remove dynamically loaded panel styles
    static removePanelStyles(toolName) {
        const styleId = `dynamic-style-${toolName}`;
        const linkElement = document.getElementById(styleId);
        if (linkElement) {
            linkElement.remove();
        }
    }
}

// Export for use in other modules
window.CrossToolService = CrossToolService;