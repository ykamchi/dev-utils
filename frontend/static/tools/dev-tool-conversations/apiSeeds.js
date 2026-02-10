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
            throw new Error('Failed to fetch groups seed data' + (groupKey ? ' for ' + groupKey : '') + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching groups seed data' + (groupKey ? ' for ' + groupKey : '') + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching groups seed data' + (groupKey ? ' for ' + groupKey : '') + ':', e);
        throw e;
    }
};

// Fetch members seed data from backend (requires group_key, optional member_key - returns array or single object)
window.conversations.apiSeeds.seedsMembersGet = async function (spinnerContainer, groupKey, memberKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading members seed data for ${groupKey}${memberKey ? '/' + memberKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_members_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey, member_key: memberKey })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to fetch members seed data for ' + groupKey + (memberKey ? '/' + memberKey : '') + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching members seed data for ' + groupKey + (memberKey ? '/' + memberKey : '') + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching members seed data for ' + groupKey + (memberKey ? '/' + memberKey : '') + ':', e);
        throw e;
    }
};

// Fetch instructions seed data from backend (requires group_key, optional instruction_key - returns array or single object)
window.conversations.apiSeeds.seedsInstructionsGet = async function (spinnerContainer, groupKey, instructionKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instructions seed data for ${groupKey}${instructionKey ? '/' + instructionKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey, instruction_key: instructionKey })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to fetch instructions seed data for ' + groupKey + (instructionKey ? '/' + instructionKey : '') + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching instructions seed data for ' + groupKey + (instructionKey ? '/' + instructionKey : '') + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching instructions seed data for ' + groupKey + (instructionKey ? '/' + instructionKey : '') + ':', e);
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
        new window.AlertComponent('API Error', 'Error saving group seed data for ' + groupKey + '\nError: ' + (e.message || e.toString()));
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
            throw new Error('Failed to save member seed data for ' + groupKey + '/' + memberKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error saving member seed data for ' + groupKey + '/' + memberKey + '\nError: ' + (e.message || e.toString()));
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
            throw new Error('Failed to save instruction seed data for ' + groupKey + '/' + instructionKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error saving instruction seed data for ' + groupKey + '/' + instructionKey + '\nError: ' + (e.message || e.toString()));
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
            throw new Error('Failed to delete member seed data for ' + groupKey + '/' + memberKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting member seed data for ' + groupKey + '/' + memberKey + '\nError: ' + (e.message || e.toString()));
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
            throw new Error('Failed to delete instruction seed data for ' + groupKey + '/' + instructionKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting instruction seed data for ' + groupKey + '/' + instructionKey + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting instruction seed data for ' + groupKey + '/' + instructionKey + ':', e);
        throw e;
    }
};
