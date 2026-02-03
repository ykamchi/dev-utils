"""
Seed data extraction and validation utilities for dev-tool-conversations.
Converts file structure into validated seeding data format.
"""

import json
from typing import List, Dict, Any


def extract_groups_seed_data(group_seeds: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Extract and validate group seed data from group_seed.json files.
    
    Args:
        group_seeds: List of objects with keys: group_key, content (raw JSON string from group_seed.json)
        
    Returns:
        List of seed entries with parsed content and validation results
    """
    result = []
    for entry in group_seeds:
        file = {
            'name': 'group_seed.json',
            'content': entry['content']
        }
        
        try:
            group_seed_json = json.loads(file['content'])
            valid = validate_group(group_seed_json)
            result.append({
                'type': 'group',
                'group_key': entry['group_key'],
                'folderName': 'root',
                'json': group_seed_json,
                'file': file,
                'include': valid['valid'],
                'valid': valid['valid'],
                'error': None if valid['valid'] else f"group_seed.json validation error: {valid['reason']}"
            })
        except json.JSONDecodeError:
            result.append({
                'type': 'group',
                'group_key': entry['group_key'],
                'folderName': 'root',
                'json': None,
                'file': file,
                'include': False,
                'valid': False,
                'error': 'Invalid JSON format in group_seed.json.'
            })
        except Exception as err:
            result.append({
                'type': 'group',
                'group_key': entry['group_key'],
                'folderName': 'root',
                'json': None,
                'file': file,
                'include': False,
                'valid': False,
                'error': str(err)
            })
    
    return result


def extract_members_seed_data(members_seed: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Extract and validate members seed data from members_seed.json file.
    
    Args:
        members_seed: Object with keys: group_key, content (raw JSON string from members_seed.json)
        
    Returns:
        List containing a single seed entry with parsed content and validation results
    """
    file = {
        'name': 'members_seed.json',
        'content': members_seed['content']
    }
    
    try:
        members_seed_json = json.loads(file['content'])
        valid = validate_members(members_seed_json)
        return [{
            'type': 'members',
            'group_key': members_seed['group_key'],
            'folderName': 'root',
            'json': members_seed_json,
            'file': file,
            'include': valid['valid'],
            'valid': valid['valid'],
            'error': None if valid['valid'] else f"members_seed.json validation error: {valid['reason']}"
        }]
    except json.JSONDecodeError:
        return [{
            'type': 'members',
            'group_key': members_seed['group_key'],
            'folderName': 'root',
            'json': None,
            'file': file,
            'include': False,
            'valid': False,
            'error': 'Invalid JSON format in members_seed.json.'
        }]
    except Exception as err:
        return [{
            'type': 'members',
            'group_key': members_seed['group_key'],
            'folderName': 'root',
            'json': None,
            'file': file,
            'include': False,
            'valid': False,
            'error': str(err)
        }]


def extract_instructions_seed_data(instructions_seeds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Extract and validate instructions seed data from instructions folders.
    Each instruction consists of 3 files: instructions.md, feedback.json, info.json
    
    Args:
        instructions_seeds: List of objects with keys: 
            - group_key: the group key
            - instructions_key: the folder name (instruction key)
            - instructions_content: content from instructions.md
            - feedback_content: content from feedback.json
            - info_content: content from info.json
        
    Returns:
        List of instruction seed entries with parsed content and validation results
    """
    result = []
    
    for entry in instructions_seeds:
        instruction_file = {
            'name': 'instructions.md',
            'content': entry['instructions_content']
        }
        feedback_file = {
            'name': 'feedback.json',
            'content': entry['feedback_content']
        }
        info_file = {
            'name': 'info.json',
            'content': entry['info_content']
        }
        
        info_json = None
        feedback_json = None
        valid = True
        error = ''
        
        # Validate info.json
        try:
            info_json = json.loads(info_file['content'])
            validation = validate_info(info_json)
            if not validation['valid']:
                valid = False
                error += f"info.json validation error: {validation['reason']}"
        except json.JSONDecodeError:
            valid = False
            error += 'Invalid JSON format in info.json.'
        except Exception as err:
            valid = False
            error += str(err)
        
        # Validate feedback.json
        try:
            feedback_json = json.loads(feedback_file['content'])
            validation = validate_feedback(feedback_json)
            if not validation['valid']:
                valid = False
                error += f" feedback.json validation error: {validation['reason']}"
        except json.JSONDecodeError:
            valid = False
            error += ' Invalid JSON format in feedback.json.'
        except Exception as err:
            valid = False
            error += ' ' + str(err)
        
        # Build the result entry
        if not valid:
            result.append({
                'type': 'instruction',
                'group_key': entry['group_key'],
                'folderName': entry['instructions_key'],
                'json_info': info_json,
                'json_feedback': feedback_json,
                'instructions': instruction_file['content'].replace('\r\n', '\n').replace('\r', '\n'),
                'instruction_file': instruction_file,
                'feedback_file': feedback_file,
                'info_file': info_file,
                'include': False,
                'valid': False,
                'error': error.strip()
            })
        else:
            result.append({
                'type': 'instruction',
                'group_key': entry['group_key'],
                'folderName': entry['instructions_key'],
                'json_info': info_json,
                'json_feedback': feedback_json,
                'instructions': instruction_file['content'].replace('\r\n', '\n').replace('\r', '\n'),
                'instruction_file': instruction_file,
                'feedback_file': feedback_file,
                'info_file': info_file,
                'include': True,
                'valid': True
            })
    
    return result


def validate_group(group: Any) -> Dict[str, Any]:
    """Validate group_seed.json structure."""
    if not isinstance(group, dict):
        return {'valid': False, 'reason': 'Group seed is not an object'}
    
    required_props = ['group_name', 'group_description']
    for prop in required_props:
        if prop not in group:
            return {'valid': False, 'reason': f"Missing required property: {prop}"}
    
    return {'valid': True}


def validate_members(members: Any) -> Dict[str, Any]:
    """Validate members array structure."""
    if not isinstance(members, list):
        return {'valid': False, 'reason': 'Members is not an array'}
    
    required_props = ['name', 'age', 'gender', 'location', 'occupation']
    for member in members:
        if not isinstance(member, dict):
            return {'valid': False, 'reason': 'One or more members are not objects'}
        for prop in required_props:
            if prop not in member:
                return {'valid': False, 'reason': f'One or more members are missing required property: {prop}'}
    
    return {'valid': True}


def validate_info(obj: Any) -> Dict[str, Any]:
    """Validate info.json structure."""
    if not isinstance(obj, dict):
        return {'valid': False, 'reason': 'Root is not an object'}
    
    required_fields = ['name', 'description', 'conversation_type']
    for field in required_fields:
        if field not in obj:
            return {'valid': False, 'reason': f"Missing '{field}' property"}
    
    return {'valid': True}


def validate_feedback(obj: Any) -> Dict[str, Any]:
    """Validate feedback.json structure."""
    if not isinstance(obj, dict):
        return {'valid': False, 'reason': 'Root is not an object'}
    
    for key, entry in obj.items():
        if not isinstance(entry, dict):
            return {'valid': False, 'reason': f"Key '{key}' is not an object"}
        
        # Check mandatory fields
        if 'description' not in entry or 'type' not in entry or 'required' not in entry:
            return {'valid': False, 'reason': f"Key '{key}' missing description, type, or required"}
        
        # Define allowed fields based on type
        allowed_fields = {'description', 'type', 'required'}
        
        # Logic for integers
        if entry['type'] == 'integer':
            if 'min' not in entry or 'max' not in entry:
                return {'valid': False, 'reason': f"Integer '{key}' missing min or max"}
            allowed_fields.update({'min', 'max'})
        
        # Logic for strings
        elif entry['type'] == 'string':
            if 'optional-values' not in entry or not isinstance(entry['optional-values'], list):
                return {'valid': False, 'reason': f"'optional-values' in '{key}' must be an array"}
            
            # Check all values are strings
            if not all(isinstance(val, str) for val in entry['optional-values']):
                return {'valid': False, 'reason': f"All 'optional-values' in '{key}' must be strings"}
            allowed_fields.add('optional-values')
        else:
            return {'valid': False, 'reason': f"Key '{key}' has unsupported type '{entry['type']}'"}
        
        # Check for unexpected fields
        actual_fields = set(entry.keys())
        unexpected_fields = actual_fields - allowed_fields
        if unexpected_fields:
            return {'valid': False, 'reason': f"Key '{key}' has unexpected fields: {', '.join(sorted(unexpected_fields))}"}
    
    return {'valid': True}


# High-level seed API functions
# These functions encapsulate the complete logic for seed operations

def seeds_groups_get(group_key: str = None) -> List[Dict[str, Any]]:
    """
    Get group seed data from all directories in ~/code/conversations-examples.
    Each directory should contain a group_seed.json file.
    
    Args:
        group_key: Optional group key to filter to specific group
        
    Returns:
        List of group seed entries with validation results
    """
    import os
    
    seed_root = os.path.expanduser('~/code/conversations-examples')
    if not os.path.exists(seed_root):
        return []
    
    # Scan only first level directories
    group_seeds = []
    for entry in os.scandir(seed_root):
        if entry.is_dir() and entry.name != '.git' and (not group_key or entry.name == group_key):
            # Check for group_seed.json in this directory
            group_seed_file = os.path.join(entry.path, 'group_seed.json')
            content = ''
            if os.path.exists(group_seed_file):
                try:
                    with open(group_seed_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                except Exception:
                    content = ''
            
            group_seeds.append({
                'group_key': entry.name,
                'content': content
            })
    
    # Process and validate the group seeds
    return extract_groups_seed_data(group_seeds)


def seeds_members_get(group_key: str) -> List[Dict[str, Any]]:
    """
    Get members seed data from a specific group directory in ~/code/conversations-examples.
    The directory should contain a members_seed.json file.
    
    Args:
        group_key: Required group key
        
    Returns:
        List with single member seed entry with validation results, or empty list if not found
    """
    import os
    
    seed_root = os.path.expanduser('~/code/conversations-examples')
    if not os.path.exists(seed_root):
        return []
    
    # Check for members_seed.json in the group directory
    group_dir = os.path.join(seed_root, group_key)
    if not os.path.isdir(group_dir):
        return []
    
    members_seed_file = os.path.join(group_dir, 'members_seed.json')
    if not os.path.exists(members_seed_file):
        return []
    
    # Read the file content
    content = ''
    try:
        with open(members_seed_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        content = ''
    
    members_seed = {
        'group_key': group_key,
        'content': content
    }
    
    # Process and validate the members seed
    return extract_members_seed_data(members_seed)


def seeds_instructions_get(group_key: str, instructions_key: str = None) -> List[Dict[str, Any]]:
    """
    Get instructions seed data from a specific group directory in ~/code/conversations-examples.
    Instructions are located in [group_key]/instructions/[instructions_key]/ folders.
    Each instruction folder contains: instructions.md, feedback.json, info.json
    
    Args:
        group_key: Required group key
        instructions_key: Optional instruction key to filter to specific instruction
        
    Returns:
        List of instruction seed entries with validation results
    """
    import os
    
    seed_root = os.path.expanduser('~/code/conversations-examples')
    if not os.path.exists(seed_root):
        return []
    
    # Check for instructions directory in the group
    instructions_dir = os.path.join(seed_root, group_key, 'instructions')
    if not os.path.isdir(instructions_dir):
        return []
    
    # Scan instruction folders
    instructions_seeds = []
    for entry in os.scandir(instructions_dir):
        if entry.is_dir():
            # Filter by instructions_key if provided
            if instructions_key and entry.name != instructions_key:
                continue
            
            # Read the three required files
            instructions_file = os.path.join(entry.path, 'instructions.md')
            feedback_file = os.path.join(entry.path, 'feedback.json')
            info_file = os.path.join(entry.path, 'info.json')
            
            # Check if all three files exist
            if not (os.path.exists(instructions_file) and 
                    os.path.exists(feedback_file) and 
                    os.path.exists(info_file)):
                continue
            
            # Read file contents
            instructions_content = ''
            feedback_content = ''
            info_content = ''
            
            try:
                with open(instructions_file, 'r', encoding='utf-8') as f:
                    instructions_content = f.read()
            except Exception:
                instructions_content = ''
            
            try:
                with open(feedback_file, 'r', encoding='utf-8') as f:
                    feedback_content = f.read()
            except Exception:
                feedback_content = ''
            
            try:
                with open(info_file, 'r', encoding='utf-8') as f:
                    info_content = f.read()
            except Exception:
                info_content = ''
            
            instructions_seeds.append({
                'group_key': group_key,
                'instructions_key': entry.name,
                'instructions_content': instructions_content,
                'feedback_content': feedback_content,
                'info_content': info_content
            })
    
    # Process and validate the instructions seeds
    return extract_instructions_seed_data(instructions_seeds)


def seeds_groups_set(group_key: str, group_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save/update group seed data to filesystem.
    Creates or overwrites group_seed.json in ~/code/conversations-examples/{group_key}/
    
    Args:
        group_key: Required group key
        group_data: Group data to save
        
    Returns:
        Dictionary with file path and group_key
    """
    import os
    
    # Create directory path
    group_dir = os.path.expanduser(os.path.join('~/code/conversations-examples', group_key))
    os.makedirs(group_dir, exist_ok=True)
    
    # Write group_seed.json
    group_seed_file = os.path.join(group_dir, 'group_seed.json')
    with open(group_seed_file, 'w', encoding='utf-8') as f:
        json.dump(group_data, f, indent=2, ensure_ascii=False)
    
    return {
        'file': group_seed_file,
        'group_key': group_key
    }


def seeds_instructions_set(group_key: str, instructions_key: str, instruction_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save/update instruction seed data to filesystem.
    Creates or overwrites instructions.md, feedback.json, and info.json files.
    
    Args:
        group_key: Required group key
        instructions_key: Required instruction key
        instruction_data: Dictionary with keys: instructions, feedback, info
        
    Returns:
        Dictionary with directory path, files created, group_key, and instructions_key
    """
    import os
    
    # Create directory path
    instruction_dir = os.path.expanduser(
        os.path.join('~/code/conversations-examples', group_key, 'instructions', instructions_key)
    )
    os.makedirs(instruction_dir, exist_ok=True)
    
    # Write instructions.md
    instructions_file = os.path.join(instruction_dir, 'instructions.md')
    with open(instructions_file, 'w', encoding='utf-8') as f:
        f.write(instruction_data['instructions'])
    
    # Write feedback.json
    feedback_file = os.path.join(instruction_dir, 'feedback.json')
    with open(feedback_file, 'w', encoding='utf-8') as f:
        json.dump(instruction_data['feedback_def'], f, indent=2, ensure_ascii=False)
    
    # Write info.json
    info_file = os.path.join(instruction_dir, 'info.json')
    with open(info_file, 'w', encoding='utf-8') as f:
        json.dump(instruction_data['info'], f, indent=2, ensure_ascii=False)
    
    return {
        'directory': instruction_dir,
        'files_created': ['instructions.md', 'feedback.json', 'info.json'],
        'group_key': group_key,
        'instructions_key': instructions_key
    }


def seeds_instructions_delete(group_key: str, instructions_key: str) -> Dict[str, Any]:
    """
    Delete instruction seed data from filesystem.
    Removes the entire directory: ~/code/conversations-examples/{group_key}/instructions/{instructions_key}/
    
    Args:
        group_key: Required group key
        instructions_key: Required instruction key
        
    Returns:
        Dictionary with deleted directory path, group_key, and instructions_key
    """
    import os
    import shutil
    
    # Build directory path
    instruction_dir = os.path.expanduser(
        os.path.join('~/code/conversations-examples', group_key, 'instructions', instructions_key)
    )
    
    # Check if directory exists
    if os.path.exists(instruction_dir):
        # Remove the entire directory
        shutil.rmtree(instruction_dir)
        deleted = True
    else:
        deleted = False
    
    return {
        'directory': instruction_dir,
        'group_key': group_key,
        'instructions_key': instructions_key,
        'deleted': deleted
    }
