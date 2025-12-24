"""
Dev Tool First Date - Members API (Flask)

This module implements a minimal, in-memory replacement of the FastAPI example
you provided. It exposes member and session endpoints under the tool's base
path (e.g. /api/dev-tool-first-date/*) and is intended for local testing.

Endpoints:
- GET  /members
- GET  /members/<id>
- POST /register       -> register a member in a group
- POST /unregister     -> unregister a member
- POST /connect        -> create a session and return session id
- POST /disconnect     -> deactivate a session
- POST /registered     -> check whether a member is registered

State is ephemeral and lives only in memory.
"""

from flask import jsonify, request
import requests
from requests.exceptions import RequestException



upstream_base = 'http://127.0.0.1:8443'

def register_apis(app, base_path: str):
    @app.route(f"{base_path}/group_instruction_info", methods=["POST"])
    def group_instruction_info():
        """Proxy to upstream /api/group_instruction_info with group_name and conversation_type from payload (no defaults)."""
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        conversation_type = payload.get('conversation_type')
        if not group_name or not conversation_type:
            return jsonify({'success': False, 'error': 'missing group_name or conversation_type'}), 400
        try:
            upstream_payload = {
                'group_name': group_name,
                'conversation_type': conversation_type
            }
            upstream_resp = _proxy_post('/api/group_instruction_info', upstream_payload)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/group_instruction_info')
            return jsonify({'success': False, 'error': 'Failed to contact upstream group_instruction_info'}), 502
    """Register members endpoints on the provided Flask app under base_path."""
    
    def _proxy_post(path: str, payload: dict | None = None, *, member_id: int | None = None, timeout: float = 5.0):
        url = f"{upstream_base}{path}"
        headers = {"Authorization": "Bearer CHANGE_ME_ADMIN_TOKEN"}

        params = {}
        if member_id is not None:
            params['member_id'] = member_id  # pass as query parameter

        resp = requests.post(url, json=payload or {}, headers=headers, params=params, timeout=timeout)
        resp.raise_for_status()
        return resp.json()


    @app.route(f"{base_path}/member_decisions", methods=["POST"])
    def member_decisions():
        payload = request.get_json(force=True)
        member_id = payload.get('member_id')
        if not member_id:
            return jsonify({'success': False, 'error': 'missing member_id'}), 400
        try:
            upstream_resp = _proxy_post('/api/member_decisions', payload={}, member_id=member_id)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/member_decisions')
            return jsonify({'success': False, 'error': 'Failed to contact upstream member_decisions'}), 502

    @app.route(f"{base_path}/member_conversations", methods=["POST"])
    def member_conversations():
        """Proxy to upstream /api/member_conversations with member_id, returns JSON object."""
        payload = request.get_json(force=True)
        member_id = payload.get('member_id')
        only_last = payload.get('only_last', False)
        if not member_id:
            return jsonify({'success': False, 'error': 'missing member_id'}), 400
        try:
            upstream_payload = {'only_last': only_last}  # only_last in JSON
            upstream_resp = _proxy_post('/api/member_conversations', upstream_payload, member_id=member_id)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/member_conversations')
            return jsonify({'success': False, 'error': 'Failed to contact upstream member_conversations'}), 502

    
    @app.route(f"{base_path}/decision_start", methods=["POST"])
    def decision_start():
        """Start a decision by calling the upstream decision_create endpoint.
        Expected input (from frontend):
          { group_name, max_agents, max_messages, context }
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        context = payload.get('context')
        participant_members_ids = payload.get('participant_members_ids', [12, 22])

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not context:
            return jsonify({'success': False, 'error': 'missing context'}), 400

        try:
            decision_req = {
                'group_name': group_name,
                'participant_members_ids': participant_members_ids,
                'context': context
            }
            app.logger.debug('Proxying decision_create with payload: %s', decision_req)
            upstream_resp = _proxy_post('/api/decision_create', decision_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/decision_create')
            return jsonify({'success': False, 'error': 'Failed to contact upstream decision service'}), 502


    @app.route(f"{base_path}/members", methods=["GET"])
    def get_members():
        """Proxy to upstream /api/group_members_profiles (POST) with group_name from query param or default."""
        group_name = request.args.get('group_name', 'first-date')
        try:
            upstream_resp = _proxy_post('/api/group_members_profiles', {'group_name': group_name})
            # Upstream returns a list of profiles; wrap in success envelope for frontend
            return jsonify({"success": True, "members": upstream_resp})
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/group_members_profiles')
            return jsonify({'success': False, 'error': 'Failed to contact upstream group_members_profiles'}), 502


    @app.route(f"{base_path}/members/<int:member_id>", methods=["GET"])
    def get_member(member_id: int):
        """Proxy to upstream /api/member_profile (POST) with member_id."""
        try:
            upstream_resp = _proxy_post('/api/member_profile', {'member_id': member_id})
            # Upstream returns the profile dict or empty dict
            if upstream_resp:
                return jsonify({"success": True, "member": upstream_resp})
            else:
                return jsonify({"success": False, "error": "Member not found"}), 404
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/member_profile')
            return jsonify({'success': False, 'error': 'Failed to contact upstream member_profile'}), 502

    @app.route(f"{base_path}/conversations", methods=["POST"])
    def get_conversations():
        """Return conversations for the Conversations panel.

        Expects a JSON payload with `group_name`, mirroring the register endpoint.
        The request is proxied to upstream `/api/group_conversations` which returns
        a raw list. We return that list under the `conversations` key. If the
        caller omits `group_name` we return 400. On upstream failure we fall back
        to the local hard-coded CONVERSATIONS list.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name') if isinstance(payload, dict) else None

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400

        try:
            upstream_resp = _proxy_post('/api/group_conversations', {'group_name': group_name})
            # Upstream is expected to return a list of conversations; return it
            # under the `conversations` key so clients have a consistent shape.
            return jsonify({'success': True, 'conversations': upstream_resp})
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/group_conversations')
            # Do NOT fall back to local data; surface the error to the caller so
            # they can detect upstream unavailability.
            return jsonify({'success': False, 'error': 'Failed to contact upstream group_conversations'}), 502

    @app.route(f"{base_path}/registered", methods=["POST"])
    def check_registered():
        payload = request.get_json(force=True)
        group_name = payload.get("group_name")
        # Use the nickname exactly as provided by the caller (do NOT normalize).
        nick_raw = payload.get("member_nick_name")
        # Require both group_name and member_nick_name to be present.
        if not group_name or not nick_raw:
            return jsonify({"success": False, "error": "missing group_name or member_nick_name"}), 400
        try:
            # Upstream expects group_name; forward the original name.
            upstream_resp = _proxy_post('/api/registered', {'group_name': group_name, 'member_nick_name': payload.get('member_nick_name')})
            if isinstance(upstream_resp, dict) and 'registered' in upstream_resp:
                return jsonify({'registered': bool(upstream_resp.get('registered'))})
            # If upstream returned non-standard payload, return it as-is
            return jsonify(upstream_resp)
        except RequestException as e:
            app.logger.exception('Failed to contact upstream /api/registered')
            return jsonify({'success': False, 'error': 'Failed to contact upstream registration service'}), 502

    @app.route(f"{base_path}/register", methods=["POST"])
    def do_register():
        payload = request.get_json(force=True)
        group_name = payload.get("group_name")
        raw_name = payload.get('member_nick_name')
        
        if not group_name or not raw_name:
            return jsonify({"success": False, "error": "missing group_name or member_nick_name"}), 400

        # ...existing code...
        # MEMBERS logic removed; registration logic may need to be updated to fetch member_profile from upstream if required.
        return jsonify({"success": False, "error": "member profile not found (MEMBERS lookup removed)"}), 400

    @app.route(f"{base_path}/unregister", methods=["POST"])
    def do_unregister():
        payload = request.get_json(force=True)
        group_name = payload.get("group_name")
        nick_raw = payload.get('member_nick_name')
        if not group_name or not nick_raw:
            return jsonify({"success": False, "error": "missing group_name or member_nick_name"}), 400
        try:
            upstream_resp = _proxy_post('/api/unregister', {'group_name': group_name, 'member_nick_name': payload.get('member_nick_name')})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/unregister')
            return jsonify({'success': False, 'error': 'Failed to contact upstream registration service'}), 502

    @app.route(f"{base_path}/connect", methods=["POST"])
    def do_connect():
        payload = request.get_json(force=True)
        group_name = payload.get("group_name")
        # Preserve nickname exactly as provided by the caller.
        nick_raw = payload.get('member_nick_name')
        if not group_name or not nick_raw:
            return jsonify({"success": False, "error": "missing group_name or member_nick_name"}), 400
        try:
            upstream_resp = _proxy_post('/api/connect', {'group_name': group_name, 'member_nick_name': payload.get('member_nick_name')})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/connect')
            return jsonify({'success': False, 'error': 'Failed to contact upstream registration service'}), 502

    @app.route(f"{base_path}/disconnect", methods=["POST"])
    def do_disconnect():
        payload = request.get_json(force=True)
        session_id = payload.get("session_id")
        try:
            upstream_resp = _proxy_post('/api/disconnect', {'session_id': session_id})
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/disconnect')
            return jsonify({'success': False, 'error': 'Failed to contact upstream registration service'}), 502

    @app.route(f"{base_path}/conversation_start", methods=["POST"])
    def conversation_start():
        """Start a conversation by calling the upstream conversation_create endpoint.
        Expected input (from frontend):
          { group_name, max_agents, max_messages }
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        participant_members_ids = payload.get('participant_members_ids')
        max_messages = payload.get('max_messages', 20)
        context = payload.get('context')

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400

        if not context:
            return jsonify({'success': False, 'error': 'missing context'}), 400 
        
        try:
            conv_req = {
                'group_name': group_name,
                'participant_members_ids': participant_members_ids,
                'max_messages': max_messages,
                'context': context
            }

            app.logger.debug('Proxying conversation_create with payload (caller member_profile/selected_members ignored): %s', conv_req)
            upstream_resp = _proxy_post('/api/conversation_create', conv_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_create')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation service'}), 502

    @app.route(f"{base_path}/conversation_messages", methods=["POST"])
    def conversation_messages():
        """Return messages for a conversation by calling upstream /api/conversation_messages.
        Expected input: { conversation_id }
        """
        payload = request.get_json(force=True)
        conversation_id = payload.get('conversation_id')

        if not conversation_id:
            return jsonify({'success': False, 'error': 'missing conversation_id'}), 400

        try:
            # Upstream expects { conversation_id: ... }
            upstream_resp = _proxy_post('/api/conversation_messages', {'conversation_id': conversation_id})
            # Upstream returns a list of dicts directly. Wrap it for consistency if desired,
            # or return as-is. The prompt implies we delegate the API, so returning the list
            # wrapped in a success envelope is usually safer for our frontend.
            return jsonify({'success': True, 'messages': upstream_resp})
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_messages')
            return jsonify({'success': False, 'error': 'Failed to contact upstream message service'}), 502
