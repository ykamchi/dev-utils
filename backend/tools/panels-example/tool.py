"""
Panels Example Tool - Backend Logic
Demonstrates the panel-based tool architecture.
"""

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Panels Example',
        'description': 'Demonstration of panel-based tool architecture with secondary toolbar',
        'category': 'example',
        'icon': '🎭',
        'version': '1.0.0',
        'endpoints': []
    }

# Example function that would be called by the API
# This demonstrates how to structure backend logic in tool.py
# Uncomment this function when you need backend API functionality
#
# def get_example_data() -> Dict[str, Any]:
#     """
#     Get example data for the panels.
#
#     This function demonstrates:
#     1. How to structure data returned to frontend panels
#     2. How to include timestamps for cache-busting
#     3. How to format data for JSON serialization
#     4. How to handle dynamic data generation
#
#     Returns:
#         Dict containing example data with current timestamp
#     """
#     return {
#         'message': 'Hello from panels-example API!',
#         'timestamp': datetime.datetime.now().isoformat(),
#         'version': '1.0.0',
#         'features': [
#             'Panel layouts',
#             'Secondary toolbar',
#             'Interactive controls',
#             'Real-time updates'
#         ],
#         'stats': {
#             'panels_loaded': 3,
#             'buttons_clicked': 0,
#             'last_updated': datetime.datetime.now().strftime('%H:%M:%S')
#         }
#     }
