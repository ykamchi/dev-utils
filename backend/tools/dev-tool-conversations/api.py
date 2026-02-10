"""
Dev Tool Conversations - API (Flask)

This module exposes member endpoints under the tool's base path (e.g. /api/dev-tool-conversations/*).
It is a generic version of dev-tool-first-date and does not assume a specific group name.

State is ephemeral and lives only in memory or is proxied upstream.
"""

from time import sleep
from flask import Blueprint, jsonify, request
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
    register_ai_apis(app, base_path)


# System API endpoints
#         
#
def register_system_apis(app, base_path: str):
    @app.route(f"{base_path}/queue_state", methods=["POST"])
    def queue_state():
        """
        Proxy to upstream /api/queue/state (POST) to get the current queue state.
        """
        try:
            upstream_resp = _proxy_post('/api/queue/state', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/queue/state')
            return jsonify({'success': False, 'error': 'Failed to contact upstream queue/state service'}), 502
    

    @app.route(f"{base_path}/queue_pause", methods=["POST"])
    def queue_pause():
        """
        Proxy to upstream /api/queue/pause (POST) to pause the queue.
        """
        try:
            upstream_resp = _proxy_post('/api/queue/pause', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/queue/pause')
            return jsonify({'success': False, 'error': 'Failed to contact upstream queue/pause service'}), 502      
    
    @app.route(f"{base_path}/queue_resume", methods=["POST"])
    def queue_resume():
        """
        Proxy to upstream /api/queue/resume (POST) to resume the queue.
        """
        try:
            upstream_resp = _proxy_post('/api/queue/resume', {})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/queue/resume')
            return jsonify({'success': False, 'error': 'Failed to contact upstream queue/resume service'}), 502 
        

    @app.route(f"{base_path}/status_conversation_timeline", methods=["POST"])
    def status_conversation_timeline():
        """
        Proxy to upstream /api/status_conversation_timeline (POST) to get conversation timeline.
        Expects JSON payload: {"conversation_id": ...}
        """
        payload = request.get_json(force=True)
        try:
            request_payload = {}
            if payload.get('group_id') is not None:
                request_payload["group_id"] = payload.get('group_id')
            if payload.get('conversation_type') is not None:
                request_payload["conversation_type"] = payload.get('conversation_type') 
            if (payload.get('instructions_key') is not None):
                request_payload["instructions_key"] = payload.get('instructions_key')
            if payload.get('states') is not None:
                request_payload["states"] = payload.get('states')
            if payload.get('hours_back') is not None:
                request_payload["hours_back"] = payload.get('hours_back')
            if payload.get('interval') is not None:
                request_payload["interval"] = payload.get('interval')
            if payload.get('aggregation_levels') is not None:
                request_payload["aggregation_levels"] = payload.get('aggregation_levels')

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
                'group_key': payload.get('group_key'),
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
        Proxy to upstream /api/instructions_list with group_name from payload (no defaults).
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
            
            if not payload.get('instructions_key'):
                return jsonify({'success': False, 'error': 'missing instructions_key'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'instructions_key': payload.get('instructions_key')
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
                        
            if not payload.get('info'):
                return jsonify({'success': False, 'error': 'missing info'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'info': payload.get('info'),
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
                        
            if not payload.get('info'):
                return jsonify({'success': False, 'error': 'missing info'}), 400
            
            upstream_payload = {
                'group_id': payload.get('group_id'),
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
            
            if not payload.get('members_data'):
                return jsonify({'success': False, 'error': 'missing members'}), 400
        
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'members_data': payload.get('members_data')
            }   

            
            return jsonify(_proxy_post('/api/members/add', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/members/add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream members/add'}), 502


    @app.route(f"{base_path}/members_conversations_list", methods=["POST"])
    def members_conversations_list():
        """
        Proxy to upstream /api/members/conversations/list (POST) with group_name and member_name from request body (required).
        """
        try:
            payload = request.get_json(force=True)
            if not payload.get('group_id'):
                return jsonify({'success': False, 'error': 'missing group_id'}), 400
            
            if not payload.get('member_name'):
                return jsonify({'success': False, 'error': 'missing member_name'}), 400
                    
            upstream_payload = {
                'group_id': payload.get('group_id'),
                'member_name': payload.get('member_name'),
            }   

            if payload.get('conversation_type'):
                upstream_payload['conversation_type'] = payload.get('conversation_type')
            
            if payload.get('only_last'):
                upstream_payload['only_last'] = payload.get('only_last')

            return jsonify(_proxy_post('/api/conversations/list', upstream_payload))
        
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/members/conversations/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream members/conversations/list'}), 502



# Conversations API endpoints
#         
#
def register_conversations_apis(app, base_path: str):
    @app.route(f"{base_path}/conversations_add", methods=["POST"])
    def conversation_add():
        """
        Proxy to upstream /api/conversations/add (POST) to start a conversation.
        """
        payload = request.get_json(force=True)

        if not payload.get('group_id'):
            return jsonify({'success': False, 'error': 'missing group_id'}), 400
        
        if not payload.get('info'):
            return jsonify({'success': False, 'error': 'missing info'}), 400
        
        if not payload.get('participants'):
            return jsonify({'success': False, 'error': 'missing participants'}), 400
        
        # Validate participants is an array
        participants = payload.get('participants')
        if not isinstance(participants, list):
            return jsonify({'success': False, 'error': 'participants must be an array'}), 400
        
        # Validate each participant has required fields
        for participant in participants:
            if not isinstance(participant, dict):
                return jsonify({'success': False, 'error': 'each participant must be an object'}), 400
            if 'member_name' not in participant:
                return jsonify({'success': False, 'error': 'each participant must have member_name'}), 400
            if 'instruction_role' not in participant:
                return jsonify({'success': False, 'error': 'each participant must have instruction_role'}), 400

        try:
            conversation_req = {
                'group_id': payload.get('group_id'),
                'info': payload.get('info'),
                'participants': participants
            }
            
            upstream_resp = _proxy_post('/api/conversations/add', conversation_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversations/add')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation service'}), 502


    @app.route(f"{base_path}/conversations_messages_list", methods=["POST"])
    def conversations_messages_list():
        """
        Proxy to upstream /api/conversations/messages/list (POST) to get conversation messages.
        Expects JSON payload: {"conversation_id": ...}
        """
        payload = request.get_json(force=True)
        conversation_id = payload.get('conversation_id')
        
        if not conversation_id:
            return jsonify({'success': False, 'error': 'missing conversation_id'}), 400
        
        try:
            upstream_resp = _proxy_post('/api/conversations/messages/list', {'conversation_id': conversation_id})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversations/messages/list')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversations/messages/list service'}), 502



# Seed Data API endpoints
# These APIs read seed data from the local filesystem for development purposes.
# New structure uses group.json, members.json, instructions.json files.
#
def register_seed_data_apis(app, base_path: str):
    @app.route(f"{base_path}/seeds_groups_get", methods=["PUT"])
    def seeds_groups_get():
        """
        Get group seed data from ~/code/conversations-examples.
        Each directory should contain a group.json file.
        
        Expects JSON payload: {"group_key": ...} (optional)
        - If group_key is None: returns array of all groups
        - If group_key is provided: returns single group object or null if not found
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            
            seeding_data = seed_utils.seeds_groups_get(group_key)
            
            return jsonify({'success': True, 'data': seeding_data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_members_get", methods=["PUT"])
    def seeds_members_get():
        """
        Get members seed data from members.json in group directory.
        
        Expects JSON payload: {"group_key": ..., "member_key": ...} 
        - group_key is required
        - member_key is optional
        - If member_key is None: returns array of all members
        - If member_key is provided: returns single member object or null if not found
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            member_key = payload.get('member_key')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            
            seeding_data = seed_utils.seeds_members_get(group_key, member_key)
            
            return jsonify({'success': True, 'data': seeding_data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_instructions_get", methods=["PUT"])
    def seeds_instructions_get():
        """
        Get instructions seed data from instructions.json in group directory.
        
        Expects JSON payload: {"group_key": ..., "instruction_key": ...} 
        - group_key is required
        - instruction_key is optional
        - If instruction_key is None: returns array of all instructions
        - If instruction_key is provided: returns single instruction object or null if not found
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            instruction_key = payload.get('instruction_key')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            
            seeding_data = seed_utils.seeds_instructions_get(group_key, instruction_key)
            
            return jsonify({'success': True, 'data': seeding_data})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_groups_set", methods=["PUT"])
    def seeds_groups_set():
        """
        Create or update group seed data in group.json file.
        
        Expects JSON payload: {
            "group_key": "...",
            "group_data": {
                "group_key": "...",
                "group_name": "...",
                "group_description": "..."
            }
        }
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            group_data = payload.get('group_data')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            if not group_data:
                return jsonify({'success': False, 'error': 'missing group_data'}), 400
            
            result = seed_utils.seeds_groups_set(group_key, group_data)
            
            return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_members_set", methods=["PUT"])
    def seeds_members_set():
        """
        Create or update member seed data in members.json array.
        Finds member by member_key and updates, or appends if not found.
        
        Expects JSON payload: {
            "group_key": "...",
            "member_key": "...",
            "member_data": {
                "member_key": "...",
                "name": "...",
                "roles": [...],
                "profile": {...}
            }
        }
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            member_key = payload.get('member_key')
            member_data = payload.get('member_data')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            if not member_key:
                return jsonify({'success': False, 'error': 'missing member_key'}), 400
            if not member_data:
                return jsonify({'success': False, 'error': 'missing member_data'}), 400
            
            result = seed_utils.seeds_members_set(group_key, member_key, member_data)
            
            return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_instructions_set", methods=["PUT"])
    def seeds_instructions_set():
        """
        Create or update instruction seed data in instructions.json array.
        Finds instruction by instruction_key and updates, or appends if not found.
        
        Expects JSON payload: {
            "group_key": "...",
            "instruction_key": "...",
            "instruction_data": {
                "instruction_key": "...",
                "name": "...",
                "description": "...",
                "max_turns": ...,
                "roles": {...}
            }
        }
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            instruction_key = payload.get('instruction_key')
            instruction_data = payload.get('instruction_data')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            if not instruction_key:
                return jsonify({'success': False, 'error': 'missing instruction_key'}), 400
            if not instruction_data:
                return jsonify({'success': False, 'error': 'missing instruction_data'}), 400
            
            result = seed_utils.seeds_instructions_set(group_key, instruction_key, instruction_data)
            
            return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_members_delete", methods=["PUT"])
    def seeds_members_delete():
        """
        Delete member from members.json array.
        Finds member by member_key and removes it.
        
        Expects JSON payload: {
            "group_key": "...",
            "member_key": "..."
        }
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            member_key = payload.get('member_key')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            if not member_key:
                return jsonify({'success': False, 'error': 'missing member_key'}), 400
            
            result = seed_utils.seeds_members_delete(group_key, member_key)
            
            return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


    @app.route(f"{base_path}/seeds_instructions_delete", methods=["PUT"])
    def seeds_instructions_delete():
        """
        Delete instruction from instructions.json array.
        Finds instruction by instruction_key and removes it.
        
        Expects JSON payload: {
            "group_key": "...",
            "instruction_key": "..."
        }
        """
        try:
            sleep(sleep_time)
            from . import seed_utils
            
            payload = request.get_json(force=True)
            group_key = payload.get('group_key')
            instruction_key = payload.get('instruction_key')
            
            if not group_key:
                return jsonify({'success': False, 'error': 'missing group_key'}), 400
            if not instruction_key:
                return jsonify({'success': False, 'error': 'missing instruction_key'}), 400
            
            result = seed_utils.seeds_instructions_delete(group_key, instruction_key)
            
            return jsonify({'success': True, 'data': result})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# AI API endpoints
#
#
def register_ai_apis(app, base_path: str):
    @app.route(f"{base_path}/ai_autocomplete", methods=["POST"])
    def ai_autocomplete():
        """
        Proxy to upstream /api/ai/autocomplete (POST) for AI-powered autocomplete suggestions.
        
        Expects JSON payload: {
            "full_text": "...",
            "cursor_position": 123,
            "left_fragment": "...",
            "right_fragment": "...",
            "context": {
                "field": "group_name",
                "operation": "create_group",
                "existing_data": {...}
            }
        }
        
        Returns: {
            "suggestion": {
                "completion": "word"
            }
        }
        """
        try:
            payload = request.get_json(force=True)
            
            if 'full_text' not in payload:
                return jsonify({'success': False, 'error': 'missing full_text'}), 400
            
            if 'cursor_position' not in payload:
                return jsonify({'success': False, 'error': 'missing cursor_position'}), 400
            
            if 'left_fragment' not in payload:
                return jsonify({'success': False, 'error': 'missing left_fragment'}), 400
            
            if 'right_fragment' not in payload:
                return jsonify({'success': False, 'error': 'missing right_fragment'}), 400
                        
            if 'context' not in payload:
                return jsonify({'success': False, 'error': 'missing context'}), 400
            
            upstream_payload = {
                'full_text': payload.get('full_text'),
                'cursor_position': payload.get('cursor_position'),
                'left_fragment': payload.get('left_fragment'),
                'right_fragment': payload.get('right_fragment'),
                'context': payload.get('context')
            }
            
            upstream_resp = _proxy_post('/api/ai/autocomplete', upstream_payload)
            return jsonify(upstream_resp)
            
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/ai/autocomplete')
            return jsonify({'success': False, 'error': 'Failed to contact upstream ai/autocomplete service'}), 502
