#!/usr/bin/env python3
"""
Dev Tools App - Backend Server
A modular development tools application with tool-based architecture.
"""

import os
import json
import importlib.util
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend/static')
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['DEBUG'] = os.getenv('DEBUG', 'True').lower() == 'true'

# Paths
BACKEND_DIR = Path(__file__).parent
FRONTEND_DIR = BACKEND_DIR.parent / 'frontend'
TOOLS_DIR = BACKEND_DIR / 'tools'

class ToolManager:
    """Manages tool discovery and API registration"""
    
    def __init__(self):
        self.tools = {}
        self.discover_tools()
    
    def discover_tools(self):
        """Discover all available tools and register their APIs"""
        self.tools = {}
        if not TOOLS_DIR.exists():
            return
        
        for tool_dir in TOOLS_DIR.iterdir():
            if tool_dir.is_dir() and not tool_dir.name.startswith('_'):
                try:
                    # Check if tool.py exists
                    tool_file = tool_dir / "tool.py"
                    if not tool_file.exists():
                        continue
                        
                    # Import tool module
                    spec = importlib.util.spec_from_file_location(
                        f"tools.{tool_dir.name}",
                        tool_file
                    )
                    if spec and spec.loader:
                        module = importlib.util.module_from_spec(spec)
                        spec.loader.exec_module(module)
                        
                        # Get tool info
                        if hasattr(module, 'get_tool_info'):
                            tool_info = module.get_tool_info()
                            tool_info['module'] = module
                            self.tools[tool_dir.name] = tool_info
                            
                            # Register tool APIs - try to import from api module first
                            try:
                                api_spec = importlib.util.spec_from_file_location(
                                    f"tools.{tool_dir.name}.api",
                                    tool_dir / "api.py"
                                )
                                if api_spec and api_spec.loader:
                                    api_module = importlib.util.module_from_spec(api_spec)
                                    api_spec.loader.exec_module(api_module)
                                    if hasattr(api_module, 'register_apis'):
                                        api_module.register_apis(app, f'/api/{tool_dir.name}')
                                        print(f"Registered APIs for tool: {tool_dir.name} (from api.py)")
                                    else:
                                        print(f"Warning: {tool_dir.name}/api.py has no register_apis function")
                                else:
                                    print(f"Warning: Could not load {tool_dir.name}/api.py")
                            except Exception as api_error:
                                # Fallback: try to register APIs from tool module (backward compatibility)
                                if hasattr(module, 'register_apis'):
                                    module.register_apis(app, f'/api/{tool_dir.name}')
                                    print(f"Registered APIs for tool: {tool_dir.name} (from tool.py - deprecated)")
                                else:
                                    print(f"Warning: No API registration found for tool: {tool_dir.name}")
                                    print(f"API error: {api_error}")
                except Exception as e:
                    print(f"Failed to load tool {tool_dir.name}: {e}")
    
    def get_available_tools(self):
        """Get list of available tools"""
        return {name: {k: v for k, v in tool.items() if k != 'module'} 
                for name, tool in self.tools.items()}

# Initialize tool manager
tool_manager = ToolManager()

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

@app.route('/api/tools/refresh', methods=['POST'])
def refresh_tools():
    """Refresh tool discovery"""
    try:
        tool_manager.discover_tools()
        tools = tool_manager.get_available_tools()
        return jsonify({'success': True, 'tools': tools})
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