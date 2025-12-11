"""
Dev Tool First Date - Backend Tool
Provides simple date utilities: current date and first day of month/year.
"""

def get_tool_info():
    return {
        'name': 'First Date',
        'description': 'Simple date utilities: shows today and first day of current month/year.',
        'version': '1.0.0',
        'author': 'Dev Tools App',
        'category': 'utility',
        'icon': '👥',
        'imports': [
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js',
            'first-date-utils.js',
            'components/*.js',
        ],
    }
