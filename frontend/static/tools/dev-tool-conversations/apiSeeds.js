/*
    API functions for conversation seed data management
*/
window.conversations = window.conversations || {};
window.conversations.apiSeeds = window.conversations.apiSeeds || {}



window.conversations.apiSeeds.fetchGroupSeeds = async function (spinnerContainer) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading group seeds ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_seeds', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await resp.json();
        if (result.success) {
            spinner.remove();
            // Return processed seeds directly from server
            return result.data;
        } else {
            spinner.remove();
            throw new Error('Failed to fetch group seeds: ' + (result.error || 'Unknown error'));
        }
    }
    catch (e) {
        spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group seeds.\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group seeds:', e);
        throw e;
    }
};

// Fetch group seed from backend for a specific group and instruction type (returns processed seeding data)
window.conversations.apiSeeds.fetchGroupSeed = async function (spinnerContainer, groupName, instructionType) {
    // Show loading spinner while fetching
    const spinner = spinnerContainer ? new window.SpinnerComponent(spinnerContainer, { text: `Loading ${instructionType} seed ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT }) : null;

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_seed', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: groupName, instruction_type: instructionType })
        });

        const result = await resp.json();
        if (result.success) {
            if (spinner) spinner.remove();
            return result.data;
        } else {
            if (spinner) spinner.remove();
            throw new Error('Failed to fetch group seed for ' + groupName + '/' + instructionType + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        if (spinner) spinner.remove();
        new window.AlertComponent('API Error', 'Error fetching group seed for ' + groupName + '/' + instructionType + '\nError: ' + (e.message || e.toString()));
        console.error('Error fetching group seed for ' + groupName + '/' + instructionType + ':', e);
        throw e;
    }
};

// Save group seed to backend (creates directory and files)
window.conversations.apiSeeds.saveGroupSeed = async function (spinnerContainer, groupName, instructionType, instruction) {
    // Show loading spinner while saving
    const spinner = spinnerContainer ? new window.SpinnerComponent(spinnerContainer, { text: `Saving ${groupName}/${instructionType} seed ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT }) : null;

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_seed_save', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                group_name: groupName, 
                instruction_type: instructionType,
                instruction: instruction
            })
        });

        const result = await resp.json();
        if (result.success) {
            if (spinner) spinner.remove();
            return result.data;
        } else {
            if (spinner) spinner.remove();
            throw new Error('Failed to save group seed for ' + groupName + '/' + instructionType + ': ' + (result.error || 'Unknown error'));
        }
    } catch (e) {
        if (spinner) spinner.remove();
        new window.AlertComponent('API Error', 'Error saving group seed for ' + groupName + '/' + instructionType + '\nError: ' + (e.message || e.toString()));
        console.error('Error saving group seed for ' + groupName + '/' + instructionType + ':', e);
        throw e;
    }
};

// Fetch group seed files from backend (returns processed seeding data)
window.conversations.apiSeeds.fetchGroupSeedFiles = async function (spinnerContainer, groupName) {
    // Show loading spinner while fetching
    const spinner = new window.SpinnerComponent(spinnerContainer, { text: `Loading group ${groupName} seed files ...`, size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });

    try {
        const resp = await fetch('/api/dev-tool-conversations/group_seed_files', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: groupName })
        });

        const result = await resp.json();
        if (result.success) {
            spinner.remove();
            return result.data;
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

