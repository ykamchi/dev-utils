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
    - group_description: string
    """
    if not isinstance(group, dict):
        return {'valid': False, 'reason': 'Group must be a dictionary'}
    
    required_fields = ['group_key', 'group_name', 'group_description']
    for field in required_fields:
        if field not in group:
            return {'valid': False, 'reason': f'Missing required field: {field}'}
        if not isinstance(group[field], str):
            return {'valid': False, 'reason': f'Field {field} must be a string'}
    
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
    - member_key: string
    - roles: array of strings
    - profile: object with required first-level fields:
      - name: string
      - age: integer
      - gender: string
      - location: string
    """
    if not isinstance(member, dict):
        return {'valid': False, 'reason': 'Member must be a dictionary'}
    
    required_fields = ['member_key', 'roles', 'profile']
    for field in required_fields:
        if field not in member:
            return {'valid': False, 'reason': f'Missing required field: {field}'}
    
    if not isinstance(member['member_key'], str):
        return {'valid': False, 'reason': 'member_key must be a string'}
    
    if not isinstance(member['roles'], list):
        return {'valid': False, 'reason': 'roles must be an array'}
    
    if not all(isinstance(role, str) for role in member['roles']):
        return {'valid': False, 'reason': 'All roles must be strings'}
    
    if not isinstance(member['profile'], dict):
        return {'valid': False, 'reason': 'profile must be an object'}
    
    # Validate required profile fields
    required_profile_fields = ['name', 'age', 'gender', 'location']
    for field in required_profile_fields:
        if field not in member['profile']:
            return {'valid': False, 'reason': f'profile must contain a "{field}" field'}
    
    if not isinstance(member['profile']['name'], str):
        return {'valid': False, 'reason': 'profile.name must be a string'}
    
    if not isinstance(member['profile']['age'], int):
        return {'valid': False, 'reason': 'profile.age must be an integer'}
    
    if not isinstance(member['profile']['gender'], str):
        return {'valid': False, 'reason': 'profile.gender must be a string'}
    
    if not isinstance(member['profile']['location'], str):
        return {'valid': False, 'reason': 'profile.location must be a string'}
    
    # Check for unexpected fields at top level
    allowed_fields = set(required_fields)
    unexpected = set(member.keys()) - allowed_fields
    if unexpected:
        return {'valid': False, 'reason': f'Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


def validate_feedback_def(feedback_def: Any) -> Dict[str, Any]:
    """
    Validate feedback_def structure.
    
    feedback_def is an object where each key is a feedback field name,
    and each value has:
    - description: string (required)
    - type: string (required) - "integer" or "string"
    - required: boolean (required)
    - For type="integer": min, max (required)
    - For type="string": optional-values (optional array of strings)
    """
    if not isinstance(feedback_def, dict):
        return {'valid': False, 'reason': 'feedback_def must be an object'}
    
    for field_name, field_def in feedback_def.items():
        if not isinstance(field_def, dict):
            return {'valid': False, 'reason': f'feedback_def.{field_name} must be an object'}
        
        # Define allowed fields based on type
        base_fields = ['description', 'type', 'required']
        
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
    
    Required fields:
    - instruction_key: string
    - name: string
    - description: string
    - conversation_type: string
    - max_turns: integer
    - roles: object (keys are role names, values are role definitions)
    """
    if not isinstance(instruction, dict):
        return {'valid': False, 'reason': 'Instruction must be a dictionary'}
    
    required_fields = ['instruction_key', 'name', 'description', 'conversation_type', 'max_turns', 'roles']
    for field in required_fields:
        if field not in instruction:
            return {'valid': False, 'reason': f'Missing required field: {field}'}
    
    # if not isinstance(instruction['instruction_key'], str):
    #     return {'valid': False, 'reason': 'instruction_key must be a string'}
    
    if not isinstance(instruction['name'], str):
        return {'valid': False, 'reason': 'name must be a string'}
    
    if not isinstance(instruction['description'], str):
        return {'valid': False, 'reason': 'description must be a string'}
    
    if not isinstance(instruction['conversation_type'], str):
        return {'valid': False, 'reason': 'conversation_type must be a string'}
    
    if not isinstance(instruction['max_turns'], int):
        return {'valid': False, 'reason': 'max_turns must be an integer'}
    
    if not isinstance(instruction['roles'], dict):
        return {'valid': False, 'reason': 'roles must be an object'}
    
    # Validate each role
    for role_name, role_def in instruction['roles'].items():
        role_validation = validate_role(role_name, role_def)
        if not role_validation['valid']:
            return role_validation
    
    # Check for unexpected fields
    allowed_fields = set(required_fields)
    unexpected = set(instruction.keys()) - allowed_fields
    if unexpected:
        return {'valid': False, 'reason': f'Unexpected fields: {", ".join(unexpected)}'}
    
    return {'valid': True, 'reason': None}


# ============================================================================
# GET Functions
# ============================================================================

def seeds_groups_get(group_key: Optional[str] = None) -> Any:
    """
    Get group seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Optional group key to filter. If None, returns all groups.
        
    Returns:
        - If group_key is None: List of wrapped group objects with validation metadata
        - If group_key is provided: Single wrapped group object or None if not found
    """
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
            
            # Wrap in metadata structure (like old implementation)
            wrapped_group = {
                'type': 'group',
                'seed_key': group_data.get('group_key'),
                'json': group_data,
                'include': validation['valid'],
                'valid': validation['valid'],
                'error': None if validation['valid'] else f"group.json validation error: {validation['reason']}"
            }
            
            all_groups.append(wrapped_group)
        except (json.JSONDecodeError, IOError) as e:
            # Include invalid entries with error information
            all_groups.append({
                'type': 'group',
                'seed_key': item.name,
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


def seeds_members_get(group_key: str, member_key: Optional[str] = None) -> Any:
    """
    Get members seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Group key (required)
        member_key: Optional member key to filter. If None, returns all members.
        
    Returns:
        - If member_key is None: List containing single wrapped object with all members array
        - If member_key is provided: List containing single wrapped object with single member or empty list if not found
    """
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
            'type': 'members',
            'seed_key': group_key,
            'json': None,
            'include': False,
            'valid': False,
            'error': f'Error reading members.json: {str(e)}'
        }]
    
    if not isinstance(members_data, list):
        return [{
            'type': 'members',
            'seed_key': group_key,
            'json': None,
            'include': False,
            'valid': False,
            'error': 'members.json must contain an array'
        }]
    
    # Validate all members
    all_valid = True
    error_msg = None
    for idx, member in enumerate(members_data):
        validation = validate_member(member)
        if not validation['valid']:
            all_valid = False
            error_msg = f"Member {idx}: {validation['reason']}"
            break
    
    # Filter by member_key if provided
    if member_key is not None:
        matching_members = [m for m in members_data if m.get('member_key') == member_key]
        if len(matching_members) == 0:
            return []
        if len(matching_members) > 1:
            raise ValueError(f"Multiple members found with member_key '{member_key}' - key is not unique")
        
        # Return wrapped structure with single member
        return [{
            'type': 'members',
            'seed_key': group_key,
            'json': matching_members[0],
            'include': all_valid,
            'valid': all_valid,
            'error': error_msg
        }]
    
    # Return wrapped structure with all members
    return [{
        'type': 'members',
        'seed_key': group_key,
        'json': members_data,
        'include': all_valid,
        'valid': all_valid,
        'error': error_msg
    }]


def seeds_instructions_get(group_key: str, instruction_key: Optional[str] = None) -> Any:
    """
    Get instructions seed data from filesystem with validation wrapper.
    
    Args:
        group_key: Group key (required)
        instruction_key: Optional instruction key to filter. If None, returns all instructions.
        
    Returns:
        - List of wrapped instruction objects with validation metadata
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
            'type': 'instruction',
            'seed_key': group_key,
            'json': None,
            'include': False,
            'valid': False,
            'error': f'Error reading instructions.json: {str(e)}'
        }]
    
    if not isinstance(instructions_data, list):
        return [{
            'type': 'instruction',
            'seed_key': group_key,
            'json': None,
            'include': False,
            'valid': False,
            'error': 'instructions.json must contain an array'
        }]
    
    # Wrap each instruction individually with validation metadata
    wrapped_instructions = []
    for instruction in instructions_data:
        validation = validate_instruction(instruction)
        
        wrapped_instruction = {
            'type': 'instruction',
            'seed_key': group_key,
            'json': instruction,
            'include': validation['valid'],
            'valid': validation['valid'],
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


# ============================================================================
# SET Functions (Create or Update)
# ============================================================================

def seeds_groups_set(group_key: str, group_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create or update group seed data on filesystem.
    
    Args:
        group_key: Group key (used for directory name)
        group_data: Group data to save (must include group_key, group_name, group_description)
        
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

