#!/usr/bin/env python3
"""
Dev Tools App - Backend Server
A modular development tools application with tool-based architecture.
"""

import os
from pathlib import Path
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from tool_manager import ToolManager

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app)

# Configuration
app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'

# Paths
BACKEND_DIR = Path(__file__).parent
FRONTEND_DIR = BACKEND_DIR.parent / 'frontend'
TOOLS_DIR = BACKEND_DIR / 'tools'

# Initialize tool manager
tool_manager = ToolManager(TOOLS_DIR, app)

@app.route('/')
def index():
    """Serve the main application"""
    return render_template('index.html')

@app.route('/api/tools')
def get_tools():
    """Get available tools"""
    try:
        tools = tool_manager.get_available_tools()
        return jsonify({'success': True, 'tools': tools})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tools/<tool_name>/panels')
def get_tool_panels(tool_name):
    """Get available panels for a specific tool"""
    try:
        from pathlib import Path
        panels_dir = FRONTEND_DIR / 'static' / 'tools' / tool_name / 'panels'
        
        if not panels_dir.exists():
            return jsonify({'success': True, 'panels': []})
        
        panels = []
        for panel_file in panels_dir.glob('*.js'):
            if panel_file.is_file():
                # Extract panel name from filename (remove .js extension)
                panel_name = panel_file.stem
                panels.append(panel_name)
        
        return jsonify({'success': True, 'panels': panels})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tools/imports')
def get_tools_imports():
    """Return a mapping of tool_name -> list of JS script paths to import for all tools"""
    try:
        tools = tool_manager.get_available_tools()
        imports_map = {}
        for tool_name, info in tools.items():
            imports = info.get('imports', [])
            resolved_imports = []
            for path in imports:
                # If it's a URL, just add it
                if path.startswith('http://') or path.startswith('https://'):
                    resolved_imports.append(path)
                # If it contains a wildcard, expand it
                elif '*' in path:
                    # Get the directory and pattern
                    static_dir = FRONTEND_DIR / 'static' / 'tools' / tool_name
                    pattern_path = path
                    # Use glob to expand the pattern
                    for match in static_dir.glob(pattern_path):
                        if match.is_file() and match.suffix == '.js':
                            # Add as static path
                            rel_path = match.relative_to(FRONTEND_DIR)
                            resolved_imports.append(f"/{rel_path.as_posix()}")
                else:
                    # Normal static file
                    resolved_imports.append(f"/static/tools/{tool_name}/{path}")
            imports_map[tool_name] = resolved_imports
        return jsonify({'success': True, 'imports': imports_map})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'tools_count': len(tool_manager.tools)})

if __name__ == '__main__':
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    print(f"Starting Dev Tools App on {host}:{port}")
    print(f"Frontend directory: {FRONTEND_DIR}")
    print(f"Tools directory: {TOOLS_DIR}")
    print(f"Available tools: {list(tool_manager.tools.keys())}")
    
    app.run(host=host, port=port, debug=debug)