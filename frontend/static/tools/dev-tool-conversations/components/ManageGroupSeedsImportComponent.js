(function () {
    /*
        ManageGroupSeedsImportComponent: Displays and imports seed data (members, instructions) from seed files
    */
    class ManageGroupSeedsImportComponent {
        constructor(container, group, seedTypes) {
            this.container = container;
            this.group = group;
            this.seedTypes = seedTypes; // e.g., ['members', 'instruction'] or ['instruction']
            this.memberSeeds = [];
            this.groupInstructionSeeds = [];
            this.templateInstructionSeeds = [];
            this.allSeeds = [];
            this.page = null;
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
            // Fetch member seeds - backend returns empty array if not found
            const memberSeeds = await window.conversations.apiSeeds.seedsMembersGet(null, this.group.group_key);
            memberSeeds.forEach(seed => { seed.include = false; seed.source = 'Group'; });
            
            // Fetch group instruction seeds - backend returns empty array if not found
            const groupInstructions = await window.conversations.apiSeeds.seedsInstructionsGet(null, this.group.group_key);
            groupInstructions
                .filter(seed => 
                    this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_ALL) ||
                    (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS) && seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) ||
                    (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS) && seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION)
                )
                .forEach(seed => { 
                    seed.include = false; 
                    seed.source = 'Group';
                    this.groupInstructionSeeds.push(seed);
                });
            
            // Fetch template instruction seeds - backend returns empty array if not found
            const templateInstructions = await window.conversations.apiSeeds.seedsInstructionsGet(null, 'templates');
            templateInstructions
                .filter(seed => 
                    this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_ALL) ||
                    (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS) && seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) ||
                    (this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS) && seed.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION)
                )
                .forEach(seed => { 
                    seed.include = false; 
                    seed.source = 'Templates';
                    this.templateInstructionSeeds.push(seed);
                });

            // Filter to only include seeds matching the requested types
            if (this.seedTypes.includes(window.conversations.SEED_TYPES.MEMBERS)) {
                this.memberSeeds = memberSeeds;
            }

            this.allSeeds = [...this.memberSeeds, ...this.groupInstructionSeeds, ...this.templateInstructionSeeds];

            this.loadContent();
        }

        loadContent() {
            this.container.innerHTML = '';

            // Create page component with proper header format
            this.page = new window.conversations.PageComponent(this.container, '📦','Import Seeds',[ this.group.group_name, `Total seeds: ${this.allSeeds.length}` ] );

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

            // Content area - Create tabs based on available seed types
            const contentDiv = window.conversations.utils.createDivContainer();
            const tabs = [];
            if (this.seedTypes.includes(window.conversations.SEED_TYPES.MEMBERS)) {
                tabs.push({ name: '👥 Members', populateFunc: (container) => { this.populateSeedTab(container, this.memberSeeds); } });
            }

            if ((this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS) || 
                 this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS) ||
                 this.seedTypes.includes(window.conversations.SEED_TYPES.INSTRUCTIONS_ALL))) {
                if (this.groupInstructionSeeds.length > 0) {
                    tabs.push({ name: '📋 Group Instructions', populateFunc: (container) => { this.populateSeedTab(container, this.groupInstructionSeeds); } });
                }
                if (this.templateInstructionSeeds.length > 0) {
                    tabs.push({ name: '📄 Template Instructions', populateFunc: (container) => { this.populateSeedTab(container, this.templateInstructionSeeds); } });
                }
            }
            new window.TabsetComponent(contentDiv, tabs, 'manage-group-seeds-import-tabset');
            this.page.updateContentArea(contentDiv);
        }

        loadControlArea() {
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            const selectedMembersCount = this.memberSeeds.filter(s => s.include && s.valid).length;

            // Count by conversation type
            const selectedConversations = [...this.groupInstructionSeeds, ...this.templateInstructionSeeds]
                .filter(s => s.include && s.valid && s.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION)
                .length;
            const selectedDecisions = [...this.groupInstructionSeeds, ...this.templateInstructionSeeds]
                .filter(s => s.include && s.valid && s.json.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION)
                .length;

            // Details label - show only non-zero counts
            let details = '';
            details += selectedMembersCount ? `${selectedMembersCount} Members ` : '';
            details += selectedConversations ? `${selectedConversations} Conversations ` : '';
            details += selectedDecisions ? `${selectedDecisions} Decisions ` : '';
            
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
                if (seedEntry.type === 'members') {
                    icon = seedEntry.valid ? '👥 ' : '✘ ';
                    name = 'Members Seed';
                } else if (seedEntry.type === 'instruction') {
                    icon = seedEntry.valid ? window.conversations.CONVERSATION_TYPES_ICONS[seedEntry.json.conversation_type] + ' ' : '✘ ';
                    name = 'Instruction - ' + seedEntry.json.name;
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
                }, null, !seedEntry.valid);

                window.conversations.utils.createReadOnlyText(nameWrapper, name, 'conversations-card-name');

                // Description - include source for instructions
                const typeLabel = seedEntry.type === 'members' ? 'members' : seedEntry.type === 'instruction' ? 'instruction' : 'group';
                let description = `${typeLabel} • ${seedEntry.seed_key}`;
                if (seedEntry.type === 'instruction' && seedEntry.source) {
                    description = `${typeLabel} • ${seedEntry.source} • ${seedEntry.seed_key}`;
                }
                if (!seedEntry.valid) {
                    description += ' • Invalid';
                }
                window.conversations.utils.createReadOnlyText(info, description, seedEntry.valid ? 'conversations-card-description' : 'conversations-error');

                // Create body content
                const bodyContent = window.conversations.utils.createDivContainer();
                if (!seedEntry.valid) {
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
            // Collect all selected seeds from all tabs
            const selectedSeeds = this.allSeeds.filter(entry => entry.include && entry.valid);

            if (selectedSeeds.length === 0) {
                new window.AlertComponent('Seed Import', 'No items selected. Please select at least one item to import.');
                return;
            }

            try {
                for (const entry of selectedSeeds) {
                    if (entry.type === 'members') {
                        await window.conversations.apiMembers.membersAdd(null, this.group.group_id, entry.json);
                    } else if (entry.type === 'instruction') {
                        // Use instruction_key from seed JSON (null for templates, actual key for group seeds)
                        await window.conversations.apiInstructions.instructionsAdd(null, entry.json.instruction_key, this.group.group_id, entry.json);
                    }
                }

                new window.AlertComponent('Seed Import', `Successfully imported ${selectedSeeds.length} item(s).`);
            } catch (e) {
                console.error('Error seeding data:', e);
                new window.AlertComponent('Error', `Failed to import seeds: ${e.message || e.toString()}`);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupSeedsImportComponent = ManageGroupSeedsImportComponent;
})();
