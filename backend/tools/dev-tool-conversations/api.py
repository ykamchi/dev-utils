"""
Dev Tool Conversations - API (Flask)

This module exposes member endpoints under the tool's base path (e.g. /api/dev-tool-conversations/*).
It is a generic version of dev-tool-first-date and does not assume a specific group name.

State is ephemeral and lives only in memory or is proxied upstream.
"""

from time import sleep
from flask import Blueprint, jsonify, request
import os
import requests
from requests.exceptions import RequestException

upstream_base = 'http://127.0.0.1:8443'
sleep_time = 0 # Sleep time to simulate network delay - testing

def _proxy_post(path: str, payload: dict | None = None, *, member_id: int | None = None, timeout: float = 45.0):
    """
    Proxy a POST request to the upstream service.
    """
    sleep(sleep_time)
    url = f"{upstream_base}{path}"
    headers = {"Authorization": "Bearer CHANGE_ME_ADMIN_TOKEN"}
    params = {}
    if member_id is not None:
        params['member_id'] = member_id
    resp = requests.post(url, json=payload or {}, headers=headers, params=params, timeout=timeout)
    resp.raise_for_status()
    return resp.json()

def register_apis(app, base_path: str):
    register_system_apis(app, base_path)
    register_groups_apis(app, base_path)
    register_members_apis(app, base_path)
    register_instructions_apis(app, base_path)
    register_conversations_apis(app, base_path)
    register_seed_data_apis(app, base_path)



########################################################################################################################################################
# System APIs
# These APIs are intended to be used by the frontend system components for system management.
########################################################################################################################################################
def register_system_apis(app, base_path: str):
    @app.route(f"{base_path}/status_queue_state", methods=["POST"])
    def status_queue_state():
        """
        Proxy to upstream /api/status_queue_state (POST) to get the current queue state.
        """
        try:
            upstream_resp = _proxy_post('/api/status_queue_state', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/status_queue_state')
            return jsonify({'success': False, 'error': 'Failed to contact upstream status_queue_state service'}), 502
    
    @app.route(f"{base_path}/status_queue_pause", methods=["POST"])
    def queue_pause():
        """
        Proxy to upstream /api/status_queue_pause (POST) to pause the queue.
        """
        try:
            upstream_resp = _proxy_post('/api/status_queue_pause', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/status_queue_pause')
            return jsonify({'success': False, 'error': 'Failed to contact upstream status_queue_pause service'}), 502      
    
    @app.route(f"{base_path}/status_queue_resume", methods=["POST"])
    def queue_resume():
        """
        Proxy to upstream /api/status_queue_resume (POST) to resume the queue.
        """
        try:
            upstream_resp = _proxy_post('/api/status_queue_resume', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/status_queue_resume')
            return jsonify({'success': False, 'error': 'Failed to contact upstream status_queue_resume service'}), 502 
        
    @app.route(f"{base_path}/status_conversation_timeline", methods=["POST"])
    def status_conversation_timeline():
        """
        Proxy to upstream /api/status_conversation_timeline (POST) to get conversation timeline.
        Expects JSON payload: {"conversation_id": ...}
        """
        payload = request.get_json(force=True)
        try:
            request_payload = {}
            if payload.get('group_name') is not None:
                request_payload["group_name"] = payload.get('group_name')
            if payload.get('conversation_type') is not None:
                request_payload["conversation_type"] = payload.get('conversation_type') 
            if (payload.get('instruction_type') is not None):
                request_payload["instruction_type"] = payload.get('instruction_type')
            if payload.get('states') is not None:
                request_payload["states"] = payload.get('states')
            if payload.get('hours_back') is not None:
                request_payload["hours_back"] = payload.get('hours_back')
            if payload.get('interval') is not None:
                request_payload["interval"] = payload.get('interval')

            upstream_resp = _proxy_post('/api/status_conversation_timeline', request_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/status_conversation_timeline')
            return jsonify({'success': False, 'error': 'Failed to contact upstream status_conversation_timeline service'}), 502
        




# Groups API endpoints
#         
#
def register_groups_apis(app, base_path: str):

    @app.route(f"{base_path}/groups_list", methods=["POST"])
    def groups_list():
        """
        Proxy to upstream /api/groups/list to fetch available group names.
        """
        try:
            return jsonify(_proxy_post('/api/groups/list', {}))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups/list'}), 502


    @app.route(f"{base_path}/groups_get", methods=["POST"])
    def groups_get():
        """
        Proxy to upstream /api/groups/get to fetch group info.
        """
        try:
            payload = request.get_json(force=True)

            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id')
            }
            return jsonify(_proxy_post('/api/groups/get', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups/get')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups/get'}), 502


    @app.route(f"{base_path}/groups_add", methods=["POST"])
    def groups_add():
        """
        Proxy to upstream /api/groups/add to add a new group.
        """
        try:
            payload = request.get_json(force=True)

            if not payload.get('group_name'):
                return jsonify({'success': False, 'error': 'missing group_name'}), 400
        
            upstream_payload = {
                'group_name': payload.get('group_name'),
                'description': payload.get('group_description')
            }
            return jsonify(_proxy_post('/api/groups/add', upstream_payload))

        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups/add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups/add'}), 502


    @app.route(f"{base_path}/groups_delete", methods=["POST"])
    def groups_delete():
        """
        Proxy to upstream /api/groups/delete to delete a group.
        """
        try:
            payload = request.get_json(force=True)

            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
        
            upstream_payload = {
                'group_id': payload.get('group_id')
            }
            return jsonify(_proxy_post('/api/groups/delete', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups/delete')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups/delete'}), 502


    @app.route(f"{base_path}/groups_update", methods=["POST"])
    def groups_update():
        """
        Proxy to upstream /api/groups/update to update group info.
        """
        try:
            payload = request.get_json(force=True)

            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'group_name': payload.get('group_name'),
                'group_description': payload.get('group_description')
            }
            return jsonify(_proxy_post('/api/groups/update', upstream_payload))

        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups/update')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups/update'}), 502


# Instructions API endpoints
#         
#
def register_instructions_apis(app, base_path: str):
    @app.route(f"{base_path}/instructions_list", methods=["POST"])
    def instructions_list():
        """
        Proxy to upstream /api/instructions/list with group_name from payload (no defaults).
        """
        try:
            payload = request.get_json(force=True)
            
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id'),
            }

            if payload.get('conversation_type'):
                upstream_payload['conversation_type'] = payload.get('conversation_type')   

            return jsonify(_proxy_post('/api/instructions/list', upstream_payload))
            
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/instructions/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream instructions/list'}), 502


    @app.route(f"{base_path}/instructions_delete", methods=["POST"])
    def instructions_delete():
        """
        Proxy to upstream /api/instructions/delete to delete group instructions.
        """
        try:
            payload = request.get_json(force=True)
            
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('instructions_type'):
                return jsonify({'success': False, 'error': 'missing instructions_type'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'instructions_type': payload.get('instructions_type')
            }
            
            return jsonify(_proxy_post('/api/instructions/delete', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/instructions/delete')
            return jsonify({'success': False, 'error': 'Failed to contact upstream instructions/delete'}), 502


    @app.route(f"{base_path}/instructions_add", methods=["POST"])
    def instructions_add():
        """
        Proxy to /api/instructions/add to add group instructions.
        """
        try:
            payload = request.get_json(force=True)

            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('instructions'):
                return jsonify({'success': False, 'error': 'missing instructions'}), 400
            
            if not payload.get('feedback_def'):
                return jsonify({'success': False, 'error': 'missing feedback_def'}), 400
            
            if not payload.get('info'):
                return jsonify({'success': False, 'error': 'missing info'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'instructions_type': payload.get('instructions_type'),
                'instructions': payload.get('instructions'),
                'feedback_def': payload.get('feedback_def'),
                'info': payload.get('info')
            }
            
            return jsonify(_proxy_post('/api/instructions/add', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/instructions/add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream instructions/add'}), 502
    
    
    @app.route(f"{base_path}/instructions_update", methods=["POST"])
    def instructions_update():
        """
        Proxy to /api/instructions/update to update group instructions.
        """
        try:
            payload = request.get_json(force=True)
            
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('instructions_type'):
                return jsonify({'success': False, 'error': 'missing instructions_type'}), 400
            
            if not payload.get('instructions'):
                return jsonify({'success': False, 'error': 'missing instructions'}), 400
            
            if not payload.get('feedback_def'):
                return jsonify({'success': False, 'error': 'missing feedback_def'}), 400
            
            if not payload.get('info'):
                return jsonify({'success': False, 'error': 'missing info'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'instructions_type': payload.get('instructions_type'),
                'instructions': payload.get('instructions'),
                'feedback_def': payload.get('feedback_def'),
                'info': payload.get('info')
            }
            
            return jsonify(_proxy_post('/api/instructions/update', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/instructions/update')
            return jsonify({'success': False, 'error': 'Failed to contact upstream instructions/update'}), 502
        

# Members API endpoints
#         
#
def register_members_apis(app, base_path: str):
    @app.route(f"{base_path}/members_list", methods=["POST"])
    def get_members():
        """
        Proxy to upstream /api/members/list (POST) with group_id from request body (required).
        """
        try:
            payload = request.get_json(force=True)
            
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id')
            }

            
            return jsonify(_proxy_post('/api/members/list', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/members/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream members/list'}), 502

    @app.route(f"{base_path}/members_add", methods=["POST"])
    def members_add():
        """
        Proxy to upstream /api/members/add (POST) with group_name and members from request body (required).
        """
        try:
            payload = request.get_json(force=True)
            
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('members_profiles'):
                return jsonify({'success': False, 'error': 'missing members'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'members_profiles': payload.get('members_profiles')
            }   

            
            return jsonify(_proxy_post('/api/members/add', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/members/add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream members/add'}), 502


# Conversations API endpoints
#         
#
def register_conversations_apis(app, base_path: str):
    @app.route(f"{base_path}/conversations_list", methods=["POST"])
    def conversations_list():
        """
        Proxy to upstream /api/conversations/list (POST) with group_name and member_name from request body (required).
        """
        try:
            payload = request.get_json(force=True)
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('member_nick_name'):
                return jsonify({'success': False, 'error': 'missing member_nick_name'}), 400
                    
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'member_nick_name': payload.get('member_nick_name'),
            }   

            if payload.get('conversation_type'):
                upstream_payload['conversation_type'] = payload.get('conversation_type')
            
            if payload.get('only_last'):
                upstream_payload['only_last'] = payload.get('only_last')

            return jsonify(_proxy_post('/api/conversations/list', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversations/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversations/list'}), 502
        
    @app.route(f"{base_path}/conversation_add", methods=["POST"])
    def conversation_add():
        """
        Proxy to upstream /api/conversation_add (POST) to start a conversation.
        """
        payload = request.get_json(force=True)

        if not payload.get('group_id'):
            return jsonify({'success': False, 'error': 'missing group_id'}), 400
        
        if not payload.get('context'):
            return jsonify({'success': False, 'error': 'missing context'}), 400

        try:
            conversation_req = {
                'group_id': payload.get('group_id'),
                'participant_members_nick_names': payload.get('participant_members_nick_names'),
                'context': payload.get('context'),
                'conversation_type': payload.get('conversation_type'),
                'max_messages': payload.get('max_messages', 10),
                'debug': payload.get('debug', []),
            }
            app.logger.debug('Proxying conversation_add with payload: %s', conversation_req)
            upstream_resp = _proxy_post('/api/conversation/add', conversation_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation service'}), 502

    @app.route(f"{base_path}/conversation_messages", methods=["POST"])
    def conversation_messages():
        """
        Proxy to upstream /api/conversation/messages (POST) to get conversation messages.
        Expects JSON payload: {"conversation_id": ...}
        """
        payload = request.get_json(force=True)
        conversation_id = payload.get('conversation_id')
        conversation_type = payload.get('conversation_type')
        if not conversation_id:
            return jsonify({'success': False, 'error': 'missing conversation_id'}), 400
        if not conversation_type:
            return jsonify({'success': False, 'error': 'missing conversation_type'}), 400
        
        try:
            upstream_resp = _proxy_post('/api/conversation/messages', {'conversation_type': conversation_type, 'conversation_id': conversation_id})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation/messages')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation/messages service'}), 502



# Seed Data API endpoints
# These APIs read seed data from the local filesystem for development purposes.
#
def register_seed_data_apis(app, base_path: str):
    @app.route(f"{base_path}/group_seeds", methods=["PUT"])
    def group_seeds():
        """
        Returns a list of seed names (subfolder names) in the conversations-examples folder.
        Expects JSON payload: {"group_name": ...}
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            seed_root = os.path.expanduser(os.path.join('~/code/conversations-examples'))
            if not os.path.exists(seed_root):
                return jsonify({'success': True, 'data': []})
            
            result = []
            for entry in os.scandir(seed_root):
                if entry.is_dir():
                    group_name = entry.name
                    group_folder = os.path.join(seed_root, group_name)
                    group_seed_file = os.path.join(group_folder, 'group_seed.json')
                    if os.path.exists(group_seed_file):
                        try:
                            with open(group_seed_file, 'r', encoding='utf-8') as f:
                                content = f.read()
                        except Exception:
                            content = ''
                        result.append({'group_name': group_name, 'content': content})
            
            # Process the seeds with validation
            processed_seeds = seed_utils.extract_groups_seed_data(result)
            
            return jsonify({'success': True, 'data': processed_seeds})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route(f"{base_path}/group_seed_files", methods=["PUT"])
    def group_seed_files():
        """
        Returns processed and validated seed data for a group.
        Expects JSON payload: {"group_name": ...}
        Returns seedingData array with validation results.
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_name = payload.get('group_name')
            if not group_name:
                return jsonify({'success': False, 'error': 'missing group_name'}), 400
            
            seed_root = os.path.expanduser(os.path.join('~/code/conversations-examples', group_name))
            if not os.path.exists(seed_root):
                return jsonify({'success': True, 'data': []})
            
            # Read all files
            files = []
            for dirpath, _, filenames in os.walk(seed_root):
                for filename in filenames:
                    file_path = os.path.join(dirpath, filename)
                    rel_path = os.path.relpath(file_path, os.path.expanduser('~/code/conversations-examples'))
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except Exception:
                        content = ''
                    files.append({
                        'name': filename,
                        'size': len(content),
                        'type': '',
                        'webkitRelativePath': rel_path.replace('\\', '/'),
                        'content': content
                    })
            
            # Process files into seeding data
            seeding_data = seed_utils.extract_seed_data(files)
            return jsonify({'success': True, 'data': seeding_data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
