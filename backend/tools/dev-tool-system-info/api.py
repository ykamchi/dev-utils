"""
System Info Tool - API Endpoints
"""

from flask import jsonify
from . import tool

def register_apis(app, base_path):
    """Register system-info API endpoints"""

    @app.route(f'{base_path}/time', methods=['GET'])
    def get_time():
        """Get current time information"""
        try:
            time_data = tool.get_current_time()
            return jsonify({
                'success': True,
                'data': time_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/battery', methods=['GET'])
    def get_battery():
        """Get battery status information"""
        try:
            battery_data = tool.get_battery_info()
            return jsonify({
                'success': True,
                'data': battery_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/hardware', methods=['GET'])
    def get_hardware():
        """Get hardware information"""
        try:
            hardware_data = tool.get_hardware_info()
            return jsonify({
                'success': True,
                'data': hardware_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/os', methods=['GET'])
    def get_os():
        """Get OS information"""
        try:
            os_data = tool.get_os_info()
            return jsonify({
                'success': True,
                'data': os_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500

    @app.route(f'{base_path}/network', methods=['GET'])
    def get_network():
        """Get network interface information"""
        try:
            network_data = tool.get_network_info()
            return jsonify({
                'success': True,
                'data': network_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500