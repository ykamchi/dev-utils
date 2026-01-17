/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.api = window.conversations.api || {};

window.conversations.api.addGroupMembers = async function (spinnerContainer, groupName, members) {
    // Show loading spinner while adding members
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Adding members ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/add_members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                members: members
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to add members to group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding members to group ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding members to group ' + groupName + ':', e);
        throw e;
    }
};

// Fetch group members from backend
window.conversations.api.fetchGroupMembers = async function (spinnerContainer, group_name) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading members ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: group_name })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.members && typeof result.members === 'object') {
            return result.members;
        } else {
            spinner.remove();
            throw new Error('Failed to load group members for group ' + group_name + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group members for ' + group_name + '\n\n\n<br><br>Error: ' + (e.message || e.toString()));
        console.error('Error fetching group members for ' + group_name + ':', e);
        throw e;
    }

};

// Fetch group instructions from backend
window.conversations.api.fetchGroupInstructions = async function (spinnerContainer, groupName, conversation_type = null) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading instructions definitions for ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

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
        spinner.remove();
        if (result.success && result.data && typeof result.data === 'object') {
            return result.data;
        } else {
            throw new Error('Failed to load group instructions for group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group instructions for ' + groupName + ':', e);
        throw e;
    }
};

// Fetch group names from backend
window.conversations.api.fetchGroups = async function (spinnerContainer) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: 'Loading groups ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    // Fetch group names from API
    try {
        const resp = await fetch('/api/dev-tool-conversations/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        if (result.success && Array.isArray(result.groups)) {
            spinner.remove();
            return result.groups;
        } else {
            spinner.remove();
            throw new Error('Failed to load group names: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error getting group names.' + '\nError: ' + (e.message || e.toString()));
        console.error('Error getting group names:', e);
        throw e;
    }
};

window.conversations.api.addGroup = async function (spinnerContainer, groupName, groupDescription) {
    // Show loading spinner while adding group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Adding group ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/add_group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                group_description: groupDescription
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to add group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding group ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding group ' + groupName + ':', e);
        throw e;
    }
};

window.conversations.api.deleteGroup = async function (spinnerContainer, groupName) {
    // Show loading spinner while deleting group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting group ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/delete_group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to delete group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting group ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting group ' + groupName + ':', e);
        throw e;
    }
};

window.conversations.api.updateGroup = async function (spinnerContainer, oldGroupName, newGroupName, newDescription) {
    // Show loading spinner while updating group
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating group ${oldGroupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/update_group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                old_group_name: oldGroupName,
                new_group_name: newGroupName,
                new_group_description: newDescription
            })
        });

        spinner.remove();
        const result = await resp.json();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to update group ' + oldGroupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error updating group ' + oldGroupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error updating group ' + oldGroupName + ':', e);
        throw e;
    }
};

// Fetch member conversations from backend
window.conversations.api.fetchMemberConversations = async function (container, memberId, conversation_type, only_last = false) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(container, { text: 'Loading member conversations ...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/member_conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                member_id: memberId, 
                conversation_type: 
                conversation_type, only_last: only_last 
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success && result.data && Array.isArray(result.data)) {
            return result.data;
        } else {
            throw new Error('Failed to get member conversations: ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching member conversations for ' + memberId + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching member conversations:', e);
        throw e;
    }
};

// Delete group instructions
window.conversations.api.deleteGroupInstructions = async function (spinnerContainer, groupName, instructionsType) {
    // Show loading spinner while deleting instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Deleting instructions for ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
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
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to delete group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error deleting instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error deleting group instructions for ' + groupName + ':', e);
        throw e;
    }
};

// Update group instructions
window.conversations.api.updateGroupInstructions = async function (spinnerContainer, groupName, instructionsType, instructions, feedbackDef, info) {
    // Show loading spinner while updating instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Updating instructions for ${groupName}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
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
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to update group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error updating group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error updating group instructions for ' + groupName + ':', e);
        throw e;
    }
};

// Add group instructions
window.conversations.api.addGroupInstructions = async function (spinnerContainer, groupName, instructions, feedbackDef, info) {
    // Show loading spinner while adding instructions
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Adding instructions ...${info.name}`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
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
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to add group instructions for ' + groupName + ': ' + (result.error || 'Unknown error'));
        }

    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error adding group instructions for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error adding group instructions for ' + groupName + ':', e);
        throw e;
    }
};

// // Decision start
// window.conversations.api.decisionStart = async function (spinnerContainer, groupName, selectedInstruction, participant_members_nick_names) {
//     // Show loading spinner while starting decision
//     const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting decision for ${participant_members_nick_names.join(', ')}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
//     try {
//         const resp = await fetch('/api/dev-tool-conversations/decision_start', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 group_name: groupName,
//                 context: { type: selectedInstruction },
//                 participant_members_nick_names: participant_members_nick_names
//             })
//         });

//         const result = await resp.json();
//         spinner.remove();
//         if (result.success) {
//             return result;
//         } else {
//             throw new Error('Failed to start decision for group ' + groupName + ': ' + (result.error || 'Unknown error'));
//         }
//     } catch (e) {
//         spinner.remove();
//         new window.AlertComponent('API Error', 'Error starting decision for ' + groupName + '\nError: ' + (e.message || e.toString()));
//         console.error('Error starting decision for ' + groupName + ':', e);
//         throw e;
//     }
// };

// Conversation start
window.conversations.api.conversationStart = async function (spinnerContainer, groupName, conversation_type, selectedInstruction, participant_members_nick_names) {
    // Show loading spinner while starting conversation
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Starting conversation for ${participant_members_nick_names.join(', ')}...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
    try {
        const resp = await fetch('/api/dev-tool-conversations/conversation_start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                group_name: groupName,
                conversation_type: conversation_type,
                context: { type: selectedInstruction },
                participant_members_nick_names: participant_members_nick_names
            })
        });

        const result = await resp.json();
        spinner.remove();
        if (result.success) {
            return result;
        } else {
            throw new Error('Failed to start conversation for group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error starting conversation for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error starting conversation for ' + groupName + ':', e);
        throw e;
    }
};

// Fetch group seed files from backend (mimics e.target.files structure)
window.conversations.api.fetchGroupSeedFiles = async function (spinnerContainer, groupName) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading group ${groupName} seed files ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_seed_files', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: groupName })
        });

        const result = await resp.json();
        if (result.success && result.files && Array.isArray(result.files)) {
            spinner.remove();
            return extractSeedData(result.files);
        } else {
            spinner.remove();
            throw new Error('Failed to fetch group seed files for group ' + groupName + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group seed files for ' + groupName + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group seed files for ' + groupName + ':', e);
        throw e;
    }
};

async function extractSeedData(files) {
    // const ret = await window.conversations.api.fetchGroupSeedFiles(this.groupName);


    // This is where we will store the files in structured format
    const seedingData = [];
    const instructionsSeeds = {};

    // Loop through selected files
    for (const file of files) {
        const pathParts = file.webkitRelativePath.split('/');

        // Skip files not in the selected group folder
        // if (pathParts[1] !== this.groupName) {
        //     continue;
        // }

        // 1. Check for the root members_seed.json
        // (It should be in the root of the selection, so path length is 2: "root/file.json")
        if (pathParts.length === 2 && file.name === 'members_seed.json') {
            try {
                const membersSeedJson = JSON.parse(await file.content);
                const valid = this.validateMembers(membersSeedJson);
                seedingData.unshift({
                    type: 'members',
                    folderName: 'root',
                    file: file,
                    include: valid.valid,
                    valid: valid.valid,
                    error: valid.valid ? null : `members_seed.json validation error: ${valid.reason}`
                });
                continue;

            } catch (err) {
                seedingData.unshift({
                    type: 'members',
                    folderName: 'root',
                    file: file,
                    include: false,
                    valid: false,
                    error: err instanceof SyntaxError ? 'Invalid JSON format in members_seed.json.' : err.message
                });
                continue;
            }


        }

        // 2. Check for files inside the instructions/ folder
        // (We expect pathParts[1] to be 'instructions' and length to be 4: "root/instructions/folder_name/file")
        if (pathParts[1] === 'instructions' && pathParts.length === 4) {
            const folderName = pathParts[pathParts.length - 2];

            // Initialize folder entry if not exists
            if (!instructionsSeeds[folderName]) {
                instructionsSeeds[folderName] = {
                    instructions: null,
                    feedback: null,
                    info: null
                };
            }

            // Assign files to their respective slots
            if (file.name === 'instructions.md') {
                instructionsSeeds[folderName].instructions = file;
            } else if (file.name === 'feedback.json') {
                instructionsSeeds[folderName].feedback = file;
            } else if (file.name === 'info.json') {
                instructionsSeeds[folderName].info = file;
            }

            // If all three files are present, add to seedingData
            if (
                instructionsSeeds[folderName].instructions &&
                instructionsSeeds[folderName].feedback &&
                instructionsSeeds[folderName].info) {
                let infoJson;
                try {
                    infoJson = JSON.parse(await instructionsSeeds[folderName].info.content);
                    const valid = this.validateInfo(infoJson);
                    if (!valid) {
                        seedingData.push({
                            type: 'instruction',
                            folderName: folderName,
                            instruction_file: instructionsSeeds[folderName].instructions,
                            feedback_file: instructionsSeeds[folderName].feedback,
                            info_file: instructionsSeeds[folderName].info,
                            include: false,
                            valid: false,
                            error: valid.valid ? null : `info.json validation error: ${valid.reason}`
                        });
                        // Remove from instructionsSeeds - so only incomplete folders remain
                        delete instructionsSeeds[folderName];
                        continue;
                    }

                } catch (err) {
                    seedingData.push({
                        type: 'instruction',
                        folderName: folderName,
                        instruction_file: instructionsSeeds[folderName].instructions,
                        feedback_file: instructionsSeeds[folderName].feedback,
                        info_file: instructionsSeeds[folderName].info,
                        include: false,
                        valid: false,
                        error: err instanceof SyntaxError ? 'Invalid JSON format in info.json.' : err.message
                    });
                    // Remove from instructionsSeeds - so only incomplete folders remain
                    delete instructionsSeeds[folderName];
                    continue;
                }
                try {
                    const feedbackJson = JSON.parse(await instructionsSeeds[folderName].feedback.content);
                    const valid = this.validateFeedback(feedbackJson);
                    if (!valid.valid) {
                        seedingData.push({
                            type: 'instruction',
                            folderName: folderName,
                            instruction_file: instructionsSeeds[folderName].instructions,
                            feedback_file: instructionsSeeds[folderName].feedback,
                            info_file: instructionsSeeds[folderName].info,
                            include: false,
                            valid: false,
                            error: valid.valid ? null : `feedback.json validation error: ${valid.reason}`
                        });
                        // Remove from instructionsSeeds - so only incomplete folders remain
                        delete instructionsSeeds[folderName];
                        continue;
                    }
                } catch (err) {
                    console.error("Error parsing feedback.json:", err);
                    seedingData.push({
                        type: 'instruction',
                        folderName: folderName,
                        instruction_file: instructionsSeeds[folderName].instructions,
                        feedback_file: instructionsSeeds[folderName].feedback,
                        info_file: instructionsSeeds[folderName].info,
                        include: false,
                        valid: false,
                        error: err instanceof SyntaxError ? 'Invalid JSON format in feedback.json.' : err.message
                    });
                    // Remove from instructionsSeeds - so only incomplete folders remain
                    delete instructionsSeeds[folderName];
                    continue;
                }

                // If we reach here, all files are valid
                seedingData.push({
                    type: 'instruction',
                    folderName: folderName,
                    instructionType: infoJson.type,
                    instruction_file: instructionsSeeds[folderName].instructions,
                    feedback_file: instructionsSeeds[folderName].feedback,
                    info_file: instructionsSeeds[folderName].info,
                    include: true,
                    valid: true
                });
                // Remove from instructionsSeeds - so only incomplete folders remain
                delete instructionsSeeds[folderName];
            }
        }
    }

    // Add any incomplete instruction folders as invalid entries
    for (const [folderName, files] of Object.entries(instructionsSeeds)) {
        seedingData.push({
            type: 'instruction',
            folderName: folderName,
            instruction_file: files.instructions,
            feedback_file: files.feedback,
            info_file: files.info,
            include: false,
            valid: false
        });
    }
    return seedingData;  
}

function validateMembers(members) {
    if (!Array.isArray(members)) {
        return { valid: false, reason: "Members is not an array" };
    }
    if (!Array.isArray(members)) {
        return { valid: false, reason: "Members is not an array" };
    }
    if (!(
        members.every(item => (
            item.hasOwnProperty('name') &&
            item.hasOwnProperty('age') &&
            item.hasOwnProperty('gender') &&
            item.hasOwnProperty('location') &&
            item.hasOwnProperty('occupation')
        )))) {
        return { valid: false, reason: "One or more members are missing required properties" };
    }
    return { valid: true };
}

function validateInfo(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return { valid: false, reason: "Root is not an object" };
    }
    if (!obj.hasOwnProperty('type')) {
        return { valid: false, reason: "Missing 'type' property" };
    }
    if (!obj.hasOwnProperty('name')) {
        return { valid: false, reason: "Missing 'name' property" };
    }
    if (!obj.hasOwnProperty('description')) {
        return { valid: false, reason: "Missing 'description' property" };
    }
    if (!obj.hasOwnProperty('conversation_type')) {
        return { valid: false, reason: "Missing 'conversation_type' property" };
    }
    return { valid: true };
}

function validateFeedback(obj) {
    // 1. Ensure it's a non-null object
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return { valid: false, reason: "Root is not an object" };
    }

    // 2. Iterate through every entry in the object
    for (const [key, entry] of Object.entries(obj)) {

        // Check for mandatory fields: description and type
        if (!('description' in entry) || !('type' in entry) || !('required' in entry)) {
            return { valid: false, reason: `Key '${key}' missing description, type, or required` };
        }

        // Logic for Integers
        if (entry.type === 'integer') {
            if (!('min' in entry) || !('max' in entry)) {
                return { valid: false, reason: `Integer '${key}' missing min or max` };
            }
        }

        // Logic for Strings
        else if (entry.type === 'string') {
            if (!Array.isArray(entry['optional-values'])) {
                return { valid: false, reason: `'optional-values' in '${key}' must be an array` };
            }

            // Check that every item in optional-values is a string
            const allStrings = entry['optional-values'].every(val => typeof val === 'string');
            if (!allStrings) {
                return { valid: false, reason: `All 'optional-values' in '${key}' must be strings` };
            }
        }
    }

    return { valid: true };
}