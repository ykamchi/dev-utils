"""
System Info Tool - API Endpoints
"""

from flask import jsonify
from .tool import get_current_time, get_battery_info, get_hardware_info, get_os_info, get_network_info

def register_apis(app, base_path):
    """Register system-info API endpoints"""

    @app.route(f'{base_path}/time', methods=['GET'])
    def get_time():
        """Get current time information"""
        try:
            time_data = get_current_time()
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
            battery_data = get_battery_info()
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
            hardware_data = get_hardware_info()
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
            os_data = get_os_info()
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
            network_data = get_network_info()
            return jsonify({
                'success': True,
                'data': network_data
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500