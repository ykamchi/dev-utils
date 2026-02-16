(function () {
    /*
        ManageSeedsImportComponent: Displays and imports seed data (members, instructions) from seed files
    */
    class ManageSeedsImportComponent {
        constructor(container, groupId, seedTypes, onAddedSeeds = null) {
            this.container = container;
            this.groupId = groupId;
            this.seedTypes = seedTypes; // e.g., ['members', 'instruction'] or ['instruction']
            this.allSeedsByType = {};
            this.page = null;
            this.onAddedSeeds = onAddedSeeds;
            this.render();
        }

        render() {
            if (this.seedTypes.length === 0) {
                window.conversations.utils.createReadOnlyText(this.container, 'No seed types specified for import.', 'conversations-message-empty');
                return;
            }
            this.loadSeeds();
        }

        async loadSeeds() {
            if (this.groupId) {
                this.group = await window.conversations.apiGroups.groupsGet(this.container, this.groupId);
            }

            // Load seeds based on requested types
            if (this.seedTypes.includes(window.conversations.SEED_TYPES.GROUP)) {
                const groupSeeds = await window.conversations.apiSeeds.seedsGroupsGet(this.container, null);
                const templateGroups = await window.conversations.apiSeeds.seedsGroupsGet(this.container, 'templates');
                await this.loadGroupSeeds(groupSeeds, templateGroups);
            }
            
            if (this.seedTypes.includes(window.conversations.SEED_TYPES.MEMBERS)) {
                const memberSeeds = this.group ? await window.conversations.apiSeeds.seedsMembersGet(this.container, this.group) : [];
                const templateMembers = await window.conversations.apiSeeds.seedsMembersGet(this.container, null);
                await this.loadMemberSeeds(memberSeeds, templateMembers);
            }
            
            if (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_ALL)) {
                const groupInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                const templateInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                await this.loadInstructionSeeds(groupInstructions, templateInstructions, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION);
                await this.loadInstructionSeeds(groupInstructions, templateInstructions, window.conversations.CONVERSATION_TYPES.AI_DECISION);
            }

            if (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS)) {
                const groupInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                const templateInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                await this.loadInstructionSeeds(groupInstructions, templateInstructions, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION);
            }

            if (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS)) {
                const groupInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group) : [];
                const templateInstructions = this.group ? await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null) : [];
                await this.loadInstructionSeeds(groupInstructions, templateInstructions, window.conversations.CONVERSATION_TYPES.AI_DECISION);
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

        loadContent() {

            // Calculate total seeds count
            const totalSeeds = Object.values(this.allSeedsByType).reduce((total, entries) => {
                return total + entries.reduce((sum, entry) => sum + entry.data.length, 0);
            }, 0);

            const seedNames = this.seedTypes.map(type => {
                if (type === window.conversations.SEED_TYPES.GROUP) return 'Groups';
                if (type === window.conversations.SEED_TYPES.MEMBERS) return 'Members';
                if (type === window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS) return 'Conversations';
                if (type === window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS) return 'Decisions';
                return type;
            });
            // Create page component with proper header format
            this.page = new window.conversations.PageComponent(this.container, '📦', `Import ${seedNames.join(', ')} Seeds`, [ this.group?.group_name, `Total seeds: ${totalSeeds}` ] );

            // Control area - show selection counts
            this.loadControlArea();

            // Buttons area
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonsDiv, {
                label: '📤 seed selected',
                onClick: () => this.startSeedingAllData(),
                type: window.ButtonComponent.TYPE_GHOST
            });
            this.page.updateButtonsArea(buttonsDiv);

            // Content area - Create tabs based on available seed data
            const contentDiv = window.conversations.utils.createDivContainer();
            const tabs = [];
            
            // Generate tabs from allSeedsByType structure - no length check needed!
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
            
            new window.TabsetComponent(contentDiv, tabs, 'manage-group-seeds-import-tabset');
            this.page.updateContentArea(contentDiv);
        }

        loadControlArea() {
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            // Count selected seeds by type in one pass
            const counts = { groups: 0, members: 0, conversations: 0, decisions: 0 };
            Object.values(this.allSeedsByType).forEach(entries => {
                entries.forEach(entry => {
                    entry.data.forEach(seed => {
                        if (seed.include && seed.valid) {
                            if (seed.type === 'group') counts.groups++;
                            else if (seed.type === 'member') counts.members++;
                            else if (seed.type === 'instruction') {
                                if (seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
                                    counts.conversations++;
                                } else if (seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
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
                let name = 'Unknown Seed';
                if (seedEntry.type === 'member') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? '👤 ' : '✘ ';
                    }
                    name = seedEntry.json?.member_name;
                } else if (seedEntry.type === 'instruction') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? window.conversations.CONVERSATION_TYPES_ICONS[seedEntry.json.info.conversation_type] + ' ' : '✘ ';
                    }
                    name = 'Instruction - ' + seedEntry.json.info.name;
                } else if (seedEntry.type === 'group') {
                    if (seedEntry.exist) {
                        icon = '✔️ ';
                    } else {
                        icon = seedEntry.valid ? '👥 ' : '✘ ';
                    }
                    name = 'Group - ' + seedEntry.json.group_name;
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
                if (seed.valid) {
                    seed.include = select;
                }
            });
            this.loadContent(); // Refresh to show updated checkboxes and control area
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
                new window.AlertComponent('Seed Import', 'No items selected. Please select at least one item to import.');
                return;
            }

            try {
                // Group members together for batch import
                const selectedGroups = selectedSeeds.filter(entry => entry.type === 'group').map(entry => entry.json);
                
                const added = {}
                // Import all members in one API call if any selected
                if (selectedGroups.length > 0) {
                    added.groups = [];
                    for (const entry of selectedGroups) {
                        const group = await window.conversations.apiGroups.groupsAdd(null, entry.group_key, entry.group_name);
                        added.groups.push(group);
                    }
                }

                // Group members together for batch import
                const selectedMembers = selectedSeeds.filter(entry => entry.type === 'member').map(entry => entry.json);
                
                // Import all members in one API call if any selected
                if (selectedMembers.length > 0) {
                    await window.conversations.apiMembers.membersAdd(null, this.group.group_id, selectedMembers);
                    added.members = selectedMembers;
                }
                
                // Import instructions one by one
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
    window.conversations.ManageSeedsImportComponent = ManageSeedsImportComponent;
})();
