"""
Dev Tool RSS - API Endpoints
"""

from flask import Blueprint, jsonify, request
import os
import sys

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import tool

def register_apis(app, prefix):
    """Register RSS tool API endpoints"""

    rss_bp = Blueprint('rss', __name__, url_prefix=prefix)

    @rss_bp.route('/feeds', methods=['GET'])
    def get_feeds():
        """Get all available RSS feeds with optional filtering"""
        category = request.args.get('category')
        feeds = tool.get_feeds_by_category(category)

        # Format feeds for frontend - return as array to preserve order
        formatted_feeds = []
        for feed_id, feed_info in feeds.items():
            formatted_feeds.append({
                'id': feed_id,
                'name': feed_info['name'],
                'category': feed_info['category'],
                'language': feed_info['language'],
                'country': feed_info['country'],
                'description': feed_info['description'],
                'usage': feed_info.get('usage', 0),
                'image': feed_info.get('image')
            })

        return jsonify({
            'success': True,
            'feeds': formatted_feeds,
            'categories': tool.get_available_categories()
        })

    @rss_bp.route('/feed/<feed_id>', methods=['GET'])
    def get_feed(feed_id):
        """Get RSS feed content by ID"""
        feeds_data = tool.load_feeds()
        if feed_id not in feeds_data:
            return jsonify({
                'success': False,
                'error': f'Feed {feed_id} not found'
            }), 404

        feed_info = feeds_data[feed_id]
        max_items = request.args.get('max_items', 20, type=int)

        result = tool.parse_rss_feed(feed_info['url'], max_items)

        if result['success']:
            # Increment usage count for this feed
            tool.increment_feed_usage(feed_id)
            
            result['feed_info'] = {
                'id': feed_id,
                'name': feed_info['name'],
                'category': feed_info['category'],
                'description': feed_info['description'],
                'image': feed_info.get('image')
            }

        return jsonify(result)

    app.register_blueprint(rss_bp)