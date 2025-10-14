"""
Dev Tool System Info - API Endpoints
Handles HTTP requests and responses for system info and welcome message.
"""

from flask import jsonify
from . import tool

def register_apis(app, base_path):
    """Register dev-tool-system-performance API endpoints"""
    
    @app.route(f'{base_path}/info', methods=['GET'])
    def get_system_info_endpoint():
        """Get static welcome message with server system information"""
        try:
            # Get system info and welcome message
            info_data = tool.get_system_info()
            
            return jsonify({
                'success': True,
                'data': info_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
    
    @app.route(f'{base_path}/memory-usage', methods=['GET'])
    def get_memory_usage():
        """Get memory usage by applications/processes"""
        try:
            # Get memory usage data
            memory_data = tool.get_memory_usage_by_process()
            
            return jsonify({
                'success': True,
                'data': memory_data
            })
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
