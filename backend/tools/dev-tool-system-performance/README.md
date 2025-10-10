# Dev Tool System Info

A system monitoring and welcome dashboard tool that displays a professional welcome message along with real-time server system information.

## Overview

Dev Tool System Info provides a comprehensive overview of your dev-tools server status, including:

- **Welcome Message**: Professional greeting explaining the dev-tools platform
- **Real-time System Monitoring**: Live CPU, memory, and disk usage statistics
- **System Information**: Platform details, hostname, and Python version
- **Auto-refresh**: Automatically updates every 3 seconds
- **Professional Dashboard**: Beautiful UI with color-coded statistics cards
- **Global Header**: Uses the application's global header system (no tool-specific header needed)

## Features

### \ud83d\udcbb System Info Dashboard
- Professional welcome message
- Server timestamp and status
- Clean, responsive design

### \ud83d\udcca System Monitoring
- **CPU Usage**: Real-time percentage and core count
- **Memory Usage**: Used/total memory in GB and percentage
- **Disk Usage**: Used/total disk space in GB and percentage

### \ud83d\udda5\ufe0f System Information
- Operating system and release
- System architecture
- Hostname
- Python version

### \ud83d\udd04 Auto-refresh
- Updates statistics every 3 seconds
- Manual refresh with F5 or Ctrl+R
- Automatic cleanup on page unload

## Architecture

### Backend Structure
```
backend/tools/dev-tool-system-performance/
├── tool.py              # Core business logic
├── api.py               # HTTP API endpoints
└── README.md            # This file
```

### Frontend Structure
```
frontend/static/tools/dev-tool-system-performance/
├── index.html           # UI template with dashboard
├── script.js            # JavaScript functionality
└── style.css            # Tool-specific styles
```

## Dependencies

This tool requires the following Python packages (in addition to the main application dependencies):

- `psutil>=5.9.6` - For system monitoring and resource usage statistics

See `requirements.txt` in this directory for the complete list of tool-specific dependencies.

## API Endpoints

### GET /api/dev-tool-system-performance/info
Returns welcome message and current system statistics.

## Development Notes

### Tool Layout Best Practices

#### Flexbox Layout for All Containers
Every container in a tool should use proper flexbox properties for consistent layout and scrolling behavior:

```css
/* Main tool container */
.tool-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 100vh;
}

/* Content containers */
.content-section {
    display: flex;
    flex-direction: column;
    flex: 1;  /* Takes remaining space */
}

/* Fixed header/footer sections */
.fixed-header {
    flex-shrink: 0;  /* Prevents shrinking */
}

/* Scrollable content areas */
.scrollable-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}
```

**Why use flexbox everywhere?**
- **Consistent scrolling**: Only designated areas scroll, headers stay fixed
- **Responsive design**: Automatic adjustment to different screen sizes
- **Maintainable code**: Predictable layout behavior
- **Performance**: Better rendering with proper flex properties

### Tool Scrolling
For tools that may have content taller than the viewport, always add these CSS properties to the main tool container:

```css
.tool-container {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    max-height: 100vh;
}
```

This ensures:
- Content can scroll vertically when it exceeds the viewport height
- The tool remains usable on smaller screens
- Consistent behavior across all tools in the Dev Tools application
