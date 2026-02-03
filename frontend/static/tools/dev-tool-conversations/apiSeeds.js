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

// Fetch members seed data from backend (requires group_key, returns list with single member seed entry)
window.conversations.apiSeeds.seedsMembersGet = async function (spinnerContainer, groupKey) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading members seed data for ${groupKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_members_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to fetch members seed data for ' + groupKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching members seed data for ' + groupKey + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching members seed data for ' + groupKey + ':', e);
        throw e;
    }
};

// Fetch instructions seed data from backend (requires group_key, optional instructions_key)
window.conversations.apiSeeds.seedsInstructionsGet = async function (spinnerContainer, groupKey, instructionsKey = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instructions seed data for ${groupKey}${instructionsKey ? '/' + instructionsKey : ''} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_get', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_key: groupKey, instructions_key: instructionsKey })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to fetch instructions seed data for ' + groupKey + (instructionsKey ? '/' + instructionsKey : '') + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching instructions seed data for ' + groupKey + (instructionsKey ? '/' + instructionsKey : '') + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching instructions seed data for ' + groupKey + (instructionsKey ? '/' + instructionsKey : '') + ':', e);
        throw e;
    }
};

// Save/update group seed data to backend (requires group_key and group JSON, creates/updates group_seed.json)
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

// Save/update instruction seed data to backend (requires group_key, instructions_key, and instruction object with 3 fields)
window.conversations.apiSeeds.seedsInstructionsSet = async function (spinnerContainer, groupKey, instructionsKey, instructionData) {
    // Show loading spinner while saving
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Saving instruction seed data for ${groupKey}/${instructionsKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_set', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                instructions_key: instructionsKey,
                instruction_data: instructionData
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to save instruction seed data for ' + groupKey + '/' + instructionsKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error saving instruction seed data for ' + groupKey + '/' + instructionsKey + '\nError: ' + (e.message || e.toString()));
        console.error('Error saving instruction seed data for ' + groupKey + '/' + instructionsKey + ':', e);
        throw e;
    }
};

// Delete instruction seed data from backend (requires group_key and instructions_key, deletes folder and files)
window.conversations.apiSeeds.seedsInstructionsDelete = async function (spinnerContainer, groupKey, instructionsKey) {
    // Show loading spinner while deleting
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting instruction seed data for ${groupKey}/${instructionsKey} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/seeds_instructions_delete', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_key: groupKey, 
                instructions_key: instructionsKey
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to delete instruction seed data for ' + groupKey + '/' + instructionsKey + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting instruction seed data for ' + groupKey + '/' + instructionsKey + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting instruction seed data for ' + groupKey + '/' + instructionsKey + ':', e);
        throw e;
    }
};
