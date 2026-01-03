"""
Dev Tool Conversations - Tool Registration

This is a regular tool (not a panel-based tool).
"""


def get_tool_info():
    return {
        'name': 'Conversations',
        'description': 'Generic group members browser with group selection.',
        'category': 'utility',
        'icon': '👥',
        'version': '1.0.0',
        'imports': [
            'components/*.js',
        ],
    }

