# Dev Tool Welcome

A simple welcome message tool that displays a hardcoded welcome message from the server.

## Overview

Dev Tool Welcome provides a friendly welcome message to users of the Dev Tools Application.

## Features

- **Welcome Message**: Displays a hardcoded welcome message
- **Simple Interface**: Clean and minimal design
- **Server Timestamp**: Shows when the message was generated
- **Global Header**: Uses the application's global header system (no tool-specific header needed)

## API Endpoints

### GET /api/dev-tool-welcome/message
Returns a hardcoded welcome message.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Welcome to the Dev Tools Application! 🎉",
    "subtitle": "Your comprehensive development utilities platform is ready to assist you.",
    "timestamp": "2025-10-10"
  }
}
```

## Dependencies

This tool has no external Python dependencies and uses only the standard library. It relies on the main application dependencies for Flask and other core functionality.

See `requirements.txt` in this directory for reference (contains only a comment about standard library usage).

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
