/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiConversations = window.conversations.apiConversations || {};


// Fetch group names from backend
window.conversations.apiConversations.conversationsList = async function (spinnerContainer, groupId, memberName, conversationType = null, onlyLast = false) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading conversations ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    // Fetch conversations from API
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_id: groupId,
                member_nick_name: memberName,
                conversation_type: conversationType,
                only_last: onlyLast
            })
        });

        const result = await resp.json();
        if (result.success) {
            spinner.remove();
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to load conversations for ' + memberName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error getting conversations for ' + memberName + '.' + '\nError: ' + (e.message || e.toString()));
        console.error('Error getting conversations:', e);
        throw e;
    }
};


window.conversations.apiConversations.conversationAdd = async function (spinnerContainer, groupId, conversationType, selectedInstruction, participant_members_nick_names, maxMessages) {
    // Show loading spinner while starting conversation
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting conversation for ${participant_members_nick_names.join(', ')}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversation_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                conversation_type: conversationType,
                context: { type: selectedInstruction },
                participant_members_nick_names: participant_members_nick_names,
                max_messages: maxMessages,
                debug: ['instructions_assistance']
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to start conversation for group ' + groupId + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error starting conversation for ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error starting conversation for ' + groupId + ':', e);
        throw e;
    }
};

window.conversations.apiConversations.fetchConversationMessages = async function (spinnerContainer, conversationType, conversationId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading conversation messages ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/conversation_messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_type: conversationType, conversation_id: conversationId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error('Failed to fetch conversation messages: ' + (result.error || 'Unknown error'));
        }
    }
    catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching conversation messages.\nError: ' + (e.message || e.toString()));
        console.error('Error fetching conversation messages:', e);
        throw e;
    }
}
