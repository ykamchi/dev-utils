// Main Application JavaScript
// Initialize all modules and handle app-level functionality

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dev Tools App - Initializing...');
    
    try {
        // Initialize theme manager first
        ThemeService.init();
        console.log('Theme Service initialized');
        
        // Initialize drawer service
        DrawerService.init();
        console.log('Drawer Service initialized');
        
        // Initialize tools list service
        await ToolsListService.init();
        console.log('Tools List Service initialized');
        
        // Initialize tool loader
        await ToolsService.init();
        console.log('Tools Service initialized');
        
        // Auto-select last used tool after a short delay
        setTimeout(() => {
            ToolsService.autoSelectLastTool();
        }, 500);
        
        console.log('Dev Tools App - Initialization complete');
        
    } catch (error) {
        console.error('Failed to initialize Dev Tools App:', error);
    }
});