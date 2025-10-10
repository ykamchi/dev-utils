[//]: # (This is a markdown file)
<!-- markdownlint-disable -->
<!-- vim: set ft=markdown: -->
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
│   ├── requirements.txt       # Core Python dependencies (Flask, CORS, dotenv)
│   └── tools/                 # Backend tool implementations
│       └── dev-tool-system-performance/           # Example dev-tool-system-performance tool
│           ├── tool.py        # Tool business logic
│           ├── api.py         # API endpoints
│           └── requirements.txt # Tool-specific dependencies (optional)
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

### � Dev Tool System Performance
The Dev Tool System Performance provides a comprehensive dashboard showing:
- **Real-time System Monitoring**: Live CPU, memory, and disk usage statistics
- **System Information**: Platform details, hostname, and Python version
- **Auto-refresh**: Automatically updates every 3 seconds

**API**: `GET /api/dev-tool-system-performance/info`, `GET /api/dev-tool-system-performance/memory-usage`  
**Features**: System monitoring, server stats, responsive dashboard  
**Dependencies**: `psutil` for system monitoring

See [Dev Tool System Performance README](backend/tools/dev-tool-system-performance/README.md) for detailed documentation.

### 👋 Dev Tool Welcome
A simple welcome message tool that displays a friendly greeting.

**API**: `GET /api/dev-tool-welcome/message`  
**Features**: Welcome message, server timestamp  
**Dependencies**: None

See [Dev Tool Welcome README](backend/tools/dev-tool-welcome/README.md) for detailed documentation.

### 🌤️ Dev Tool Weather
A beautiful weather display tool with current conditions and forecasts.

**API**: `GET /api/dev-tool-weather/current`, `GET /api/dev-tool-weather/forecast`  
**Features**: Current weather, 5-day forecast, city selection  
**Dependencies**: OpenWeatherMap API (optional)

See [Dev Tool Weather README](backend/tools/dev-tool-weather/README.md) for detailed documentation.

### 📈 Dev Tool Stocks
A stock market data tool showing real-time quotes and popular stocks.

**API**: `GET /api/dev-tool-stocks/quote`, `GET /api/dev-tool-stocks/popular`  
**Features**: Stock quotes, market data, auto-refresh  
**Dependencies**: Alpha Vantage API (optional)

See [Dev Tool Stocks README](backend/tools/dev-tool-stocks/README.md) for detailed documentation.

## Tool Architecture

The dev-tools app uses a modular architecture where each tool is a separate package with distinct responsibilities:

### Tool Structure

```
backend/tools/[tool-name]/
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

## Global Header System

The application uses a unified header system that automatically displays tool information:

- **Automatic Population**: Tool icon and name are pulled from `tool.py` metadata
- **Consistent Design**: All tools share the same header styling and behavior
- **Theme Integration**: Headers automatically adapt to the selected theme
- **No Tool Headers**: Individual tools should not include their own header elements

The global header eliminates duplication and ensures a consistent user experience across all tools.

## Creating New Tools

To add a new tool to the application:

### 1. Backend Tool Implementation

Create a new directory in `backend/tools/` with your tool name:

```bash
mkdir backend/tools/my-awesome-tool
```

Create the following files:

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
from .tool import get_my_data

def register_apis(app, base_path):
    """Register my-awesome-tool API endpoints"""

    @app.route(f'{base_path}/data', methods=['GET'])
    def get_data():
        """Get data from the tool"""
        try:
            data = get_my_data()
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

#### `backend/tools/my-awesome-tool/requirements.txt` (optional):
```txt
# My Awesome Tool - Requirements
# Add any tool-specific Python dependencies here
# These will be in addition to the main backend/requirements.txt

requests>=2.31.0
some-other-package>=1.0.0
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

.my-awesome-tool .tool-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
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
2. **Monochrome Elegance**
3. **Traditional Mahogany**
4. **Regal Dark Mode**
5. **Soft Sage & Stone**
6. **French Provincial**
7. **Dark Modern**
8. **Light Modern**
9. **GitHub Dark**
10. **Solarized Dark**
11. **Dracula**
12. **One Dark Pro**

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
- `--color-background-main`: Main page background color
- `--color-primary-accent`: Main brand color (default: #192A56)
- `--color-primary-accent-hover`: Hover state for primary color
- `--color-secondary-accent`: Secondary color (default: #4A6C7E)
- `--color-highlight-gold`: Accent/highlight color (default: #A89053)
- `--color-text-dark`: Dark text color (default: #2C3E50)
- `--color-text-light`: Light/muted text color (default: #FBFBF2)
- `--color-card-background`: Card background color
- `--color-warning-error`: Warning/error color (default: #A65B43)
- `--color-info-background`: Info background with transparency
- `--color-overlay-white`: Subtle white overlay (rgba(255, 255, 255, 0.1))
- `--color-overlay-border`: Subtle border overlay (rgba(255, 255, 255, 0.1))
- `--color-positive-bg-light`: Light positive/success background
- `--color-positive-bg-strong`: Strong positive/success background
- `--color-negative-bg-light`: Light negative/error background
- `--color-negative-bg-strong`: Strong negative/error background
- `--shadow-card-light`: Light card shadow (0 2px 8px rgba(0, 0, 0, 0.1))
- `--shadow-card-hover`: Hover card shadow (0 4px 16px rgba(0, 0, 0, 0.15))
- `--shadow-card-main`: Main card shadow (0 8px 32px rgba(...))

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
- Use `var(--color-primary-accent-hover)` for hover states of primary elements
- Use `var(--color-secondary-accent)` for secondary elements and borders
- Use `var(--color-highlight-gold)` for highlights, success states, and important data
- Use `var(--color-text-dark)` for primary text and headings
- Use `var(--color-text-light)` for muted text, secondary content, and light backgrounds
- Use `var(--color-card-background)` for card/container backgrounds
- Use `var(--color-background-main)` for main page backgrounds
- Use `var(--color-warning-error)` for error states, warnings, and negative indicators
- Use `var(--color-info-background)` for informational backgrounds and subtle gradients
- Use `var(--color-positive-bg-light)` and `var(--color-positive-bg-strong)` for positive/success backgrounds
- Use `var(--color-negative-bg-light)` and `var(--color-negative-bg-strong)` for negative/error backgrounds
- Use `var(--color-overlay-white)` and `var(--color-overlay-border)` for subtle overlays
- Use `var(--shadow-card-light)`, `var(--shadow-card-hover)`, and `var(--shadow-card-main)` for card shadows

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
- **Do not include tool-header elements** - the application provides a global header system automatically

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your tool following the established patterns
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.