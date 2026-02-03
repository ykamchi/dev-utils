/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiGroups = window.conversations.apiGroups || {};


// Fetch group names from backend
window.conversations.apiGroups.groupsList = async function (spinnerContainer) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading groups ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    // Fetch group names from API
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        if (result.success) {
            spinner.remove();
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to load group names: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error getting group names.' + '\nError: ' + (e.message || e.toString()));
        console.error('Error getting group names:', e);
        throw e;
    }
};


window.conversations.apiGroups.groupsGet = async function (spinnerContainer, groupId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading group ${groupId} ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    // Fetch group details from API
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups_get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: groupId })
        });

        const result = await resp.json();
        if (result.success) {
            spinner.remove();
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to load group ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error getting group ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error getting group ' + groupId + ':', e);
        throw e;
    }
}


// Add new group
window.conversations.apiGroups.groupsAdd = async function (spinnerContainer, groupKey, groupName, groupDescription) {
    // Show loading spinner while adding group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Adding group ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_key: groupKey,
                group_name: groupName,
                group_description: groupDescription
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to add group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding group ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding group ' + groupName + ':', e);
        throw e;
    }
};

// Delete group
window.conversations.apiGroups.groupsDelete = async function (spinnerContainer, groupId, groupName = 'N/A') {
    // Show loading spinner while deleting group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting group ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to delete group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting group ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting group ' + groupName + ':', e);
        throw e;
    }
};

// Update group
window.conversations.apiGroups.groupsUpdate = async function (spinnerContainer, groupId, groupName, groupDescription, oldGroupName = 'N/A') {
    // Show loading spinner while updating group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating group ${oldGroupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                group_name: groupName,
                group_description: groupDescription
            })
        });

        spinner.remove();
        const result = await resp.json();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to update group ' + oldGroupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error updating group ' + oldGroupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error updating group ' + oldGroupName + ':', e);
        throw e;
    }
};
