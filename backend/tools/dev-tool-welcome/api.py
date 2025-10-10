"""
Dev Tool Welcome - API Endpoints
Provides a welcome message with server information.
"""

from flask import Blueprint, jsonify
import datetime

def register_apis(app, base_path):
    """Register dev-tool-welcome API endpoints"""

    @app.route(f'{base_path}/message', methods=['GET'])
    def get_welcome_message():
        """Get welcome message with server information"""
        # Get current time
        current_time = datetime.datetime.now()
        formatted_time = current_time.strftime("%B %d, %Y at %I:%M %p")
        
        return jsonify({
            'success': True,
            'data': {
                'message': 'Welcome to the Dev Tools Application! 🎉',
                'subtitle': 'Your comprehensive development utilities platform is ready to assist you.',
                'server_time': formatted_time,
                'status': 'Server running smoothly',
                'timestamp': current_time.strftime("%Y-%m-%d")
            }
        })
