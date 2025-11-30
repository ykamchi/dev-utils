"""
Dev Tool RSS - Core Logic
"""

import requests
import feedparser
from datetime import datetime, timedelta
import time
import json
import os
import sys

# Add current directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

def get_tool_info():
    """Return tool metadata"""
    return {
        'name': 'RSS Reader',
        'description': 'Read RSS feeds from various sources with filtering and categorization',
        'category': 'news',
        'icon': '📰',
        'version': '1.0.0',
        'endpoints': [
            'GET /api/dev-tool-rss/feeds',
            'GET /api/dev-tool-rss/feed/<feed_id>'
        ]
    }

def load_feeds():
    """Load feeds data from JSON file"""
    feeds_file = os.path.join(current_dir, 'feeds.json')
    try:
        with open(feeds_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading feeds: {e}")
        return {}

def save_feeds(feeds_data):
    """Save feeds data to JSON file"""
    feeds_file = os.path.join(current_dir, 'feeds.json')
    try:
        with open(feeds_file, 'w', encoding='utf-8') as f:
            json.dump(feeds_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving feeds: {e}")

def increment_feed_usage(feed_id):
    """Increment usage count for a feed"""
    feeds_data = load_feeds()
    if feed_id in feeds_data:
        feeds_data[feed_id]['usage'] = feeds_data[feed_id].get('usage', 0) + 1
        save_feeds(feeds_data)

def get_feeds_with_usage():
    """Get feeds with usage counts included"""
    return load_feeds()

def get_available_categories():
    """Get unique categories from RSS feeds"""
    feeds_data = load_feeds()
    categories = set()
    for feed in feeds_data.values():
        categories.add(feed['category'])
    return sorted(list(categories))

def get_feeds_by_category(category=None):
    """Get feeds filtered by category and sorted by usage"""
    feeds_data = load_feeds()
    
    if category:
        filtered_feeds = {k: v for k, v in feeds_data.items() if v['category'] == category}
    else:
        filtered_feeds = feeds_data
    
    # Sort by usage count (descending), feeds with no usage (0) go last
    return dict(sorted(filtered_feeds.items(), key=lambda x: x[1].get('usage', 0), reverse=True))

def parse_rss_feed(feed_url, max_items=20):
    """Parse RSS feed and return formatted items"""
    try:
        # Set a reasonable timeout
        response = requests.get(feed_url, timeout=10)
        response.raise_for_status()

        # Parse the feed
        feed = feedparser.parse(response.content)

        items = []
        for entry in feed.entries[:max_items]:
            # Extract published date
            published = entry.get('published_parsed')
            if published:
                published_date = datetime(*published[:6])
            else:
                published_date = datetime.now()

            # Extract description/summary
            description = entry.get('summary', entry.get('description', ''))
            # Clean up HTML tags from description
            import re
            description = re.sub(r'<[^>]+>', '', description)
            description = description.strip()

            item = {
                'title': entry.get('title', 'No Title'),
                'link': entry.get('link', ''),
                'description': description[:300] + '...' if len(description) > 300 else description,
                'published': published_date.isoformat(),
                'author': entry.get('author', ''),
                'guid': entry.get('id', entry.get('link', ''))
            }
            items.append(item)

        return {
            'success': True,
            'feed_title': feed.feed.get('title', 'Unknown Feed'),
            'feed_description': feed.feed.get('description', ''),
            'items': items,
            'last_updated': datetime.now().isoformat()
        }

    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'Network error: {str(e)}',
            'items': []
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Parse error: {str(e)}',
            'items': []
        }