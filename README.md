[//]: # (This is a markdown file)
---
title: Dev Tools App
description: A modular development tools application
---

# Dev Tools App

A modular development tools application with a beautiful theming system and extensible tool architecture.

## Features

- **Modular Tool System**: Add new tools by creating directories in both backend and frontend
- **Beautiful Theming**: 11 different themes identical to bedrock-utils theming system
- **Browser Storage Service**: Persistent storage for tool states and user preferences
- **Responsive Drawer**: Left-side tool navigation with search and categorization
- **Separate Backend/Frontend**: Clean separation of concerns with Flask backend and pure HTML/CSS/JS frontend

## Project Structure

```
dev_utils/
├── backend/                    # Python Flask backend
│   ├── main.py                # Main server application
│   ├── requirements.txt       # Python dependencies
│   └── tools/                 # Backend tool implementations
│       └── dev-tool-system-performance/           # Example dev-tool-system-performance tool
│           ├── __init__.py    # Package initialization
│           ├── tool.py        # Tool business logic
│           └── api.py         # API endpoints
├── frontend/                  # Pure HTML/CSS/JS frontend
│   ├── index.html            # Main application template
│   └── static/               # Static assets
│       ├── css/              # Stylesheets
│       │   └── main.css      # Main styles with theming
│       ├── js/               # JavaScript modules
│       │   ├── main.js       # Main app initialization
│       │   └── modules/      # Modular JS components
│       │       ├── utils/    # Utility modules
│       │       ├── ui/       # UI modules (theme manager)
│       │       └── tools/    # Tool loading system
│       └── tools/            # Frontend tool implementations
│           └── dev-tool-system-performance/      # Example dev-tool-system-performance tool frontend
│               ├── index.html # Tool HTML template
│               ├── script.js  # Tool JavaScript
│               └── style.css  # Tool-specific CSS
├── .env                      # Environment configuration
├── .vscode/                  # VS Code launch configuration
│   └── launch.json          # Debug/launch settings
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Modern web browser
- VS Code (recommended for development)

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /home/yohay/code/dev_utils
   ```

2. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure environment** (optional):
   Edit `.env` file to customize settings like port, host, etc.

### Running the Application

#### Option 1: VS Code Launch (Recommended)
1. Open the project in VS Code
2. Press `F5` or go to Run & Debug
3. Select "Launch Dev Tools App"
4. The app will start and open at http://127.0.0.1:5000

#### Option 2: Command Line
```bash
cd backend
python main.py
```

#### Option 3: Using Python Module
```bash
python -m backend.main
```

The application will be available at: http://127.0.0.1:5000

## Included Tools

### 💻 Dev Tool System Info
The Dev Tool System Info provides a comprehensive dashboard showing:
- **Static Welcome Message**: Professional greeting explaining the dev-tools platform
- **Real-time System Monitoring**: Live CPU, memory, and disk usage statistics
- **System Information**: Platform details, hostname, and Python version
- **Auto-refresh**: Automatically updates every 30 seconds

**API**: `GET /api/dev-tool-system-performance/info`  
**Features**: System monitoring, server stats, responsive dashboard  
**Dependencies**: `psutil` for system monitoring

See [Dev Tool System Info README](backend/tools/dev-tool-system-performance/README.md) for detailed documentation.

## Tool Architecture

The dev-tools app uses a modular architecture where each tool is a separate package with distinct responsibilities:

### Tool Structure

```
backend/tools/[tool-name]/
├── __init__.py          # Package exports
├── tool.py              # Business logic and metadata
└── api.py               # HTTP API endpoints

frontend/static/tools/[tool-name]/
├── index.html           # Tool UI template
├── script.js            # Tool JavaScript logic
└── style.css            # Tool-specific styles
```

### Benefits

- **Separation of Concerns**: Backend and frontend are completely separate
- **Modular Design**: Each tool is self-contained and independently deployable
- **Easy Testing**: Tools can be developed and tested in isolation
- **Better code organization**
- **Simplified API endpoint management**

### Tool Discovery

The backend automatically discovers tools by:
1. Scanning the `backend/tools/` directory
2. Loading each tool package that contains valid `tool.py` and `api.py` files
3. Registering APIs from the `api.py` file
4. Making tool information available through `/api/tools`

Tools are identified by their directory name (e.g., `dev-tool-system-performance`, `my-awesome-tool`).

## Creating New Tools

To add a new tool to the application:

### 1. Backend Tool Implementation

Create a new directory in `backend/tools/` with your tool name:

```bash
mkdir backend/tools/my-awesome-tool
```

Create the following files:

#### `backend/tools/my-awesome-tool/__init__.py`:
```python
"""
My Awesome Tool Package
"""

from .tool import get_tool_info, get_my_data
from .api import register_apis

__all__ = [
    'get_tool_info',
    'register_apis',
    'get_my_data'
]
```

#### `backend/tools/my-awesome-tool/tool.py`:
```python
"""
My Awesome Tool - Core Logic
"""

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'My Awesome Tool',
        'description': 'Description of what this tool does',
        'category': 'utility',
        'icon': '🚀',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/my-awesome-tool/data'
        ]
    }

def get_my_data():
    """Tool business logic"""
    return {
        'message': 'Hello from My Awesome Tool!',
        'timestamp': 'current_time_here'
    }
```

#### `backend/tools/my-awesome-tool/api.py`:
```python
"""
My Awesome Tool - API Endpoints
"""

from flask import jsonify
from . import tool

def register_apis(app, base_path):
    """Register my-awesome-tool API endpoints"""

    @app.route(f'{base_path}/data', methods=['GET'])
    def get_data():
        """Get data from the tool"""
        try:
            data = tool.get_my_data()
            return jsonify({
                'success': True,
                'data': data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
```

### 2. Frontend Tool Implementation

Create the frontend directory:

```bash
mkdir -p frontend/static/tools/my-awesome-tool
```

#### `frontend/static/tools/my-awesome-tool/index.html`:
```html
<link rel="stylesheet" href="style.css">

<div class="my-awesome-tool">
    <div class="tool-header">
        <h2>🚀 My Awesome Tool</h2>
        <p>Description of the tool</p>
    </div>

    <div class="tool-body">
        <button onclick="loadData()">Load Data</button>
        <div id="content"></div>
    </div>
</div>
```

#### `frontend/static/tools/my-awesome-tool/script.js`:
```javascript
async function loadData() {
    try {
        const response = await fetch('/api/my-awesome-tool/data');
        const result = await response.json();

        if (result.success) {
            document.getElementById('content').textContent =
                JSON.stringify(result.data, null, 2);
        } else {
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Auto-load on page load
window.addEventListener('DOMContentLoaded', () => {
    loadData();
});
```

#### `frontend/static/tools/my-awesome-tool/style.css`:
```css
.my-awesome-tool {
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
}

.my-awesome-tool .tool-header {
    text-align: center;
    margin-bottom: 30px;
}

.my-awesome-tool .tool-header h2 {
    color: var(--color-primary-accent);
    font-size: 2em;
}

.my-awesome-tool button {
    background: var(--color-primary-accent);
    color: var(--color-text-light);
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    margin-bottom: 20px;
}

.my-awesome-tool #content {
    background: var(--color-card-background);
    padding: 20px;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: monospace;
}
```

### 3. Restart the Server

After creating the tool files, restart the development server. The new tool will be automatically discovered and available in the application.

## API Reference

### GET /api/tools
Returns information about all available tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "Dev Tool System Info",
      "description": "Show welcome message with server system information",
      "category": "system",
      "icon": "💻",
      "version": "1.0.0",
      "endpoints": ["GET /api/dev-tool-system-performance/info"]
    }
  ]
}
```

### Tool-specific Endpoints

Each tool exposes its own API endpoints as defined in the tool's `tool.py` metadata.

## Theming System

The application supports 11 different themes that can be switched dynamically:

1. **Executive Blue/Gold** (Default)
2. **Monochromatic Elegance**
3. **Traditional Mahogany**
4. **Regal Dark Mode**
5. **Soft Sage & Stone**
6. **French Provincial**
7. **Dark Modern**

Themes are defined in `frontend/static/css/main.css` using CSS custom properties (variables).

## Development

### Adding New Themes

To add a new theme:

1. Add a new CSS class in `main.css` (e.g., `.theme-new-theme`)
2. Define the color variables within that class
3. Update the theme manager in the UI

### Tool Development Best Practices

#### 🎨 **Theme Color Usage**
Always use CSS custom properties (theme variables) instead of hardcoded colors to ensure consistency and theme compatibility:

**Available Theme Variables:**
- `--color-primary-accent`: Main brand color (default: #192A56)
- `--color-primary-accent-hover`: Hover state for primary color
- `--color-secondary-accent`: Secondary color (default: #4A6C7E)
- `--color-highlight-gold`: Accent/highlight color (default: #A89053)
- `--color-text-dark`: Dark text color (default: #2C3E50)
- `--color-text-light`: Light/muted text color (default: #FBFBF2)
- `--color-card-background`: Card background color
- `--color-warning-error`: Warning/error color
- `--color-info-background`: Info background with transparency

**❌ Avoid Hardcoded Colors:**
```css
/* Don't do this */
.my-button {
    background: #007acc;  /* Hardcoded color */
    color: #333;          /* Hardcoded color */
}

/* Do this instead */
.my-button {
    background: var(--color-primary-accent);
    color: var(--color-text-dark);
}
```

**✅ Theme-Aware Components:**
- Use `var(--color-primary-accent)` for primary buttons and links
- Use `var(--color-secondary-accent)` for secondary elements
- Use `var(--color-highlight-gold)` for highlights and important data
- Use `var(--color-text-dark)` and `var(--color-text-light)` for text hierarchy
- Use `var(--color-card-background)` for card/container backgrounds

#### 🏗️ **General Best Practices**
- Keep tools self-contained and modular
- Use the established file structure
- Include comprehensive error handling
- Document API endpoints clearly
- Test tools independently before integration
- Follow responsive design principles
- Use semantic HTML and accessible markup
- Implement proper loading states and error handling
- Clean up event listeners and polling intervals when tools are unloaded

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tool following the established patterns
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.