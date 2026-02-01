/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiConversations = window.conversations.apiConversations || {};



window.conversations.apiConversations.conversationAdd = async function (spinnerContainer, groupId, conversationType, instructionsType, participant_members_nick_names, maxMessages) {
    // Show loading spinner while starting conversation
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting conversation for ${participant_members_nick_names.join(', ')}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                conversation_type: conversationType,
                instructions_type: instructionsType,
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
