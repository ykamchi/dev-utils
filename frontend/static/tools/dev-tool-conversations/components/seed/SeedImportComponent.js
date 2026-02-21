(function () {
    /*
        SeedImportComponent: Displays and imports seed data (members, instructions, roles) from seed files
    */
    class SeedImportComponent {
        constructor(container, groupId, seedType, onAddedSeeds = null) {
            this.container = container;
            this.groupId = groupId;
            this.seedType = seedType; // Single seed type: 'members', 'instructions_all', 'roles', etc.
            this.allSeedsByType = {};
            this.page = null;
            this.onAddedSeeds = onAddedSeeds;
            this.contentDiv = null; // Store content div for re-rendering
            this.render();
        }

        render() {
            this.loadSeeds();
        }

        async loadSeeds() {
            if (this.groupId) {
                this.group = await window.conversations.apiGroups.groupsGet(this.container, this.groupId);
            }

            // Load seeds based on the single seed type
            switch(this.seedType) {
                case window.conversations.SEED_TYPES.GROUP:
                    const groupSeeds = await window.conversations.apiSeeds.seedsGroupsGet(this.container, null);
                    const templateGroups = await window.conversations.apiSeeds.seedsGroupsGet(this.container, 'templates');
                    await this.loadGroupSeeds(groupSeeds, templateGroups);
                    break;
                    
                case window.conversations.SEED_TYPES.MEMBERS:
                    const memberSeeds = this.group ? await window.conversations.apiSeeds.seedsMembersGet(this.container, this.group) : [];
                    const templateMembers = await window.conversations.apiSeeds.seedsMembersGet(this.container, null);
                    await this.loadMemberSeeds(memberSeeds, templateMembers);
                    break;
                    
                case window.conversations.SEED_TYPES.INSTRUCTIONS_ALL:
                    const groupInstructionsAll = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                    const templateInstructionsAll = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                    await this.loadInstructionSeeds(groupInstructionsAll, templateInstructionsAll, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION);
                    await this.loadInstructionSeeds(groupInstructionsAll, templateInstructionsAll, window.conversations.CONVERSATION_TYPES.AI_DECISION);
                    break;

                case window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS:
                    const groupInstructionsConv = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                    const templateInstructionsConv = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                    await this.loadInstructionSeeds(groupInstructionsConv, templateInstructionsConv, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION);
                    break;

                case window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS:
                    const groupInstructionsDec = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                    const templateInstructionsDec = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                    await this.loadInstructionSeeds(groupInstructionsDec, templateInstructionsDec, window.conversations.CONVERSATION_TYPES.AI_DECISION);
                    break;

                case window.conversations.SEED_TYPES.ROLES:
                    const groupRoles = this.group ? await window.conversations.apiSeeds.seedsInstructionsRolesGet(this.container, this.group) : [];
                    const templateRoles = await window.conversations.apiSeeds.seedsInstructionsRolesGet(this.container, null);
                    await this.loadRoleSeeds(groupRoles, templateRoles);
                    break;
            }

            this.loadContent();
        }

        async loadGroupSeeds(groupSeeds, templateGroups) {
            this.allSeedsByType[window.conversations.SEED_TYPES.GROUP] = []
            
            this.allSeedsByType[window.conversations.SEED_TYPES.GROUP].push({
                type: 'seeds',
                data: groupSeeds ? groupSeeds.map(seed => {
                    seed.include = false;
                    seed.source = 'Group';
                    return seed;
                }) : [],
                tabName: '📦 Group Seeds'
            });
            
            this.allSeedsByType[window.conversations.SEED_TYPES.GROUP].push({
                type: 'templates',
                data: templateGroups ? templateGroups.map(seed => {
                    seed.include = false;
                    seed.source = 'Templates';
                    return seed;
                }) : [],
                tabName: '📄 Template Groups'
            });
        }

        async loadMemberSeeds(memberSeeds, templateMembers) {
            this.allSeedsByType[window.conversations.SEED_TYPES.MEMBERS] = []

            this.allSeedsByType[window.conversations.SEED_TYPES.MEMBERS].push({
                type: 'seeds',
                data: memberSeeds ? memberSeeds.map(seed => { seed.include = false; seed.source = 'members'; return seed; }) : [],
                tabName: '👥 Group Members'
            });

            this.allSeedsByType[window.conversations.SEED_TYPES.MEMBERS].push({
                type: 'templates',
                data: templateMembers ? templateMembers.map(seed => { seed.include = false; seed.source = 'Templates'; return seed; }) : [],
                tabName: '📄 Template Members'
            });
        }

        async loadInstructionSeeds(groupInstructions, templateInstructions, instruction_type) {
            this.allSeedsByType[window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS] = [];
                
            this.allSeedsByType[window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS].push({
                type: 'seeds',
                data: groupInstructions ? groupInstructions.filter(seed => seed.json.info.conversation_type === instruction_type).
                    map(seed => {
                        seed.include = false;
                        seed.source = 'Group';
                        return seed;
                    }) : [],
                tabName: '💬 Group Conversations'
            });

            this.allSeedsByType[window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS].push({
                type: 'templates',
                data: templateInstructions ? templateInstructions.filter(seed => seed.json.info.conversation_type === instruction_type).
                    map(seed => {
                        seed.include = false;
                        seed.source = 'Templates';
                        return seed;
                    }) : [],
                tabName: '💬 Template Conversations'
            });
        }

        async loadRoleSeeds(groupRoles, templateRoles) {
            this.allSeedsByType[window.conversations.SEED_TYPES.ROLES] = [];

            this.allSeedsByType[window.conversations.SEED_TYPES.ROLES].push({
                type: 'seeds',
                data: groupRoles ? groupRoles.map(seed => { 
                    seed.include = false; 
                    seed.source = 'Group'; 
                    return seed; 
                }) : [],
                tabName: '🎭 Group Roles'
            });

            this.allSeedsByType[window.conversations.SEED_TYPES.ROLES].push({
                type: 'templates',
                data: templateRoles ? templateRoles.map(seed => { 
                    seed.include = false; 
                    seed.source = 'Templates'; 
                    return seed; 
                }) : [],
                tabName: '🎭 Template Roles'
            });
        }

        loadContent() {

            // Calculate total seeds count
            const totalSeeds = Object.values(this.allSeedsByType).reduce((total, entries) => {
                return total + entries.reduce((sum, entry) => sum + entry.data.length, 0);
            }, 0);

            // Determine page icon and title based on seed type
            let pageIcon = '📦';
            let seedName = 'Seeds';
            let buttonLabel = '📤 Import Selected';
            
            switch(this.seedType) {
                case window.conversations.SEED_TYPES.GROUP:
                    pageIcon = '👥';
                    seedName = 'Groups';
                    buttonLabel = '📤 Import Groups';
                    break;
                case window.conversations.SEED_TYPES.MEMBERS:
                    pageIcon = '👤';
                    seedName = 'Members';
                    buttonLabel = '📤 Import Members';
                    break;
                case window.conversations.SEED_TYPES.INSTRUCTIONS_ALL:
                    pageIcon = '📋';
                    seedName = 'Instructions';
                    buttonLabel = '📤 Import Instructions';
                    break;
                case window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS:
                    pageIcon = '💬';
                    seedName = 'Conversations';
                    buttonLabel = '📤 Import Conversations';
                    break;
                case window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS:
                    pageIcon = '⚖️';
                    seedName = 'Decisions';
                    buttonLabel = '📤 Import Decisions';
                    break;
                case window.conversations.SEED_TYPES.ROLES:
                    pageIcon = '🎭';
                    seedName = 'Roles';
                    buttonLabel = '✅ Select Roles';
                    break;
            }

            // Create page component with proper header format
            this.page = new window.conversations.PageComponent(this.container, pageIcon, `Import ${seedName} Seeds`, [ this.group?.group_name, `Total seeds: ${totalSeeds}` ] );

            // Control area - show selection counts
            this.loadControlArea();

            // Buttons area
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonsDiv, {
                label: buttonLabel,
                onClick: () => this.startSeedingAllData(),
                type: window.ButtonComponent.TYPE_GHOST
            });
            this.page.updateButtonsArea(buttonsDiv);

            // Content area - Create tabs based on available seed data
            this.contentDiv = window.conversations.utils.createDivContainer();
            this.renderTabs();
            this.page.updateContentArea(this.contentDiv);
        }

        renderTabs() {
            // Clear and re-render tabs
            this.contentDiv.innerHTML = '';
            
            const tabs = [];
            
            // Generate tabs from allSeedsByType structure
            Object.values(this.allSeedsByType).forEach(entries => {
                entries.forEach(entry => {
                    tabs.push({ 
                        name: entry.tabName, 
                        populateFunc: (container) => { 
                            this.populateSeedTab(container, entry.data); 
                        }
                    });
                });
            });
            
            new window.TabsetComponent(this.contentDiv, tabs, 'manage-group-seeds-import-tabset');
        }

        loadControlArea() {
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            // Count selected seeds by type in one pass
            const counts = { groups: 0, members: 0, roles: 0, conversations: 0, decisions: 0 };
            Object.values(this.allSeedsByType).forEach(entries => {
                entries.forEach(entry => {
                    entry.data.forEach(seed => {
                        if (seed.include && seed.valid) {
                            if (seed.type === 'group') counts.groups++;
                            else if (seed.type === 'member') counts.members++;
                            else if (seed.type === 'role') counts.roles++;
                            else if (seed.type === 'instruction') {
                                if (seed.json.info.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
                                    counts.conversations++;
                                } else if (seed.json.info.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
                                    counts.decisions++;
                                }
                            }
                        }
                    });
                });
            });

            // Details label - show only non-zero counts
            let details = '';
            details += counts.groups ? `${counts.groups} Groups ` : '';
            details += counts.members ? `${counts.members} Members ` : '';
            details += counts.roles ? `${counts.roles} Roles ` : '';
            details += counts.conversations ? `${counts.conversations} Conversations ` : '';
            details += counts.decisions ? `${counts.decisions} Decisions ` : '';
            
            window.conversations.utils.createLabel(controlDiv, 'Selected: ' + `${details? details : 'None'}`);
            this.page.updateControlArea(controlDiv);
        }

        populateSeedTab(container, seeds) {
            // Add select/unselect buttons for this tab
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '☑️ Select all',
                onClick: () => this.selectAll(seeds, true),
                type: window.ButtonComponent.TYPE_GHOST
            });
            new window.ButtonComponent(buttonContainer, {
                label: '☐ Unselect all',
                onClick: () => this.selectAll(seeds, false),
                type: window.ButtonComponent.TYPE_GHOST
            });

            // Seed data list
            new window.ListComponent(container, seeds, (seedEntry) => {
                // Create header content
                let icon = '☰ ';
                let name = seedEntry.seed_name || 'Unknown Seed';
                
                if (seedEntry.type === 'member') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? '👤 ' : '✘ ';
                    }
                } else if (seedEntry.type === 'instruction') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? window.conversations.CONVERSATION_TYPES_ICONS[seedEntry.json.info.conversation_type] + ' ' : '✘ ';
                    }
                } else if (seedEntry.type === 'group') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? '👥 ' : '✘ ';
                    }
                } else if (seedEntry.type === 'role') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? '🎭 ' : '✘ ';
                    }
                }

                const headerContent = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

                // Icon 
                window.conversations.utils.createReadOnlyText(headerContent, icon, 'conversations-list-card-icon');

                // Info
                const info = window.conversations.utils.createDivContainer(headerContent, 'conversations-card-info');

                // Name
                const nameWrapper = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal');
                new window.CheckboxComponent(nameWrapper, seedEntry.include, (checked) => {
                    seedEntry.include = checked;
                    // Update control area when checkbox changes
                    this.loadControlArea();
                }, null, !seedEntry.valid || seedEntry.exist);

                window.conversations.utils.createReadOnlyText(nameWrapper, name, 'conversations-card-name');

                let description = `${seedEntry.type} • ${seedEntry.seed_key ? seedEntry.seed_key : 'no key'}`;

                if (seedEntry.exist) {
                    description += ' • Already exists';
                } else if (!seedEntry.valid) {
                    description += ' • Invalid';
                }
                window.conversations.utils.createReadOnlyText(info, description, seedEntry.valid ? 'conversations-card-description' : 'conversations-error');

                // Create body content
                const bodyContent = window.conversations.utils.createDivContainer();
                if (seedEntry.exist) {
                    window.conversations.utils.createReadOnlyText(bodyContent, 'This item already exists in the database and cannot be imported again.', 'conversations-message-info');
                    window.conversations.utils.createJsonDiv(bodyContent, seedEntry.json);
                } else if (!seedEntry.valid) {
                    window.conversations.utils.createReadOnlyText(bodyContent, seedEntry.error, 'conversations-message-error');
                } else {
                    window.conversations.utils.createJsonDiv(bodyContent, seedEntry.json);
                }

                // Create ExpandDivComponent
                const seedDiv = window.conversations.utils.createDivContainer();
                new window.ExpandDivComponent(seedDiv, headerContent, bodyContent);
                return seedDiv;
            });
        }

        selectAll(seeds, select) {
            seeds.forEach(seed => {
                if (seed.valid && !seed.exist) {
                    seed.include = select;
                }
            });
            
            // Re-render tabs to update checkboxes
            this.renderTabs();
            
            // Update control area with new counts
            this.loadControlArea();
        }

        async startSeedingAllData() {
            // Flatten all seeds to get selections
            const allSeeds = Object.values(this.allSeedsByType).reduce((acc, entries) => {
                entries.forEach(entry => {
                    acc.push(...entry.data);
                });
                return acc;
            }, []);
            
            // Collect all selected seeds from all tabs
            const selectedSeeds = allSeeds.filter(entry => entry.include && entry.valid);

            if (selectedSeeds.length === 0) {
                const actionName = this.seedType === window.conversations.SEED_TYPES.ROLES ? 'selection' : 'import';
                new window.AlertComponent('Seed ' + actionName.charAt(0).toUpperCase() + actionName.slice(1), `No items selected. Please select at least one item to ${actionName === 'selection' ? 'select' : 'import'}.`);
                return;
            }

            // Special handling for roles - just return selected seeds via callback
            if (this.seedType === window.conversations.SEED_TYPES.ROLES) {
                if (this.onAddedSeeds) {
                    this.onAddedSeeds({ roles: selectedSeeds });
                }
                new window.AlertComponent('Role Selection', `Selected ${selectedSeeds.length} role(s).`);
                return;
            }

            // Regular seed import flow for all other types
            try {
                const added = {};
                
                // Import groups
                const selectedGroups = selectedSeeds.filter(entry => entry.type === 'group').map(entry => entry.json);
                if (selectedGroups.length > 0) {
                    added.groups = [];
                    for (const entry of selectedGroups) {
                        const group = await window.conversations.apiGroups.groupsAdd(null, entry.group_key, entry.group_name, entry.group_objectives, entry.group_info);
                        added.groups.push(group);
                    }
                }

                // Import members (batch)
                const selectedMembers = selectedSeeds.filter(entry => entry.type === 'member').map(entry => entry.json);
                if (selectedMembers.length > 0) {
                    await window.conversations.apiMembers.membersAdd(null, this.group.group_id, selectedMembers);
                    added.members = selectedMembers;
                }
                
                // Import instructions (one by one)
                const selectedInstructions = selectedSeeds.filter(entry => entry.type === 'instruction');
                if (selectedInstructions.length > 0) {
                    added.instructions = [];
                
                    for (const entry of selectedInstructions) {
                        // Use instruction_key from seed JSON (null for templates, actual key for group seeds)
                        const instruction = await window.conversations.apiInstructions.instructionsAdd(null, this.group.group_id, entry.json.info, entry.json.instruction_key);
                        added.instructions.push(instruction);
                    }
                }

                if (this.onAddedSeeds && (added.members || added.instructions || added.groups)) {
                    this.onAddedSeeds(added);
                }

                new window.AlertComponent('Seed Import', `Successfully imported ${selectedSeeds.length} item(s).`);
            } catch (e) {
                console.error('Error seeding data:', e);
                // new window.AlertComponent('Error', `Failed to import seeds: ${e.message || e.toString()}`);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.SeedImportComponent = SeedImportComponent;
})();
