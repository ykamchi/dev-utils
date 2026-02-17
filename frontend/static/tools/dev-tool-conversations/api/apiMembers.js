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
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load group members for group ' + groupId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching group members for group ' + groupId + ':', e);
        throw e;
    }
};

window.conversations.apiMembers.membersGet = async function (spinnerContainer, memberId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading member details ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: memberId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load member details for member ' + memberId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching member details for member ' + memberId + ':', e);
        throw e;
    }
};

// Add members to group
window.conversations.apiMembers.membersAdd = async function (spinnerContainer, groupId, membersData) {
    // Show loading spinner while adding members
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Adding members ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                members_data: membersData
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to add members to group ' + groupId);
        }
    } catch (e) {
        spinner.remove();
        // new window.AlertComponent('API Error', 'Error adding members to group ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding members to group ' + groupId + ':', e);
        throw e;
    }
};

window.conversations.apiMembers.membersDelete = async function (spinnerContainer, memberId) {
    // Show loading spinner while deleting member
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Deleting member ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_id: memberId
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to delete member ' + memberId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error deleting member ' + memberId + ':', e);
        throw e;
    }
};

window.conversations.apiMembers.membersUpdate = async function (spinnerContainer, memberData) {
    // Show loading spinner while updating member
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Updating member ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_data: memberData
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to update member');
        }
    } catch (e) {
        spinner.remove();
        console.error('Error updating member:', e);
        throw e;
    }
}

// Fetch group names from backend
window.conversations.apiConversations.membersConversationsList = async function (spinnerContainer, groupId, memberName, conversationType = null, onlyLast = false) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading conversations ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members_conversations_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_id: groupId,
                member_name: memberName,
                conversation_type: conversationType,
                only_last: onlyLast
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load conversations for ' + memberName);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error getting conversations for ' + memberName + ':', e);
        throw e;
    }
};

