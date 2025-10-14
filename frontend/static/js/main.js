// Main Application JavaScript
// Initialize all modules and handle app-level functionality

document.addEventListener('DOMContentLoaded', async function() {
    console.log('[main] Dev Tools App - Initializing...');
    
    try {
        // Initialize theme manager first
        ThemeService.init();
        console.log('[main] Theme Service init finished');
        
        // Initialize drawer service
        DrawerService.init();
        console.log('[main] Drawer Service init finished');

        // Initialize tools list service
        await ToolsListService.init();
        console.log('[main] Tools List Service init called');

        // Initialize tool loader
        await ToolsService.init();
        console.log('[main] Tools Service init called');

        // Auto-select last used tool after a short delay
        setTimeout(() => {
            ToolsService.autoSelectLastTool();
        }, 500);

        console.log('[main] Dev Tools App - Initialization complete');

    } catch (error) {
        console.error('[main] Failed to initialize Dev Tools App:', error);
    }
});