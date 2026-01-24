"""
Dev Tool Conversations - Generic Members API (Flask)

This module exposes member endpoints under the tool's base path (e.g. /api/dev-tool-conversations/*).
It is a generic version of dev-tool-first-date and does not assume a specific group name.

Endpoints:
- GET  /members
- GET  /members/<id>

State is ephemeral and lives only in memory or is proxied upstream.
"""

from encodings.punycode import T
from time import sleep
from flask import Blueprint, jsonify, request, send_file
import os
import requests
from requests.exceptions import RequestException

upstream_base = 'http://127.0.0.1:8443'
sleep_time = 0 # Sleep time to simulate network delay - testing
def register_apis(app, base_path: str):

    @app.route(f"{base_path}/group_seeds", methods=["PUT"])
    def group_seeds():
        """
        Returns a list of seed names (subfolder names) in the conversations-examples folder.
        Expects JSON payload: {"group_name": ...}
        """
        sleep(sleep_time)
        
        seed_root = os.path.expanduser(os.path.join('~/code/conversations-examples'))
        if not os.path.exists(seed_root):
            return jsonify({'success': True, 'seeds':[] })
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

        return jsonify({'success': True, 'seeds': result})

    @app.route(f"{base_path}/group_seed_files", methods=["PUT"])
    def group_seed_files():
        """
        Returns a list of files in the group seed-data folder, mimicking e.target.files structure.
        Expects JSON payload: {"group_name": ...}
        Each file object: {name, size, type, webkitRelativePath, content}
        """
        sleep(sleep_time)
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        seed_root = os.path.expanduser(os.path.join('~/code/conversations-examples', group_name))
        if not os.path.exists(seed_root):
            return jsonify({'success': True, 'files':[] })
        result = []
        for dirpath, _, filenames in os.walk(seed_root):
            for filename in filenames:
                file_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(file_path, os.path.expanduser('~/code/conversations-examples'))
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception:
                    content = ''
                result.append({
                    'name': filename,
                    'size': len(content),
                    'type': '',  # Optionally set MIME type
                    'webkitRelativePath': rel_path.replace('\\', '/'),
                    'content': content
                })
        return jsonify({'success': True, 'files': result})

    def _proxy_post(path: str, payload: dict | None = None, *, member_id: int | None = None, timeout: float = 5.0):
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


    @app.route(f"{base_path}/groups", methods=["POST"])
    def get_groups():
        """
        Proxy to upstream /api/groups to fetch available group names.
        """
        try:
            upstream_resp = _proxy_post('/api/groups', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/groups')
            return jsonify({'success': False, 'error': 'Failed to contact upstream groups'}), 502

    @app.route(f"{base_path}/add_group", methods=["POST"])
    def add_group():
        """
        Proxy to upstream /api/add_group to add a new group.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        description = payload.get('group_description')
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        try:
            upstream_payload = {
                'group_name': group_name,
                'description': description
            }
            upstream_resp = _proxy_post('/api/add_group', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/add_group')
            return jsonify({'success': False, 'error': 'Failed to contact upstream add_group'}), 502

    @app.route(f"{base_path}/delete_group", methods=["POST"])
    def delete_group():
        """
        Proxy to upstream /api/delete_group to delete a group.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        try:
            upstream_payload = {
                'group_name': group_name
            }
            upstream_resp = _proxy_post('/api/delete_group', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/delete_group')
            return jsonify({'success': False, 'error': 'Failed to contact upstream delete_group'}), 502

    @app.route(f"{base_path}/update_group", methods=["POST"])
    def update_group():
        """
        Proxy to upstream /api/update_group to update group info.
        """
        payload = request.get_json(force=True)
        if not payload.get('old_group_name'):
            return jsonify({'success': False, 'error': 'missing old_group_name'}), 400
        try:
            upstream_payload = {
                'old_group_name': payload.get('old_group_name'),
                'new_group_name': payload.get('new_group_name'),
                'new_group_description': payload.get('new_group_description')
            }
            upstream_resp = _proxy_post('/api/update_group', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/update_group')
            return jsonify({'success': False, 'error': 'Failed to contact upstream update_group'}), 502

    @app.route(f"{base_path}/group_instructions", methods=["POST"])
    def group_instructions():
        """
        Proxy to upstream /api/group_instructions with group_name from payload (no defaults).
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        conversation_type = payload.get('conversation_type')
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        try:
            upstream_payload = {
                'group_name': group_name,
            }

            if conversation_type:
                upstream_payload['conversation_type'] = conversation_type   

            upstream_resp = _proxy_post('/api/group_instructions', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/group_instructions')
            return jsonify({'success': False, 'error': 'Failed to contact upstream group_instructions'}), 502


    @app.route(f"{base_path}/delete_group_instructions", methods=["POST"])
    def delete_group_instructions():
        """
        Proxy to upstream /api/delete_group_instructions to delete group instructions.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        instructions_type = payload.get('instructions_type')
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not instructions_type:
            return jsonify({'success': False, 'error': 'missing instructions_type'}), 400
        try:
            upstream_payload = {
                'group_name': group_name,
                'instructions_type': instructions_type
            }
            upstream_resp = _proxy_post('/api/delete_group_instructions', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/delete_group_instructions')
            return jsonify({'success': False, 'error': 'Failed to contact upstream delete_group_instructions'}), 502


    @app.route(f"{base_path}/add_group_instructions", methods=["POST"])
    def add_group_instructions():
        """
        Proxy to /api/add_group_instructions to add group instructions.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        instructions = payload.get('instructions')
        
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        # if not instructions_type:
        #     return jsonify({'success': False, 'error': 'missing instructions_type'}), 400
        if not instructions:
            return jsonify({'success': False, 'error': 'missing instructions'}), 400
            
        try:
            upstream_payload = {
                'group_name': group_name,
                'instructions': instructions,
                'feedback_def': payload.get('feedback_def'),
                'info': payload.get('info')
            }
            add_resp = _proxy_post('/api/add_group_instructions', upstream_payload)
            return jsonify(add_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/add_group_instructions')
            return jsonify({'success': False, 'error': 'Failed to contact upstream add_group_instructions'}), 502

    @app.route(f"{base_path}/update_group_instructions", methods=["POST"])
    def update_group_instructions():
        """
        Proxy to /api/update_group_instructions to update group instructions.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        instructions_type = payload.get('instructions_type')
        instructions = payload.get('instructions')
        
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not instructions_type:
            return jsonify({'success': False, 'error': 'missing instructions_type'}), 400
        if not instructions:
            return jsonify({'success': False, 'error': 'missing instructions'}), 400
            
        try:
            upstream_payload = {
                'group_name': group_name,
                'instructions_type': instructions_type,
                'instructions': instructions,
                'feedback_def': payload.get('feedback_def'),
                'info': payload.get('info')
            }
            upstream_resp = _proxy_post('/api/update_group_instructions', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/update_group_instructions')
            return jsonify({'success': False, 'error': 'Failed to contact upstream update_group_instructions'}), 502

    @app.route(f"{base_path}/member_conversations", methods=["POST"])
    def member_conversations():
        """
        Proxy to upstream /api/member_conversations (POST) with member_id from request body (required).
        """
        payload = request.get_json(force=True)
        conversation_type = payload.get('conversation_type')
        member_id = payload.get('member_id')
        only_last = payload.get('only_last', False)
        
        if not member_id:
            return jsonify({'success': False, 'error': 'missing member_id'}), 400
        try:
            upstream_resp = _proxy_post('/api/member_conversations', payload={ 'conversation_type': conversation_type, 'only_last': only_last }, member_id=member_id)
            return jsonify(upstream_resp)
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/member_conversations')
            return jsonify({'success': False, 'error': 'Failed to contact upstream member_conversations'}), 502
        


    @app.route(f"{base_path}/add_members", methods=["POST"])
    def add_members():
        """
        Proxy to upstream /api/add_members (POST) with group_name and members from request body (required).
        """
        data = request.get_json(force=True)
        group_name = data.get('group_name') if data else None
        members = data.get('members') if data else None
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not members:
            return jsonify({'success': False, 'error': 'missing members'}), 400
        try:
            upstream_resp = _proxy_post('/api/add_members', {'group_name': group_name, 'members': members})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/add_members')
            return jsonify({'success': False, 'error': 'Failed to contact upstream add_members'}), 502
    
    @app.route(f"{base_path}/members", methods=["POST"])
    def get_members():
        """
        Proxy to upstream /api/group_members_profiles (POST) with group_name from request body (required).
        """
        data = request.get_json(force=True)
        group_name = data.get('group_name') if data else None
        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        try:
            upstream_resp = _proxy_post('/api/group_members_profiles', {'group_name': group_name})
            return jsonify({"success": True, "members": upstream_resp})
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/group_members_profiles')
            return jsonify({'success': False, 'error': 'Failed to contact upstream group_members_profiles'}), 502


    @app.route(f"{base_path}/members/<int:member_id>", methods=["GET"])
    def get_member(member_id: int):
        """
        Proxy to upstream /api/member_profile (POST) with member_id.
        """
        try:
            upstream_resp = _proxy_post('/api/member_profile', {'member_id': member_id})
            if upstream_resp:
                return jsonify({"success": True, "member": upstream_resp})
            else:
                return jsonify({"success": False, "error": "Member not found"}), 404
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/member_profile')
            return jsonify({'success': False, 'error': 'Failed to contact upstream member_profile'}), 502



    @app.route(f"{base_path}/conversation_start", methods=["POST"])
    def conversation_start():
        """
        Proxy to upstream /api/conversation_start (POST) to start a conversation.
        """
        payload = request.get_json(force=True)
        conversation_type = payload.get('conversation_type')
        group_name = payload.get('group_name')
        context = payload.get('context')
        participant_members_nick_names = payload.get('participant_members_nick_names')

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not context:
            return jsonify({'success': False, 'error': 'missing context'}), 400

        try:
            conversation_req = {
                'group_name': group_name,
                'participant_members_nick_names': participant_members_nick_names,
                'context': context,
                'conversation_type': conversation_type
            }
            app.logger.debug('Proxying conversation_start with payload: %s', conversation_req)
            upstream_resp = _proxy_post('/api/conversation_start', conversation_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_start')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation service'}), 502
        


    @app.route(f"{base_path}/conversation_messages", methods=["POST"])
    def conversation_messages():
        """
        Proxy to upstream /api/conversation_messages (POST) to get conversation messages.
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
            upstream_resp = _proxy_post('/api/conversation_messages', {'conversation_type': conversation_type, 'conversation_id': conversation_id})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_messages')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation_messages service'}), 502



########################################################################################################################################################
# System APIs
# These APIs are intended to be used by the frontend system components for system management.
########################################################################################################################################################
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