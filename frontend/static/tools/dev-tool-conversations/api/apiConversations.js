/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiConversations = window.conversations.apiConversations || {};



window.conversations.apiConversations.conversationAdd = async function (spinnerContainer, groupId, instructionInfo, participants) {
    // Show loading spinner while starting conversation
    const participantNames = participants.map(p => p.member_name).join(', ');
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting conversation for ${participantNames}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                info: instructionInfo,
                participants: participants
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to start conversation for group ' + groupId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error starting conversation for ' + groupId + ':', e);
        throw e;
    }
};

window.conversations.apiConversations.conversationsMessages = async function (spinnerContainer, conversationId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading conversation messages ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_messages_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && Array.isArray(result.data)) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to fetch conversation messages');
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching conversation messages:', e);
        throw e;
    }
}
