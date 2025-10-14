# Panels Example Tool

A demonstration of the panel-based tool architecture with secondary toolbar and expand/collapse functionality.

## Overview

This tool showcases the new panels system that allows tools to be built using multiple collapsible/expandable panels instead of a single HTML page. When a tool doesn't have an `index.html` file, the system automatically uses the panels architecture.

## Architecture

### Directory Structure
```
frontend/static/tools/panels-example/
├── panels/
│   ├── panel-1.js    # Basic information panel
│   ├── panel-2.js    # Interactive controls panel
│   └── panel-3.js    # Special Agents panel
└── style.css         # Panel-specific styles

backend/tools/panels-example/
├── tool.py           # Tool metadata and backend logic
├── api.py            # API endpoints (optional)
├── requirements.txt  # Dependencies (optional)
└── README.md         # Documentation
```

### Panel Structure

Each panel is defined as a JavaScript object with the following structure:

```javascript
const panel_name = {
    name: 'Panel Display Name',
    icon: '🔧',
    description: 'Panel description',
    isSpecial: false, // true for special panels like Agents

    // Render the panel content (required)
    render() {
        return `<div>Panel HTML content</div>`;
    },

    // Initialize the panel (optional)
    init(container) {
        // Setup event listeners, initialize state, etc.
    },

    // Custom methods (optional)
    customMethod() {
        // Panel-specific functionality
    }
};
```

### Global Object Registration

**Important**: Each panel script must define a global object with the same name as the panel file (with hyphens converted to underscores). For example:

- `panel-1.js` must define `window.panel_1 = { ... }`
- `panel-2.js` must define `window.panel_2 = { ... }`
- `my-special-panel.js` must define `window.my_special_panel = { ... }`

This global object registration is required for the panel system to discover and load panels dynamically. The system expects to find a global object matching the panel filename pattern.

### Required Panel Properties

All panel objects must include the following required properties:

- **`name`** (string): Display name for the panel
- **`icon`** (string): Emoji or icon for the panel
- **`description`** (string): Panel description text
- **`render`** (function): Function that returns HTML string for panel content
- **`init`** (function): Initialization function called after rendering
- **`collapseModeButtons`** (array): Buttons shown when panel is collapsed in toolbar
- **`expandModeButtons`** (array): Buttons shown when panel is expanded in header

## Panels Included

### Panel 1: System Information 📊
- Displays basic system stats
- Refresh functionality
- Details view

### Panel 2: Control Center 🎛️
- Interactive volume control
- Theme selection
- Process simulation with progress bar
- Start/Stop/Pause controls

### Panel 3: AI Agents 🤖 (Special Panel)
- Agent status overview
- Individual agent controls
- Real-time activity feed
- Special styling and behavior

## Secondary Toolbar

The secondary toolbar appears at the top of panel-based tools and shows:

- **Collapsed Panels**: Small buttons with icon and name
- **Expanded Panel**: Highlighted button showing the active panel
- **Special Panels**: Distinctive styling for panels like "Agents"

### Behavior
- Click a collapsed panel to expand that panel
- Click an expanded panel to collapse it
- Only one panel can be expanded at a time
- Special panels have priority and unique styling

## CSS Classes

### Main Containers
- `.panels-tool-container` - Main tool wrapper
- `.panels-secondary-toolbar` - Top toolbar with collapsed panels
- `.panels-content-area` - Content area for expanded panels

### Collapsed Panels
- `.collapsed-panel` - Individual collapsed panel button
- `.collapsed-panel.collapsed` - Collapsed state
- `.collapsed-panel.expanded` - Expanded state
- `.collapsed-panel.special-panel` - Special panel styling

### Panel Content
- `.panel-content` - Individual panel content wrapper
- `.panel-placeholder` - Default content when panel has no custom render

## Usage

1. Select "Panels Example" from the tools drawer
2. Use the secondary toolbar to switch between panels
3. Each panel demonstrates different functionality:
   - Panel 1: Static information with interactive buttons
   - Panel 2: Dynamic controls and state management
   - Panel 3: Complex UI with real-time updates

## Development Notes

### Creating New Panel-Based Tools

1. **Create Tool Directory Structure**:
   ```
   frontend/static/tools/your-tool/
   └── panels/
       ├── panel-1.js
       ├── panel-2.js
       └── style.css

   backend/tools/your-tool/
   ├── tool.py
   └── README.md
   ```

2. **Add to Panel-Based Tools List**:
   Update `tool-loader.js` to include your tool name in the `panelBasedTools` array.

3. **Implement Panel Objects**:
   Each `panel-{name}.js` should export a panel object with `render()` and optional `init()` methods.

4. **Style Your Panels**:
   Use the provided CSS classes and add custom styles in `style.css`.

### Panel Service API

The `PanelService` provides methods for managing panels:

- `PanelService.init(toolName)` - Initialize panels for a tool
- `PanelService.togglePanel(toolName, panelName)` - Toggle panel expansion
- `PanelService.expandPanel(toolName, panelName)` - Expand a specific panel
- `PanelService.collapsePanel(toolName)` - Collapse the current panel

## Benefits

- **Modular**: Each panel is self-contained
- **Scalable**: Easy to add/remove panels
- **Interactive**: Rich UI with expand/collapse functionality
- **Consistent**: Standardized toolbar and behavior
- **Flexible**: Support for special panels with custom behavior
