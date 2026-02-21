"""
Seed data utilities for dev-tool-conversations.
Handles reading, writing, and validating seed data from the filesystem.

New structure:
- /home/yohay/code/conversations-examples/{group_key}/group.json
- /home/yohay/code/conversations-examples/{group_key}/members.json
- /home/yohay/code/conversations-examples/{group_key}/instructions.json
"""

import json
import os
from typing import Dict, Any, List, Optional
from pathlib import Path


# Base path for seed data
SEED_BASE_PATH = Path.home() / 'code' / 'conversations-examples'


# ============================================================================
# Validation Functions
# ============================================================================

def validate_group(group: Any) -> Dict[str, Any]:
    """
    Validate group seed data structure.
    
    Required fields:
    - group_key: string
    - group_name: string
    - group_objectives: string
    - group_info: object (any structure inside is valid, but must be an object)
    """
    if not isinstance(group, dict):
        return {'valid': False, 'reason': 'Group must be a dictionary'}
    
    required_fields = ['group_key', 'group_name', 'group_objectives', 'group_info']
    for field in required_fields:
        if field not in group:
            return {'valid': False, 'reason': f'Missing required field: {field}'}
        if field == 'group_key' and group['group_key'] is not None and not isinstance(group['group_key'], str):
            return {'valid': False, 'reason': 'group_key must be a string or null'}
        if field == 'group_name' and not isinstance(group['group_name'], str):
            return {'valid': False, 'reason': 'group_name must be a string'}
        if field == 'group_objectives' and not isinstance(group['group_objectives'], str):
            return {'valid': False, 'reason': 'group_objectives must be a string'}
        if field == 'group_info' and not isinstance(group['group_info'], dict):
            return {'valid': False, 'reason': 'group_info must be an object'}
        
    # Check for unexpected fields
    allowed_fields = set(required_fields)
    unexpected = set(group.keys()) - allowed_fields
    if unexpected:
        return {'valid': False, 'reason': f'Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


def validate_member(member: Any) -> Dict[str, Any]:
    """
    Validate member seed data structure.
    
    Required fields:
    - member_name: string (display name)
    - member_key: string or null (null allowed for templates)
    - member_roles: array of strings
    - member_profile: object (any structure inside is valid)
    """
    if not isinstance(member, dict):
        return {'valid': False, 'reason': 'Member must be a dictionary'}
    
    required_fields = ['member_name', 'member_key', 'member_roles', 'member_profile']
    for field in required_fields:
        if field not in member:
            return {'valid': False, 'reason': f'Missing required field: {field}'}
    
    if not isinstance(member['member_name'], str):
        return {'valid': False, 'reason': 'member_name must be a string'}
    
    if member['member_key'] is not None and not isinstance(member['member_key'], str):
        return {'valid': False, 'reason': 'member_key must be a string or null'}
    
    if not isinstance(member['member_roles'], list):
        return {'valid': False, 'reason': 'member_roles must be an array'}
    
    if not all(isinstance(role, str) for role in member['member_roles']):
        return {'valid': False, 'reason': 'All member_roles must be strings'}
    
    if not isinstance(member['member_profile'], dict):
        return {'valid': False, 'reason': 'member_profile must be an object'}
    
    # Check for unexpected fields at top level
    allowed_fields = set(required_fields)
    unexpected = set(member.keys()) - allowed_fields
    if unexpected:
        return {'valid': False, 'reason': f'Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


def validate_feedback_def(feedback_def: Any) -> Dict[str, Any]:
    """
    Validate feedback_def structure.
    
    feedback_def is an array where each element has:
    - name: string (required) - the feedback field name
    - description: string (required)
    - type: string (required) - "integer" or "string"
    - required: boolean (required)
    - For type="integer": min, max (required)
    - For type="string": optional-values (optional array of strings)
    """
    if not isinstance(feedback_def, list):
        return {'valid': False, 'reason': 'feedback_def must be an array'}
    
    for idx, field_def in enumerate(feedback_def):
        if not isinstance(field_def, dict):
            return {'valid': False, 'reason': f'feedback_def[{idx}] must be an object'}
        
        # Check for name field
        if 'name' not in field_def:
            return {'valid': False, 'reason': f'feedback_def[{idx}]: Missing required field: name'}
        
        if not isinstance(field_def['name'], str):
            return {'valid': False, 'reason': f'feedback_def[{idx}]: name must be a string'}
        
        field_name = field_def['name']
        
        # Define allowed fields based on type
        base_fields = ['name', 'description', 'type', 'required']
        
        # Check required base fields
        for base_field in base_fields:
            if base_field not in field_def:
                return {'valid': False, 'reason': f'feedback_def.{field_name}: Missing required field: {base_field}'}
        
        if not isinstance(field_def['description'], str):
            return {'valid': False, 'reason': f'feedback_def.{field_name}: description must be a string'}
        
        if field_def['type'] not in ['integer', 'string']:
            return {'valid': False, 'reason': f'feedback_def.{field_name}: type must be "integer" or "string"'}
        
        if not isinstance(field_def['required'], bool):
            return {'valid': False, 'reason': f'feedback_def.{field_name}: required must be a boolean'}
        
        # Validate type-specific fields
        if field_def['type'] == 'integer':
            allowed_fields = set(base_fields + ['min', 'max'])
            
            if 'min' not in field_def:
                return {'valid': False, 'reason': f'feedback_def.{field_name}: Missing required field: min'}
            if 'max' not in field_def:
                return {'valid': False, 'reason': f'feedback_def.{field_name}: Missing required field: max'}
            
            if not isinstance(field_def['min'], int):
                return {'valid': False, 'reason': f'feedback_def.{field_name}: min must be an integer'}
            if not isinstance(field_def['max'], int):
                return {'valid': False, 'reason': f'feedback_def.{field_name}: max must be an integer'}
        
        elif field_def['type'] == 'string':
            allowed_fields = set(base_fields + ['optional-values'])
            
            if 'optional-values' in field_def:
                if not isinstance(field_def['optional-values'], list):
                    return {'valid': False, 'reason': f'feedback_def.{field_name}: optional-values must be an array'}
                if not all(isinstance(v, str) for v in field_def['optional-values']):
                    return {'valid': False, 'reason': f'feedback_def.{field_name}: All optional-values must be strings'}
        
        # Check for unexpected fields
        unexpected = set(field_def.keys()) - allowed_fields
        if unexpected:
            return {'valid': False, 'reason': f'feedback_def.{field_name}: Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


def validate_role(role_name: str, role: Any) -> Dict[str, Any]:
    """
    Validate role structure within an instruction.
    
    Required fields:
    - role_name: string
    - role_description: string
    - min: integer
    - max: integer
    - system_prompt: string
    - feedback_def: object (validated separately)
    """
    if not isinstance(role, dict):
        return {'valid': False, 'reason': f'Role {role_name} must be a dictionary'}
    
    required_fields = ['role_name', 'role_description', 'min', 'max', 'system_prompt', 'feedback_def']
    for field in required_fields:
        if field not in role:
            return {'valid': False, 'reason': f'Role {role_name}: Missing required field: {field}'}
    
    if not isinstance(role['role_name'], str):
        return {'valid': False, 'reason': f'Role {role_name}: role_name must be a string'}
    
    if not isinstance(role['role_description'], str):
        return {'valid': False, 'reason': f'Role {role_name}: role_description must be a string'}
    
    if not isinstance(role['min'], int):
        return {'valid': False, 'reason': f'Role {role_name}: min must be an integer'}
    
    if not isinstance(role['max'], int):
        return {'valid': False, 'reason': f'Role {role_name}: max must be an integer'}
    
    if not isinstance(role['system_prompt'], str):
        return {'valid': False, 'reason': f'Role {role_name}: system_prompt must be a string'}
    
    # Validate feedback_def
    feedback_validation = validate_feedback_def(role['feedback_def'])
    if not feedback_validation['valid']:
        return {'valid': False, 'reason': f'Role {role_name}: {feedback_validation["reason"]}'}
    
    # Check for unexpected fields
    allowed_fields = set(required_fields)
    unexpected = set(role.keys()) - allowed_fields
    if unexpected:
        return {'valid': False, 'reason': f'Role {role_name}: Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


def validate_instruction(instruction: Any) -> Dict[str, Any]:
    """
    Validate instruction seed data structure.
    
    Required root fields:
    - instruction_key: string (can be null for templates)
    - info: object containing:
        - name: string
        - conversation_objectives: string
        - conversation_type: string
        - max_turns: integer
        - roles: array of role objects
    """
    if not isinstance(instruction, dict):
        return {'valid': False, 'reason': 'Instruction must be a dictionary'}
    
    # Check root level fields
    if 'instruction_key' not in instruction:
        return {'valid': False, 'reason': 'Missing required field: instruction_key'}
    
    if 'info' not in instruction:
        return {'valid': False, 'reason': 'Missing required field: info'}
    
    if not isinstance(instruction['info'], dict):
        return {'valid': False, 'reason': 'info must be an object'}
    
    # Validate info object fields
    info = instruction['info']
    required_info_fields = ['name', 'conversation_objectives', 'conversation_type', 'max_turns', 'roles']
    for field in required_info_fields:
        if field not in info:
            return {'valid': False, 'reason': f'Missing required field in info: {field}'}
    
    if not isinstance(info['name'], str):
        return {'valid': False, 'reason': 'info.name must be a string'}
    
    if not isinstance(info['conversation_objectives'], str):
        return {'valid': False, 'reason': 'info.conversation_objectives must be a string'}
    
    if not isinstance(info['conversation_type'], str):
        return {'valid': False, 'reason': 'info.conversation_type must be a string'}
    
    if not isinstance(info['max_turns'], int):
        return {'valid': False, 'reason': 'info.max_turns must be an integer'}
    
    if not isinstance(info['roles'], list):
        return {'valid': False, 'reason': 'info.roles must be an array'}
    
    # Validate each role in the array
    for idx, role_def in enumerate(info['roles']):
        if not isinstance(role_def, dict):
            return {'valid': False, 'reason': f'info.roles[{idx}] must be an object'}
        
        if 'role_name' not in role_def:
            return {'valid': False, 'reason': f'info.roles[{idx}]: Missing required field: role_name'}
        
        role_name = role_def['role_name']
        role_validation = validate_role(role_name, role_def)
        if not role_validation['valid']:
            return role_validation
    
    # Check for unexpected fields at root level
    allowed_root_fields = {'instruction_key', 'info'}
    unexpected_root = set(instruction.keys()) - allowed_root_fields
    if unexpected_root:
        return {'valid': False, 'reason': f'Unexpected fields at root: {", ".join(unexpected_root)}'}
    
    # Check for unexpected fields in info
    allowed_info_fields = set(required_info_fields)
    unexpected_info = set(info.keys()) - allowed_info_fields
    if unexpected_info:
        return {'valid': False, 'reason': f'Unexpected fields in info: {", ".join(unexpected_info)}'}
    
    return {'valid': True, 'reason': None}


# ============================================================================
# GET Functions
# ============================================================================

def seeds_groups_get(group_key: Optional[str] = None, existing_keys: set = None) -> Any:
    """
    Get group seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Optional group key to filter. If None, returns all groups.
        existing_keys: Set of group_key values that already exist in the database (defaults to empty set).
        
    Returns:
        - If group_key is None: List of wrapped group objects with validation metadata
        - If group_key is provided: Single wrapped group object or None if not found
    """
    if existing_keys is None:
        existing_keys = set()
    if group_key == "templates":
        # Scan templates folder for files named group-*
        templates_path = SEED_BASE_PATH / "templates"
        if not templates_path.exists():
            return []
        all_templates = []
        for file in templates_path.iterdir():
            if file.is_file() and file.name.startswith("group-"):
                try:
                    with open(file, 'r', encoding='utf-8') as f:
                        group_data = json.load(f)
                    # Set group_key to null in returned data
                    group_data['group_key'] = None
                    validation = validate_group(group_data)
                    
                    # Templates always have group_key None, so they can't exist in database
                    exists_in_db = False
                    
                    wrapped_group = {
                        'type': 'group',
                        'seed_key': None,
                        'json': group_data,
                        'include': validation['valid'] and not exists_in_db,
                        'valid': validation['valid'],
                        'exist': exists_in_db,
                        'error': None if validation['valid'] else f"group.json validation error: {validation['reason']}"
                    }
                    all_templates.append(wrapped_group)
                except (json.JSONDecodeError, IOError) as e:
                    all_templates.append({
                        'type': 'group',
                        'seed_key': file.name,
                        'json': None,
                        'include': False,
                        'valid': False,
                        'error': f'Error reading {file.name}: {str(e)}'
                    })
        return all_templates

    if not SEED_BASE_PATH.exists():
        raise FileNotFoundError(f"Seed base path does not exist: {SEED_BASE_PATH}")

    all_groups = []

    # Scan all directories in base path
    for item in SEED_BASE_PATH.iterdir():
        if not item.is_dir():
            continue

        group_file = item / 'group.json'
        if not group_file.exists():
            continue

        try:
            with open(group_file, 'r', encoding='utf-8') as f:
                content = f.read()
                group_data = json.loads(content)

            # Validate structure
            validation = validate_group(group_data)
            
            # Check if group_key already exists in database (independent of validation)
            exists_in_db = group_data.get('group_key') in existing_keys

            # Wrap in metadata structure (like old implementation)
            wrapped_group = {
                'type': 'group',
                'seed_key': group_data.get('group_key'),
                'seed_name': group_data.get('group_name', 'Unknown Group'),
                'json': group_data,
                'include': validation['valid'] and not exists_in_db,
                'valid': validation['valid'],
                'exist': exists_in_db,
                'error': None if validation['valid'] else f"group.json validation error: {validation['reason']}"
            }

            all_groups.append(wrapped_group)
        except (json.JSONDecodeError, IOError) as e:
            # Include invalid entries with error information
            all_groups.append({
                'type': 'group',
                'seed_key': item.name,
                'seed_name': item.name,
                'json': None,
                'include': False,
                'valid': False,
                'error': f'Error reading group.json: {str(e)}'
            })

    # Filter by group_key if provided
    if group_key is not None:
        matching_groups = [g for g in all_groups if g.get('seed_key') == group_key]
        if len(matching_groups) == 0:
            return []
        if len(matching_groups) > 1:
            raise ValueError(f"Multiple groups found with group_key '{group_key}' - key is not unique")
        return [matching_groups[0]]

    return all_groups


def seeds_members_get(group_key: str, member_key: Optional[str] = None, existing_keys: set = None) -> Any:
    """
    Get members seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Group key (required)
        member_key: Optional member key to filter. If None, returns all members.
        existing_keys: Set of member_key values that already exist in the database (defaults to empty set).
        
    Returns:
        - If member_key is None: Array of all wrapped member objects with validation metadata
        - If member_key is provided: Array with single wrapped member object or empty array if not found
    """
    if existing_keys is None:
        existing_keys = set()
    
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        # Create the directory if it doesn't exist
        group_dir.mkdir(parents=True, exist_ok=True)
    
    members_file = group_dir / 'members.json'
    if not members_file.exists():
        # Return empty array if file doesn't exist
        return []
    
    try:
        with open(members_file, 'r', encoding='utf-8') as f:
            content = f.read()
            members_data = json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        # Return wrapped error structure
        return [{
            'type': 'member',
            'seed_key': group_key,
            'seed_name': f'Error reading {group_key}/members.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': f'Error reading members.json: {str(e)}'
        }]
    
    if not isinstance(members_data, list):
        return [{
            'type': 'member',
            'seed_key': group_key,
            'seed_name': f'Invalid format in {group_key}/members.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': 'members.json must contain an array'
        }]
    
    # Template validation: Check that all template seeds have null keys
    if group_key == 'templates':
        for member in members_data:
            if member.get('member_key') is not None:
                raise ValueError(f"System error: Template seed has non-null member_key: {member.get('member_key')}")
    
    # Wrap each member individually with validation metadata
    wrapped_members = []
    for member in members_data:
        validation = validate_member(member)
        
        # Check if member_key already exists in database (independent of validation)
        exists_in_db = member.get('member_key') in existing_keys
        
        wrapped_member = {
            'type': 'member',
            'seed_key': group_key,
            'seed_name': member.get('member_name', 'Unknown Member'),
            'json': member,
            'include': validation['valid'] and not exists_in_db,
            'valid': validation['valid'],
            'exist': exists_in_db,
            'error': None if validation['valid'] else f"Member validation error: {validation['reason']}"
        }
        
        wrapped_members.append(wrapped_member)
    
    # Filter by member_key if provided
    if member_key is not None:
        matching_members = [m for m in wrapped_members if m['json'] and m['json'].get('member_key') == member_key]
        if len(matching_members) == 0:
            return []
        if len(matching_members) > 1:
            raise ValueError(f"Multiple members found with member_key '{member_key}' - key is not unique")
        return matching_members
    
    return wrapped_members


def seeds_instructions_get(group_key: str, instruction_key: Optional[str] = None, existing_keys: set = None) -> Any:
    """
    Get instructions seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Group key (required)
        instruction_key: Optional instruction key to filter. If None, returns all instructions.
        existing_keys: Set of instruction_key values that already exist in the database (defaults to empty set).
        
    Returns:
        - If instruction_key is None: Array of all wrapped instruction objects with validation metadata
        - If instruction_key is provided: Array with single wrapped instruction object or empty array if not found
    """
    if existing_keys is None:
        existing_keys = set()
    
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        # Create the directory if it doesn't exist
        group_dir.mkdir(parents=True, exist_ok=True)
    
    instructions_file = group_dir / 'instructions.json'
    if not instructions_file.exists():
        # Return empty array if file doesn't exist
        return []
    
    try:
        with open(instructions_file, 'r', encoding='utf-8') as f:
            content = f.read()
            instructions_data = json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        return [{
            'type': 'instruction',
            'seed_key': group_key,
            'seed_name': f'Error reading {group_key}/instructions.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': f'Error reading instructions.json: {str(e)}'
        }]
    
    if not isinstance(instructions_data, list):
        return [{
            'type': 'instruction',
            'seed_key': group_key,
            'seed_name': f'Invalid format in {group_key}/instructions.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': 'instructions.json must contain an array'
        }]
    
    # Template validation: Check that all template seeds have null keys
    if group_key == 'templates':
        for instruction in instructions_data:
            if instruction.get('instruction_key') is not None:
                raise ValueError(f"System error: Template seed has non-null instruction_key: {instruction.get('instruction_key')}")
    
    # Wrap each instruction individually with validation metadata
    wrapped_instructions = []
    for instruction in instructions_data:
        validation = validate_instruction(instruction)
        
        # Check if instruction_key already exists in database (independent of validation)
        exists_in_db = instruction.get('instruction_key') in existing_keys
        
        wrapped_instruction = {
            'type': 'instruction',
            'seed_key': group_key,
            'seed_name': instruction.get('info', {}).get('name', 'Unknown Instruction'),
            'json': instruction,
            'include': validation['valid'] and not exists_in_db,
            'valid': validation['valid'],
            'exist': exists_in_db,
            'error': None if validation['valid'] else f"Instruction validation error: {validation['reason']}"
        }
        
        wrapped_instructions.append(wrapped_instruction)
    
    # Filter by instruction_key if provided
    if instruction_key is not None:
        matching_instructions = [i for i in wrapped_instructions if i['json'] and i['json'].get('instruction_key') == instruction_key]
        if len(matching_instructions) == 0:
            return []
        if len(matching_instructions) > 1:
            raise ValueError(f"Multiple instructions found with instruction_key '{instruction_key}' - key is not unique")
        return matching_instructions
    
    return wrapped_instructions


def seeds_instructions_roles_get(group_key: str) -> Any:
    """
    Get all roles from all instructions in a group as a flat array of wrapped role objects.
    
    Args:
        group_key: Group key (required)
        
    Returns:
        Array of all wrapped role objects with validation metadata from all instructions
    """
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        # Create the directory if it doesn't exist
        group_dir.mkdir(parents=True, exist_ok=True)
    
    instructions_file = group_dir / 'instructions.json'
    if not instructions_file.exists():
        # Return empty array if file doesn't exist
        return []
    
    try:
        with open(instructions_file, 'r', encoding='utf-8') as f:
            content = f.read()
            instructions_data = json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        return [{
            'type': 'role',
            'seed_key': group_key,
            'seed_name': f'Error reading {group_key}/instructions.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': f'Error reading instructions.json: {str(e)}'
        }]
    
    if not isinstance(instructions_data, list):
        return [{
            'type': 'role',
            'seed_key': group_key,
            'seed_name': f'Invalid format in {group_key}/instructions.json',
            'json': None,
            'include': False,
            'valid': False,
            'error': 'instructions.json must contain an array'
        }]
    
    # Extract and wrap all roles from all instructions
    wrapped_roles = []
    for instruction in instructions_data:
        # Basic instruction structure check
        if not isinstance(instruction, dict):
            continue
            
        if 'info' not in instruction or not isinstance(instruction['info'], dict):
            continue
            
        info = instruction['info']
        
        if 'roles' not in info or not isinstance(info['roles'], list):
            continue
        
        # Process each role in the instruction
        for role in info['roles']:
            if not isinstance(role, dict):
                continue
                
            # Validate the role
            role_name = role.get('role_name', 'unknown')
            validation = validate_role(role_name, role)
            
            # Build descriptive seed name with instruction and role name
            instruction_name = info.get('name', 'Unknown Instruction')
            seed_name = f"{instruction_name} - {role_name}"
            
            wrapped_role = {
                'type': 'role',
                'seed_key': group_key,
                'seed_name': seed_name,
                'json': role,
                'include': validation['valid'],
                'valid': validation['valid'],
                'exist': False,  # Roles don't have existence checking
                'error': None if validation['valid'] else f"Role validation error: {validation['reason']}"
            }
            
            wrapped_roles.append(wrapped_role)
    
    return wrapped_roles


# ============================================================================
# SET Functions (Create or Update)
# ============================================================================

def seeds_groups_set(group_key: str, group_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create or update group seed data on filesystem.
    
    Args:
        group_key: Group key (used for directory name)
        group_data: Group data to save (must include group_key, group_name)
        
    Returns:
        Dict with file_path and operation info
    """
    # Validate group data
    validation = validate_group(group_data)
    if not validation['valid']:
        raise ValueError(f"Invalid group data: {validation['reason']}")
    
    # Ensure group_key matches
    if group_data.get('group_key') != group_key:
        raise ValueError(f"group_key mismatch: URL has '{group_key}' but data has '{group_data.get('group_key')}'")
    
    # Create directory if it doesn't exist
    group_dir = SEED_BASE_PATH / group_key
    group_dir.mkdir(parents=True, exist_ok=True)
    
    # Write group.json
    group_file = group_dir / 'group.json'
    was_existing = group_file.exists()
    with open(group_file, 'w', encoding='utf-8') as f:
        json.dump(group_data, f, indent=4, ensure_ascii=False)
    
    return {
        'file_path': str(group_file),
        'operation': 'updated' if was_existing else 'created'
    }


def seeds_members_set(group_key: str, member_key: str, member_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create or update member seed data in members.json array.
    
    Args:
        group_key: Group key
        member_key: Member key (used to find/create entry)
        member_data: Member data to save
        
    Returns:
        Dict with file_path and operation info
    """
    # Validate member data
    validation = validate_member(member_data)
    if not validation['valid']:
        raise ValueError(f"Invalid member data: {validation['reason']}")
    
    # Ensure member_key matches
    if member_data.get('member_key') != member_key:
        raise ValueError(f"member_key mismatch: URL has '{member_key}' but data has '{member_data.get('member_key')}'")
    
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        raise FileNotFoundError(f"Group directory does not exist: {group_dir}")
    
    members_file = group_dir / 'members.json'
    
    # Read existing members or create empty array
    if members_file.exists():
        with open(members_file, 'r', encoding='utf-8') as f:
            members_data = json.load(f)
        
        if not isinstance(members_data, list):
            raise ValueError("members.json must contain an array")
    else:
        members_data = []
    
    # Find existing member by key
    existing_index = None
    for i, member in enumerate(members_data):
        if member.get('member_key') == member_key:
            if existing_index is not None:
                raise ValueError(f"Multiple members found with member_key '{member_key}' - key is not unique")
            existing_index = i
    
    # Update or append
    operation = 'updated' if existing_index is not None else 'created'
    if existing_index is not None:
        members_data[existing_index] = member_data
    else:
        members_data.append(member_data)
    
    # Write back to file
    with open(members_file, 'w', encoding='utf-8') as f:
        json.dump(members_data, f, indent=4, ensure_ascii=False)
    
    return {
        'file_path': str(members_file),
        'operation': operation
    }


def seeds_instructions_set(group_key: str, instruction_key: str, instruction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create or update instruction seed data in instructions.json array.
    
    Args:
        group_key: Group key
        instruction_key: Instruction key (used to find/create entry)
        instruction_data: Instruction data to save
        
    Returns:
        Dict with file_path and operation info
    """
    # Validate instruction data
    validation = validate_instruction(instruction_data)
    if not validation['valid']:
        raise ValueError(f"Invalid instruction data: {validation['reason']}")
    
    # Ensure instruction_key matches
    if instruction_data.get('instruction_key') != instruction_key:
        raise ValueError(f"instruction_key mismatch: URL has '{instruction_key}' but data has '{instruction_data.get('instruction_key')}'")
    
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        raise FileNotFoundError(f"Group directory does not exist: {group_dir}")
    
    instructions_file = group_dir / 'instructions.json'
    
    # Read existing instructions or create empty array
    if instructions_file.exists():
        with open(instructions_file, 'r', encoding='utf-8') as f:
            instructions_data = json.load(f)
        
        if not isinstance(instructions_data, list):
            raise ValueError("instructions.json must contain an array")
    else:
        instructions_data = []
    
    # Find existing instruction by key
    existing_index = None
    for i, instruction in enumerate(instructions_data):
        if instruction.get('instruction_key') == instruction_key:
            if existing_index is not None:
                raise ValueError(f"Multiple instructions found with instruction_key '{instruction_key}' - key is not unique")
            existing_index = i
    
    # Update or append
    operation = 'updated' if existing_index is not None else 'created'
    if existing_index is not None:
        instructions_data[existing_index] = instruction_data
    else:
        instructions_data.append(instruction_data)
    
    # Write back to file
    with open(instructions_file, 'w', encoding='utf-8') as f:
        json.dump(instructions_data, f, indent=4, ensure_ascii=False)
    
    return {
        'file_path': str(instructions_file),
        'operation': operation
    }


# ============================================================================
# DELETE Functions
# ============================================================================

def seeds_members_delete(group_key: str, member_key: str) -> Dict[str, Any]:
    """
    Delete member from members.json array.
    
    Args:
        group_key: Group key
        member_key: Member key to delete
        
    Returns:
        Dict with file_path and operation info
    """
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        raise FileNotFoundError(f"Group directory does not exist: {group_dir}")
    
    members_file = group_dir / 'members.json'
    if not members_file.exists():
        raise FileNotFoundError(f"members.json does not exist in {group_dir}")
    
    with open(members_file, 'r', encoding='utf-8') as f:
        members_data = json.load(f)
    
    if not isinstance(members_data, list):
        raise ValueError("members.json must contain an array")
    
    # Find and remove member by key
    found_index = None
    for i, member in enumerate(members_data):
        if member.get('member_key') == member_key:
            if found_index is not None:
                raise ValueError(f"Multiple members found with member_key '{member_key}' - key is not unique")
            found_index = i
    
    if found_index is None:
        raise ValueError(f"Member with member_key '{member_key}' not found")
    
    members_data.pop(found_index)
    
    # Write back to file
    with open(members_file, 'w', encoding='utf-8') as f:
        json.dump(members_data, f, indent=4, ensure_ascii=False)
    
    return {
        'file_path': str(members_file),
        'operation': 'deleted',
        'member_key': member_key
    }


def seeds_instructions_delete(group_key: str, instruction_key: str) -> Dict[str, Any]:
    """
    Delete instruction from instructions.json array.
    
    Args:
        group_key: Group key
        instruction_key: Instruction key to delete
        
    Returns:
        Dict with file_path and operation info
    """
    group_dir = SEED_BASE_PATH / group_key
    if not group_dir.exists():
        raise FileNotFoundError(f"Group directory does not exist: {group_dir}")
    
    instructions_file = group_dir / 'instructions.json'
    if not instructions_file.exists():
        raise FileNotFoundError(f"instructions.json does not exist in {group_dir}")
    
    with open(instructions_file, 'r', encoding='utf-8') as f:
        instructions_data = json.load(f)
    
    if not isinstance(instructions_data, list):
        raise ValueError("instructions.json must contain an array")
    
    # Find and remove instruction by key
    found_index = None
    for i, instruction in enumerate(instructions_data):
        if instruction.get('instruction_key') == instruction_key:
            if found_index is not None:
                raise ValueError(f"Multiple instructions found with instruction_key '{instruction_key}' - key is not unique")
            found_index = i
    
    if found_index is None:
        raise ValueError(f"Instruction with instruction_key '{instruction_key}' not found")
    
    instructions_data.pop(found_index)
    
    # Write back to file
    with open(instructions_file, 'w', encoding='utf-8') as f:
        json.dump(instructions_data, f, indent=4, ensure_ascii=False)
    
    return {
        'file_path': str(instructions_file),
        'operation': 'deleted',
        'instruction_key': instruction_key
    }

