"""
Dev Tool Conversations - Generic Members API (Flask)

This module exposes member endpoints under the tool's base path (e.g. /api/dev-tool-conversations/*).
It is a generic version of dev-tool-first-date and does not assume a specific group name.

Endpoints:
- GET  /members
- GET  /members/<id>

State is ephemeral and lives only in memory or is proxied upstream.
"""

from flask import jsonify, request
from flask import Blueprint, jsonify, request
import requests
from requests.exceptions import RequestException

upstream_base = 'http://127.0.0.1:8443'

def register_apis(app, base_path: str):

    def _proxy_post(path: str, payload: dict | None = None, *, member_id: int | None = None, timeout: float = 5.0):
        """
        Proxy a POST request to the upstream service.
        """
        url = f"{upstream_base}{path}"
        headers = {"Authorization": "Bearer CHANGE_ME_ADMIN_TOKEN"}
        params = {}
        if member_id is not None:
            params['member_id'] = member_id
        resp = requests.post(url, json=payload or {}, headers=headers, params=params, timeout=timeout)
        resp.raise_for_status()
        return resp.json()


    @app.route(f"{base_path}/group_instruction_info", methods=["POST"])
    def group_instruction_info():
        """
        Proxy to upstream /api/group_instruction_info with group_name and conversation_type from payload (no defaults).
        """
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


    @app.route(f"{base_path}/member_decisions", methods=["POST"])
    def member_decisions():
        """
        Proxy to upstream /api/member_decisions (POST) with member_id from request body (required).
        """
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


    @app.route(f"{base_path}/decision_start", methods=["POST"])
    def decision_start():
        """
        Proxy to upstream /api/decision_create (POST) to start a decision.
        """
        payload = request.get_json(force=True)
        group_name = payload.get('group_name')
        context = payload.get('context')
        participant_members_nick_names = payload.get('participant_members_nick_names')

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400
        if not context:
            return jsonify({'success': False, 'error': 'missing context'}), 400

        try:
            decision_req = {
                'group_name': group_name,
                'participant_members_nick_names': participant_members_nick_names,
                'context': context
            }
            app.logger.debug('Proxying decision_create with payload: %s', decision_req)
            upstream_resp = _proxy_post('/api/decision_create', decision_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/decision_create')
            return jsonify({'success': False, 'error': 'Failed to contact upstream decision service'}), 502
