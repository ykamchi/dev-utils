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
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to load group instructions for group ' + groupId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error fetching group instructions for ' + groupId + ':', e);
        throw e;
    }
};


// Add group instructions
window.conversations.apiInstructions.instructionsAdd = async function (spinnerContainer, groupId, info, instruction_key) {
    // Show loading spinner while adding instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Adding instructions ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_id: groupId,
                info: info,
                instruction_key: instruction_key
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to add group instructions for ' + groupId);
        }
    } catch (e) {
        spinner.remove();
        console.error('Error adding group instructions for ' + groupId + ':', e);
        throw e;
    }
};


// Delete group instructions
window.conversations.apiInstructions.instructionsDelete = async function (spinnerContainer, instruction_id) {
    // Show loading spinner while deleting instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting instructions for ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instruction_id: instruction_id
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to delete instructions');
        }
    } catch (e) {
        spinner.remove();
        console.error('Error deleting instructions:', e);
        throw e;
    }
};

// Update group instructions
window.conversations.apiInstructions.instructionsUpdate = async function (spinnerContainer, instruction_id, info) {
    // Show loading spinner while updating instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating instructions for ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/instructions_update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instruction_id: instruction_id,
                info: info
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result.data;
        } else {
            new window.conversations.AlertApiErrorComponent(result);
            throw new Error(result.message || 'Failed to update instructions');
        }
    } catch (e) {
        spinner.remove();
        console.error('Error updating instructions:', e);
        throw e;
    }
};

