/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.system_api = window.conversations.system_api || {};

// Fetch the current queue state from the backend API
// This API is proprietary to system settings and doesn't follow standard conventions
// Returns: queue state object when available, or { status: 'unavailable' } when not
window.conversations.system_api.queueState = async function (spinnerContainer) {
    const resp = await fetch('/api/dev-tool-conversations/queue_state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    const result = await resp.json();
    if (result.success && result.data && typeof result.data === 'object') {
        return result.data;
    } else {
        throw new Error(result.message || 'Failed to load queue state');
    }
};

window.conversations.system_api.queuePause = async function (spinnerContainer) {
    // Show loading spinner while pausing
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: ' Pausing queue ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/queue_pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to pause queue');
        }

    } catch (e) {
        spinner.remove();
        console.error('Error pausing queue:', e);
        throw e;
    }
};

window.conversations.system_api.queueResume = async function (spinnerContainer) {
    // Show loading spinner while resuming
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: ' Resuming queue ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/queue_resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to resume queue');
        }

    } catch (e) {
        spinner.remove();
        console.error('Error resuming queue:', e);
        throw e;
    }
};

window.conversations.system_api.fetchStatusConversationTimeline = async function (container, hours_back, interval, groupId, conversation_type, instructions_key, states, aggregation_level_0, aggregation_level_1) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(container, { text: 'Getting conversation timeline ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        body = {
            hours_back: hours_back,
            interval: interval
        }

        // Add optional parameters if provided
        if (groupId) body['group_id'] = groupId;
        if (conversation_type) body['conversation_type'] = conversation_type;
        if (instructions_key) body['instructions_key'] = instructions_key;
        if (states && Array.isArray(states) && states.length > 0) body['states'] = states;
        if (aggregation_level_0) {
            body['aggregation_levels'] = [aggregation_level_0];
            if (aggregation_level_1) body['aggregation_levels'].push(aggregation_level_1);
        }
        

        const resp = await fetch('/api/dev-tool-conversations/status_conversation_timeline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && typeof result.data === 'object') {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load conversation timeline');
        }

    } catch (e) {
        spinner.remove();
        console.error('Error fetching conversation timeline:', e);
        throw e;
    }

};

window.conversations.system_api.queueConversationsStop = async function (spinnerContainer, conversationId) {
    // Show loading spinner while stopping
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Stopping conversation ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/queue_conversations_stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to stop conversation');
        }

    } catch (e) {
        spinner.remove();
        console.error('Error stopping conversation:', e);
        throw e;
    }
};

window.conversations.system_api.queueConversationsResume = async function (spinnerContainer, conversationId) {
    // Show loading spinner while resuming
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Resuming conversation ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/queue_conversations_resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to resume conversation');
        }

    } catch (e) {
        spinner.remove();
        console.error('Error resuming conversation:', e);
        throw e;
    }
};
