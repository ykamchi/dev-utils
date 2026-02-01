/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.system_api = window.conversations.system_api || {};

// Fetch the current queue state from the backend API
window.conversations.system_api.fetchQueueState = async function (spinnerContainer) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Getting queue state ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/status_queue_state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && typeof result.data === 'object') {
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to load queue state: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching queue state\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error fetching queue state:', e);
        throw e;
    }

};

window.conversations.system_api.queuePause = async function (spinnerContainer) {
    // Show loading spinner while pausing
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: ' Pausing queue ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/status_queue_pause', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            spinner.remove();
            throw new Error('Failed to pause queue: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error pausing queue\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error pausing queue:', e);
        throw e;
    }
};

window.conversations.system_api.queueResume = async function (spinnerContainer) {
    // Show loading spinner while resuming
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: ' Resuming queue ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/status_queue_resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return;
        } else {
            spinner.remove();
            throw new Error('Failed to resume queue: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error resuming queue\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error resuming queue:', e);
        throw e;
    }
};

window.conversations.system_api.fetchStatusConversationTimeline = async function (container, hours_back, interval, groupId, conversation_type, instruction_type, states, aggregation_level_0, aggregation_level_1) {
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
        if (instruction_type) body['instruction_type'] = instruction_type;
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
            spinner.remove();
            throw new Error('Failed to load conversation timeline: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching conversation timeline\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error fetching conversation timeline:', e);
        throw e;
    }

};

