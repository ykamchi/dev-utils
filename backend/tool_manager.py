#!/usr/bin/env python3
"""
Tool Manager Module
Handles tool discovery and API registration for the Dev Tools App.
"""

import importlib.util
from pathlib import Path
from flask import Flask
from dotenv import load_dotenv


class ToolManager:
    """Manages tool discovery and API registration"""

    def __init__(self, tools_dir: Path, app: Flask):
        self.tools = {}
        self.tools_dir = tools_dir
        self.app = app
        self.discover_tools()

    def discover_tools(self):
        """Discover all available tools and register their APIs"""
        self.tools = {}
        if not self.tools_dir.exists():
            print(f"Error: Tools directory does not exist: {self.tools_dir}")
            return

        for tool_dir in self.tools_dir.iterdir():
            # Skip files and directories starting with '_' (not valid tool directories)
            if not (tool_dir.is_dir() and not tool_dir.name.startswith('_')):
                print(f"Skipping {tool_dir.name} (not a valid tool directory)")
                continue

            try:
                # Validate tool structure
                if not self.validate_tool(tool_dir):
                    continue

                # Import tool module
                spec = importlib.util.spec_from_file_location(
                    f"tools.{tool_dir.name}",
                    tool_dir / "tool.py"
                )

                # Load and validate the module
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)

                    if module is None:
                        print(f"Error: module is None for tool {tool_dir.name}")
                        continue

                    # Check if tool has required get_tool_info function
                    if not hasattr(module, 'get_tool_info'):
                        print(f"Warning: Tool {tool_dir.name} missing get_tool_info function, skipping")
                        continue

                    # Get tool info
                    tool_info = module.get_tool_info()

                    # Only register tools with valid tool_info
                    if tool_info is not None and self.validate_tool_info(tool_info):
                        self.tools[tool_dir.name] = tool_info

                        # Register the tool's API endpoints
                        self.register_tool_api(tool_dir, module)
                    else:
                        print(f"Warning: Invalid or missing tool_info for tool {tool_dir.name}")

            except Exception as e:
                print(f"Failed to load tool {tool_dir.name}: {e}")

    def _monkeypatch_route(self, tool_name):
        orig_route = self.app.route
        def custom_route(rule, **options):
            def decorator(f):
                endpoint = f"{tool_name}.{f.__name__}"
                return orig_route(rule, endpoint=endpoint, **options)(f)
            return decorator
        return custom_route

    def register_tool_api(self, tool_dir: Path, module):
        """Register tool APIs - try to import from api module first"""
        try:
            api_spec = importlib.util.spec_from_file_location(
                f"tools.{tool_dir.name}.api",
                tool_dir / "api.py"
            )
            if api_spec and api_spec.loader:
                api_module = importlib.util.module_from_spec(api_spec)
                api_spec.loader.exec_module(api_module)
                if hasattr(api_module, 'register_apis'):
                    orig_route = self.app.route
                    self.app.route = self._monkeypatch_route(tool_dir.name)
                    api_module.register_apis(self.app, f'/api/{tool_dir.name}')
                    self.app.route = orig_route
                    print(f"Registered APIs for tool: {tool_dir.name} (from api.py)")
                else:
                    print(f"Warning: {tool_dir.name}/api.py has no register_apis function")
            else:
                print(f"Warning: Could not load {tool_dir.name}/api.py")
        except Exception as api_error:
            # Fallback: try to register APIs from tool module (backward compatibility)
            if hasattr(module, 'register_apis'):
                orig_route = self.app.route
                self.app.route = self._monkeypatch_route(tool_dir.name)
                module.register_apis(self.app, f'/api/{tool_dir.name}')
                self.app.route = orig_route
                print(f"Registered APIs for tool: {tool_dir.name} (from tool.py - deprecated)")
            else:
                print(f"Warning: No API registration found for tool: {tool_dir.name}")
                print(f"API error: {api_error}")

    def validate_tool(self, tool_dir: Path) -> bool:
        """Validate tool structure and setup"""
        try:
            # Check for tool-specific requirements
            tool_req_file = tool_dir / "requirements.txt"
            if tool_req_file.exists():
                print(f"Tool {tool_dir.name} has additional requirements in {tool_req_file}")

            # Load tool-specific environment variables
            tool_env_file = tool_dir / ".env"
            if tool_env_file.exists():
                load_dotenv(tool_env_file)
                print(f"Loaded environment variables for tool: {tool_dir.name}")

            # Check if tool.py exists
            tool_file = tool_dir / "tool.py"
            if not tool_file.exists():
                print(f"Warning: tool.py not found for tool {tool_dir.name}, skipping")
                return False

            return True
        except Exception as e:
            print(f"Error validating tool {tool_dir.name}: {e}")
            return False

    def validate_tool_info(self, tool_info) -> bool:
        """Validate tool_info structure and required fields"""
        try:
            if not isinstance(tool_info, dict):
                print("Error: tool_info must be a dictionary")
                return False

            required_keys = ['name', 'description', 'category', 'icon']
            for key in required_keys:
                if key not in tool_info:
                    print(f"Error: tool_info missing required key '{key}'")
                    return False
                if not isinstance(tool_info[key], str) or not tool_info[key].strip():
                    print(f"Error: tool_info['{key}'] must be a non-empty string")
                    return False

            return True
        except Exception as e:
            print(f"Error validating tool_info: {e}")
            return False

    def get_available_tools(self):
        """Get list of available tools"""
        return self.tools