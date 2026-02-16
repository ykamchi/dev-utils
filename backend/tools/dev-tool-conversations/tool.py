"""
Dev Tool Conversations - Tool Registration

This is a regular tool (not a panel-based tool).
"""


def get_tool_info():
    return {
        'name': 'Conversations',
        'description': 'A Structured Multi-Agent Framework for Discovering Individual and Group Decision Needs. This tool provides a comprehensive interface for managing and analyzing conversations within groups.',
        'category': 'utility',
        'icon': '🗫',
        'version': '1.0.0',
        'imports': [
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
            'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js',
            'https://cdn.jsdelivr.net/npm/diff@5.1.0/dist/diff.min.js',
            'constants.js',
            'status_api.js',
            'api*.js',
            'utils.js',
            'popups.js',
            'components/*.js',
            'components/charts/*.js',
        ],
    }

