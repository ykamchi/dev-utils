/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.api = window.conversations.api || {};

// Fetch group members from backend
window.conversations.api.fetchMembers = async function (group_name) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: group_name })
        });

        const result = await resp.json();
        if (result.success && result.members && typeof result.members === 'object') {
            return result.members;
        } else {
            throw new Error('Failed to load group members for group ' + group_name + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        new window.AlertComponent('API Error', 'Error fetching group members for ' + group_name + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group members for ' + group_name + ':', e);
        throw e;
    }

};

// Fetch group instructions from backend
window.conversations.api.fetchGroupInstructions = async function (groupName, conversation_type=null) {

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                conversation_type: conversation_type
            })
        });

        const result = await resp.json();
        if (result.success && result.data && typeof result.data === 'object') {
            return result.data;
        } else {
            throw new Error('Failed to load group instructions for group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        new window.AlertComponent('API Error', 'Error fetching group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group instructions for ' + groupName + ':', e);
        throw e;
    }
}

// Fetch group names from backend
window.conversations.api.fetchGroupNames = async function () {
    // Fetch group names from API
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        if (result.success && Array.isArray(result.groups)) {
            return result.groups;
        } else {
            throw new Error('Failed to load group names: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        new window.AlertComponent('API Error', 'Error getting group names.' + '\nError: ' + (e.message || e.toString()));
        console.error('Error getting group names:', e);
        throw e;
    }
}    

// Fetch member decisions from backend
window.conversations.api.fetchMemberDecisions =  async function(memberId) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/member_decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },    
            body: JSON.stringify({ member_id: memberId })
        });

        const result = await resp.json();
        if (result.success && Array.isArray(result.decisions)) {
            return result.decisions;
        } else {
            throw new Error('Failed to get member decisions: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        new window.AlertComponent('API Error', 'Error fetching member decisions for ' + memberId + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching member decisions:', e);
        throw e;
    }
}


// Fetch instruction info for a group
// window.conversations.api.fetchGroupInstructionInfo = async function (groupName, conversation_type) {
//     try {
//         const resp = await fetch('/api/dev-tool-conversations/group_instruction_info', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 group_name: groupName,
//                 conversation_type: conversation_type
//             })
//         });
        
//         const result = await resp.json();
//         if (result.success && typeof result.data === 'object') {
//             return result.data;
//         } else {
//             throw new Error('Failed to load instruction info for group ' + groupName + ': ' + (result.error || 'Unknown error'));
//         }

//     } catch (e) {
//         new window.AlertComponent('API Error', 'Error fetching instruction info for ' + groupName + '\nError: ' + (e.message || e.toString()));
//         console.error('Error fetching instruction info for ' + groupName + ':', e);
//         throw e;
//     }
// }

// Delete group instructions
window.conversations.api.deleteGroupInstructions =  async function (groupName, instructionsType) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/delete_group_instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                instructions_type: instructionsType
            })
        });

        const result = await resp.json();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to delete group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        new window.AlertComponent('API Error', 'Error deleting instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting group instructions for ' + groupName + ':', e);
        throw e;
    }
}

// Update group instructions
window.conversations.api.updateGroupInstructions = async function (groupName, instructionsType, instructions, feedbackDef, info) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/update_group_instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                instructions_type: instructionsType,
                instructions: instructions,
                feedback_def: feedbackDef,
                info: info
            })
        });

        const result = await resp.json();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to update group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
        
    } catch (e) {
        new window.AlertComponent('API Error', 'Error updating group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error updating group instructions for ' + groupName + ':', e);
        throw e;
    }
}

// Add group instructions
window.conversations.api.addGroupInstructions = async function (groupName, instructions, feedbackDef, info) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/add_group_instructions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                instructions: instructions,
                feedback_def: feedbackDef,
                info: info
            })
        });

        const result = await resp.json();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to add group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
        
    } catch (e) {
        new window.AlertComponent('API Error', 'Error adding group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding group instructions for ' + groupName + ':', e);
        throw e;
    }
}

// Decision start
window.conversations.api.decisionStart = async function (groupName, selectedInstruction, participant_members_nick_names) {
    try {
        const resp = await fetch('/api/dev-tool-conversations/decision_start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                context: { type: selectedInstruction },
                participant_members_nick_names: participant_members_nick_names
            })
        });
        
        const result = await resp.json();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to start decision for group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        new window.AlertComponent('API Error', 'Error starting decision for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error starting decision for ' + groupName + ':', e);
        throw e;
    }
}