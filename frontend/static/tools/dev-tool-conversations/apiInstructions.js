/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiInstructions = window.conversations.apiInstructions || {};



// Fetch group instructions from backend
window.conversations.apiInstructions.instructionsList = async function (spinnerContainer, groupId, conversationType = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instructions definitions ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                conversation_type: conversationType
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && typeof result.data === 'object') {
            return result.data;
        } else {
            throw new Error('Failed to load group instructions for group ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group instructions for ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group instructions for ' + groupId + ':', e);
        throw e;
    }
};


// Add group instructions
window.conversations.apiInstructions.instructionsAdd = async function (spinnerContainer, instructions_key, groupId, instructions, feedbackDef, info) {
    // Show loading spinner while adding instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Adding instructions ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                instructions: instructions,
                feedback_def: feedbackDef,
                info: info,
                instructions_key: instructions_key
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to add group instructions for ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding group instructions for ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding group instructions for ' + groupId + ':', e);
        throw e;
    }
};


// Delete group instructions
window.conversations.apiInstructions.instructionsDelete = async function (spinnerContainer, groupId, instructionsKey) {
    // Show loading spinner while deleting instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting instructions for ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                instructions_key: instructionsKey
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to delete group instructions for ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting instructions for ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting group instructions for ' + groupId + ':', e);
        throw e;
    }
};

// Update group instructions
window.conversations.apiInstructions.instructionsUpdate = async function (spinnerContainer, groupId, instructionsKey, instructions, feedbackDef, info) {
    // Show loading spinner while updating instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating instructions for ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                instructions_key: instructionsKey,
                instructions: instructions,
                feedback_def: feedbackDef,
                info: info
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to update group instructions for ' + groupId + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error updating group instructions for ' + groupId + '\nError: ' + (e.message || e.toString()));
        console.error('Error updating group instructions for ' + groupId + ':', e);
        throw e;
    }
};

