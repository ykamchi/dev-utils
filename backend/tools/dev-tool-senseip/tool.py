"""
Senseip Tool - Backend Logic
Provides access to job monitoring and management.
"""

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'Senseip',
        'description': 'Job monitoring and management system',
        'category': 'system',
        'icon': '🔍',
        'version': '1.0.0',
        'has_panels': True,
        'panels': ['jobjs', 'k8slogs'],
        'endpoints': [
            'GET /api/dev-tool-senseip/jobs',
            'GET /api/dev-tool-senseip/namespaces',
            'GET /api/dev-tool-senseip/pods/<namespace>',
            'GET /api/dev-tool-senseip/logs/<namespace>/<pod>'
        ]
    }