/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiMembers = window.conversations.apiMembers || {};


// Fetch group members from backend
window.conversations.apiMembers.membersList = async function (spinnerContainer, groupId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading members ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_id: groupId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to load group members for group ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group members for ' + groupId + '\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error fetching group members for ' + groupId + ':', e);
        throw e;
    }

};


// Add members to group
window.conversations.apiMembers.membersAdd = async function (spinnerContainer, groupId, membersProfiles) {
    // Show loading spinner while adding members
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Adding members ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                members_profiles: membersProfiles
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            throw new Error('Failed to add members to group ' + groupId + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding members to group ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding members to group ' + groupId + ':', e);
        throw e;
    }
};
