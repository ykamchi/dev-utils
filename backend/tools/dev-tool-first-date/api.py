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
from typing import Any
import json
from pathlib import Path
import requests
from requests.exceptions import RequestException


# Load members from a dedicated JSON file so the data is easier to manage.
_BASE_DIR = Path(__file__).parent
_MEMBERS_FILE = _BASE_DIR / "members.json"
try:
    with open(_MEMBERS_FILE, "r", encoding="utf-8") as f:
        MEMBERS = json.load(f)
except Exception as e:
    raise RuntimeError(f"Failed to load members from {_MEMBERS_FILE}: {e}")


def register_apis(app, base_path: str):
    """Register members endpoints on the provided Flask app under base_path."""

    upstream_base = 'http://127.0.0.1:8443'

    def _proxy_post(path: str, payload: dict, timeout: float = 5.0):
        """Post JSON to upstream and return parsed JSON or raise RequestException."""
        url = f"{upstream_base}{path}"
        resp = requests.post(url, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()

    @app.route(f"{base_path}/members", methods=["GET"])
    def get_members():
        return jsonify({"success": True, "members": MEMBERS})

    @app.route(f"{base_path}/members/<int:member_id>", methods=["GET"])
    def get_member(member_id: int):
        for m in MEMBERS:
            if m.get("id") == member_id:
                return jsonify({"success": True, "member": m})
        return jsonify({"success": False, "error": "Member not found"}), 404

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

        raw_name = payload.get('member_nick_name')
        member_profile = None
        if raw_name:
            for m in MEMBERS:
                if m.get('name') == raw_name:
                    member_profile = m
                    break
            if member_profile is None:
                rn_norm = str(raw_name).strip().lower()
                for m in MEMBERS:
                    if str(m.get('name', '')).strip().lower() == rn_norm:
                        member_profile = m
                        break

        if member_profile is None:
            return jsonify({"success": False, "error": "member profile not found"}), 400

        payload_up = {
            'group_name': group_name,
            'member_nick_name': raw_name,
            'member_profile': member_profile,
        }

        try:
            upstream_resp = _proxy_post('/api/register', payload_up)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/register')
            return jsonify({'success': False, 'error': 'Failed to contact upstream registration service'}), 502

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

        if not group_name:
            return jsonify({'success': False, 'error': 'missing group_name'}), 400

        try:
            conv_req = {
                'group_name': group_name,
                'max_agents': payload.get('max_agents', 2),
                'max_messages': payload.get('max_messages', 50),
            }

            app.logger.debug('Proxying conversation_create with payload (caller member_profile/selected_members ignored): %s', conv_req)
            upstream_resp = _proxy_post('/api/conversation_create', conv_req)
            return jsonify(upstream_resp)
        except RequestException:
            app.logger.exception('Failed to contact upstream /api/conversation_create')
            return jsonify({'success': False, 'error': 'Failed to contact upstream conversation service'}), 502
