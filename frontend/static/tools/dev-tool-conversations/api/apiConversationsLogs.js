/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiConversationsLogs = window.conversations.apiConversationsLogs || {};


// Fetch group names from backend
window.conversations.apiConversationsLogs.conversationsLogsList = async function (spinnerContainer, conversationId) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading conversation logs ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_logs_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                conversation_id: conversationId
            })
        }); 

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load conversations logs for conversation ' + conversationId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error getting conversations logs for conversation ' + conversationId + ':', e);
        throw e;
    }
};

window.conversations.apiConversations.conversationAdd = async function (spinnerContainer, groupId, instructionInfo, participants, llmProvider, llmModel) {
    // Show loading spinner while starting conversation
    const participantNames = participants.map(p => p.member_name).join(', ');
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting conversation for ${participantNames}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const requestBody = {
            group_id: groupId,
            info: instructionInfo,
            participants: participants
        };
        
        // Add LLM parameters if provided
        if (llmProvider) {
            requestBody.llm_provider = llmProvider;
        }
        if (llmModel) {
            requestBody.llm_model = llmModel;
        }
        
        const resp = await fetch('/api/dev-tool-conversations/conversations_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
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

window.conversations.apiConversations.conversationPriorityUpdate = async function (spinnerContainer, conversationId, priority) {
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating conversation priority...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversations_priority_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, priority })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to update conversation priority');
        }
    } catch (e) {
        spinner.remove();
        console.error('Error updating conversation priority:', e);
        throw e;
    }
}

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
