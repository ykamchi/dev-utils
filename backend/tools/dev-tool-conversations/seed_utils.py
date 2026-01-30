"""
Seed data extraction and validation utilities for dev-tool-conversations.
Converts file structure into validated seeding data format.
"""

import json
from typing import List, Dict, Any, Optional


def extract_groups_seed_data(seeds: List[Dict[str, str]]) -> List[Dict[str, Any]]:
    """
    Extract and validate group seed data.
    
    Args:
        seeds: List of seed objects with keys: group_name, content
        
    Returns:
        List of seed entries with parsed content and validation results
    """
    result = []
    for entry in seeds:
        entry['valid'] = True
        entry['error'] = ''
        try:
            entry['fileContent'] = json.loads(entry['content']) if entry.get('content') else {}
        except json.JSONDecodeError:
            entry['valid'] = False
            entry['error'] = 'Invalid JSON content'
            entry['fileContent'] = {}
        except Exception as e:
            entry['valid'] = False
            entry['error'] = str(e)
            entry['fileContent'] = {}
        result.append(entry)
    return result


def extract_seed_data(files: List[Dict[str, Any]], instruction_type_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Extract and validate seed data from file list.
    
    Args:
        files: List of file objects with keys: name, webkitRelativePath, content
        instruction_type_filter: Optional instruction type to filter by (e.g., 'first-date')
        
    Returns:
        List of seeding data entries with validation results
    """
    seeding_data = []
    instructions_seeds = {}
    
    for file in files:
        path_parts = file['webkitRelativePath'].split('/')
        
        # 1. Check for root members_seed.json
        if len(path_parts) == 2 and file['name'] == 'members_seed.json':
            # Skip members file if filtering by instruction type
            if instruction_type_filter:
                continue
                
            try:
                members_seed_json = json.loads(file['content'])
                valid = validate_members(members_seed_json)
                seeding_data.insert(0, {
                    'type': 'members',
                    'folderName': 'root',
                    'file': file,
                    'include': valid['valid'],
                    'valid': valid['valid'],
                    'error': None if valid['valid'] else f"members_seed.json validation error: {valid['reason']}"
                })
                continue
            except json.JSONDecodeError as err:
                seeding_data.insert(0, {
                    'type': 'members',
                    'folderName': 'root',
                    'file': file,
                    'include': False,
                    'valid': False,
                    'error': 'Invalid JSON format in members_seed.json.'
                })
                continue
            except Exception as err:
                seeding_data.insert(0, {
                    'type': 'members',
                    'folderName': 'root',
                    'file': file,
                    'include': False,
                    'valid': False,
                    'error': str(err)
                })
                continue
        
        # 2. Check for files inside instructions/ folder
        if len(path_parts) == 4 and path_parts[1] == 'instructions':
            folder_name = path_parts[-2]
            
            if instruction_type_filter and folder_name != instruction_type_filter:
                continue

            # Initialize folder entry if not exists
            if folder_name not in instructions_seeds:
                instructions_seeds[folder_name] = {
                    'instructions': None,
                    'feedback': None,
                    'info': None
                }
            
            # Assign files to their respective slots
            if file['name'] == 'instructions.md':
                instructions_seeds[folder_name]['instructions'] = file
            elif file['name'] == 'feedback.json':
                instructions_seeds[folder_name]['feedback'] = file
            elif file['name'] == 'info.json':
                instructions_seeds[folder_name]['info'] = file
            
            # If all three files are present, validate and add to seeding_data
            if (instructions_seeds[folder_name]['instructions'] and 
                instructions_seeds[folder_name]['feedback'] and 
                instructions_seeds[folder_name]['info']):
                
                # Validate info.json
                try:
                    info_json = json.loads(instructions_seeds[folder_name]['info']['content'])
                    valid = validate_info(info_json)
                    if not valid['valid']:
                        seeding_data.append({
                            'type': 'instruction',
                            'folderName': folder_name,
                            'instruction_file': instructions_seeds[folder_name]['instructions'],
                            'feedback_file': instructions_seeds[folder_name]['feedback'],
                            'info_file': instructions_seeds[folder_name]['info'],
                            'include': False,
                            'valid': False,
                            'error': f"info.json validation error: {valid['reason']}"
                        })
                        del instructions_seeds[folder_name]
                        continue
                except json.JSONDecodeError:
                    seeding_data.append({
                        'type': 'instruction',
                        'folderName': folder_name,
                        'instruction_file': instructions_seeds[folder_name]['instructions'],
                        'feedback_file': instructions_seeds[folder_name]['feedback'],
                        'info_file': instructions_seeds[folder_name]['info'],
                        'include': False,
                        'valid': False,
                        'error': 'Invalid JSON format in info.json.'
                    })
                    del instructions_seeds[folder_name]
                    continue
                except Exception as err:
                    seeding_data.append({
                        'type': 'instruction',
                        'folderName': folder_name,
                        'instruction_file': instructions_seeds[folder_name]['instructions'],
                        'feedback_file': instructions_seeds[folder_name]['feedback'],
                        'info_file': instructions_seeds[folder_name]['info'],
                        'include': False,
                        'valid': False,
                        'error': str(err)
                    })
                    del instructions_seeds[folder_name]
                    continue
                
                # Validate feedback.json
                try:
                    feedback_json = json.loads(instructions_seeds[folder_name]['feedback']['content'])
                    valid = validate_feedback(feedback_json)
                    if not valid['valid']:
                        seeding_data.append({
                            'type': 'instruction',
                            'folderName': folder_name,
                            'instruction_file': instructions_seeds[folder_name]['instructions'],
                            'feedback_file': instructions_seeds[folder_name]['feedback'],
                            'info_file': instructions_seeds[folder_name]['info'],
                            'include': False,
                            'valid': False,
                            'error': f"feedback.json validation error: {valid['reason']}"
                        })
                        del instructions_seeds[folder_name]
                        continue
                except json.JSONDecodeError:
                    seeding_data.append({
                        'type': 'instruction',
                        'folderName': folder_name,
                        'instruction_file': instructions_seeds[folder_name]['instructions'],
                        'feedback_file': instructions_seeds[folder_name]['feedback'],
                        'info_file': instructions_seeds[folder_name]['info'],
                        'include': False,
                        'valid': False,
                        'error': 'Invalid JSON format in feedback.json.'
                    })
                    del instructions_seeds[folder_name]
                    continue
                except Exception as err:
                    seeding_data.append({
                        'type': 'instruction',
                        'folderName': folder_name,
                        'instruction_file': instructions_seeds[folder_name]['instructions'],
                        'feedback_file': instructions_seeds[folder_name]['feedback'],
                        'info_file': instructions_seeds[folder_name]['info'],
                        'include': False,
                        'valid': False,
                        'error': str(err)
                    })
                    del instructions_seeds[folder_name]
                    continue
                
                # If we reach here, all files are valid
                seeding_data.append({
                    'type': 'instruction',
                    'folderName': folder_name,
                    # 'instructionType': info_json['type'],
                    'instruction_file': instructions_seeds[folder_name]['instructions'],
                    'feedback_file': instructions_seeds[folder_name]['feedback'],
                    'info_file': instructions_seeds[folder_name]['info'],
                    'include': True,
                    'valid': True
                })
                del instructions_seeds[folder_name]
    
    # Add any incomplete instruction folders as invalid entries
    for folder_name, files in instructions_seeds.items():
        seeding_data.append({
            'type': 'instruction',
            'folderName': folder_name,
            'instruction_file': files['instructions'],
            'feedback_file': files['feedback'],
            'info_file': files['info'],
            'include': False,
            'valid': False
        })
    
    return seeding_data


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
        # Check mandatory fields
        if 'description' not in entry or 'type' not in entry or 'required' not in entry:
            return {'valid': False, 'reason': f"Key '{key}' missing description, type, or required"}
        
        # Logic for integers
        if entry['type'] == 'integer':
            if 'min' not in entry or 'max' not in entry:
                return {'valid': False, 'reason': f"Integer '{key}' missing min or max"}
        
        # Logic for strings
        elif entry['type'] == 'string':
            if 'optional-values' not in entry or not isinstance(entry['optional-values'], list):
                return {'valid': False, 'reason': f"'optional-values' in '{key}' must be an array"}
            
            # Check all values are strings
            if not all(isinstance(val, str) for val in entry['optional-values']):
                return {'valid': False, 'reason': f"All 'optional-values' in '{key}' must be strings"}
    
    return {'valid': True}
