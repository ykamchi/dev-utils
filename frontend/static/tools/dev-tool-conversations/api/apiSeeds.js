/*
    API functions for conversation seed data management
*/
window.conversations = window.conversations || {};
window.conversations.apiSeeds = window.conversations.apiSeeds || {}

// Fetch groups seed data from backend (returns list of group seed entries with validation)
window.conversations.apiSeeds.seedsGroupsGet = async function (spinnerContainer, groupKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading groups seed data${groupKey ? ' for ' + groupKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_groups_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to fetch groups seed data' + (groupKey ? ' for ' + groupKey : ''));
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching groups seed data' + (groupKey ? ' for ' + groupKey : '') + ':', e);
        throw e;
    }
};

// Fetch members seed data from backend (group: group object or null for templates, memberKey: filter by specific member or null for all)
window.conversations.apiSeeds.seedsMembersGet = async function (spinnerContainer, group, memberKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading members seed data for ${group?.group_key || 'templates'}${memberKey ? '/' + memberKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const payload = {};
        if (group) {
            payload.group_key = group.group_key;
            payload.group_id = group.group_id;
        } else {
            payload.group_key = 'templates';
        }
        if (memberKey !== null) {
            payload.member_key = memberKey;
        }
        
        const resp = await fetch('/api/dev-tool-conversations/seeds_members_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to fetch members seed data for ' + (group?.group_key || 'templates') + (memberKey ? '/' + memberKey : ''));
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching members seed data for ' + (group?.group_key || 'templates') + (memberKey ? '/' + memberKey : '') + ':', e);
        throw e;
    }
};

// Fetch instructions seed data from backend (group: group object or null for templates, instructionKey: filter by specific instruction or null for all)
window.conversations.apiSeeds.seedsInstructionsGet = async function (spinnerContainer, group, instructionKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instructions seed data for ${group?.group_key || 'templates'}${instructionKey ? '/' + instructionKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const payload = {};
        if (group) {
            payload.group_key = group.group_key;
            payload.group_id = group.group_id;
        } else {
            payload.group_key = 'templates';
        }
        if (instructionKey !== null) {
            payload.instruction_key = instructionKey;
        }
        
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to fetch instructions seed data for ' + (group?.group_key || 'templates') + (instructionKey ? '/' + instructionKey : ''));
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching instructions seed data for ' + (group?.group_key || 'templates') + (instructionKey ? '/' + instructionKey : '') + ':', e);
        throw e;
    }
};

// Fetch instruction roles seed data from backend (group: group object or null for templates)
// Returns all roles from all instructions as a flat array
window.conversations.apiSeeds.seedsInstructionsRolesGet = async function (spinnerContainer, group) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instruction roles seed data for ${group?.group_key || 'templates'} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const payload = {};
        if (group) {
            payload.group_key = group.group_key;
        } else {
            payload.group_key = 'templates';
        }
        
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_roles_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to fetch instruction roles seed data for ' + (group?.group_key || 'templates'));
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching instruction roles seed data for ' + (group?.group_key || 'templates') + ':', e);
        throw e;
    }
};

// Save/update group seed data to backend (requires group_key and group JSON, creates/updates group.json)
window.conversations.apiSeeds.seedsGroupsSet = async function (spinnerContainer, groupKey, groupData) {
    // Show loading spinner while saving
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Saving group seed data for ${groupKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_groups_set', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey, group_data: groupData })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to save group seed data for ' + groupKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        console.error('Error saving group seed data for ' + groupKey + ':', e);
        throw e;
    }
};

// Save/update member seed data to backend (requires group_key, member_key, and member object - creates/updates in members.json array)
window.conversations.apiSeeds.seedsMembersSet = async function (spinnerContainer, groupKey, memberKey, memberData) {
    // Show loading spinner while saving
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Saving member seed data for ${groupKey}/${memberKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_members_set', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                member_key: memberKey,
                member_data: memberData
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to save member seed data for ' + groupKey + '/' + memberKey);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error saving member seed data for ' + groupKey + '/' + memberKey + ':', e);
        throw e;
    }
};

// Save/update instruction seed data to backend (requires group_key, instruction_key, and instruction object - creates/updates in instructions.json array)
window.conversations.apiSeeds.seedsInstructionsSet = async function (spinnerContainer, groupKey, instructionKey, instructionData) {
    // Show loading spinner while saving
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Saving instruction seed data for ${groupKey}/${instructionKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_set', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                instruction_key: instructionKey,
                instruction_data: instructionData
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to save instruction seed data for ' + groupKey + '/' + instructionKey);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error saving instruction seed data for ' + groupKey + '/' + instructionKey + ':', e);
        throw e;
    }
};

// Delete member seed data from backend (requires group_key and member_key - removes from members.json array)
window.conversations.apiSeeds.seedsMembersDelete = async function (spinnerContainer, groupKey, memberKey) {
    // Show loading spinner while deleting
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting member seed data for ${groupKey}/${memberKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_members_delete', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                member_key: memberKey
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to delete member seed data for ' + groupKey + '/' + memberKey);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error deleting member seed data for ' + groupKey + '/' + memberKey + ':', e);
        throw e;
    }
};

// Delete instruction seed data from backend (requires group_key and instruction_key - removes from instructions.json array)
window.conversations.apiSeeds.seedsInstructionsDelete = async function (spinnerContainer, groupKey, instructionKey) {
    // Show loading spinner while deleting
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting instruction seed data for ${groupKey}/${instructionKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_delete', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                instruction_key: instructionKey
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to delete instruction seed data for ' + groupKey + '/' + instructionKey);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error deleting instruction seed data for ' + groupKey + '/' + instructionKey + ':', e);
        throw e;
    }
};
