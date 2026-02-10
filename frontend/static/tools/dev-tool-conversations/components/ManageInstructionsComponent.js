(function () {
    /*
        ManageInstructionsComponent: displays instructions for a selected group in dev-tool-conversations
    */
    class ManageInstructionsComponent {
        constructor(container, groupId, optionId, manageOptions) {
            this.container = container;
            this.groupId = groupId;
            this.optionId = optionId;
            this.manageOptions = manageOptions;

            this.group = null;

            this.instructions = [];
            this.selectedInstruction = null;
            this.selectedInstructionOrig = null;

            this.selectedInstructionsSeed = null;

            this.rolesEditor = null;

            this.page = null;

            // Button references for toggling disabled state
            this.undoButton = null;
            this.saveButton = null;
            
            this.render();
        }

        render() {
            // Load and display the content
            this.load();
        }

        // Get the group available instructions and render them in tabs according to the conversation types
        async load() {
            this.group = await window.conversations.apiGroups.groupsGet(this.container, this.groupId);

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                [this.group.group_name, this.manageOptions[this.optionId].description]
            );

            this.loadContent();
        }

        async loadContent() {
            // Fetch instruction info
            this.instructions = await window.conversations.apiInstructions.instructionsList(null, this.groupId, this.manageOptions[this.optionId].info.conversationType);

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            if (this.instructions.length <= 0) {
                // No instructions found show a message
                window.conversations.utils.createReadOnlyText(controlDiv, 'No instructions available for this conversation type.', 'conversations-message-empty');
                this.page.updateControlArea(controlDiv);
                this.page.updateContentArea(null);

                // Add instruction button to enable adding the first instruction
                const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
                new window.ButtonComponent(pageButtons, {
                    label: '+',
                    onClick: () => this.addInstruction(),
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '+ Add instruction'
                });
                this.page.updateButtonsArea(pageButtons);

            } else {
                // Set the selected instruction: use existing, then check storage, then default to first
                if (!this.selectedInstruction) {
                    const storageKey = `conversations-last-instruction-${this.groupId}-${this.manageOptions[this.optionId].info.conversationType}`;
                    const lastSelectedInstructionKey = window.StorageService.getStorageJSON(storageKey);
                    
                    if (lastSelectedInstructionKey) {
                        this.selectedInstruction = this.instructions.find(entry => entry.info.instruction_key === lastSelectedInstructionKey);
                    }
                    
                    // If still not found (storage had invalid key or no storage), use first instruction
                    if (!this.selectedInstruction) {
                        this.selectedInstruction = this.instructions[0];
                    }
                }

                // Add select instruction to control area
                const selectInstructionDiv = window.conversations.utils.createDivContainer(controlDiv);
                window.conversations.utils.createLabel(selectInstructionDiv, 'Select Instruction:');
                new window.SelectComponent(
                    selectInstructionDiv,
                    this.instructions.map(entry => ({ label: entry.info.name, value: entry.info.instruction_key })).sort((a, b) => a.label.localeCompare(b.label)),
                    async (selectedKey) => {
                        // Find the selected instruction using the selectedInstructionKey
                        this.selectedInstruction = this.instructions.find(entry => entry.info.instruction_key === selectedKey);
                        
                        // Save the selected instruction to storage
                        const storageKey = `conversations-last-instruction-${this.groupId}-${this.manageOptions[this.optionId].info.conversationType}`;
                        window.StorageService.setStorageJSON(storageKey, selectedKey);
                        
                        // Load the selected instruction details
                        this.loadSelectedInstructions();
                    },
                    'Select an instruction...',
                    this.selectedInstruction.info.instruction_key
                );
                this.page.updateControlArea(controlDiv);

                // Load the selected instruction details
                this.loadSelectedInstructions();
            }
        }

        async loadSelectedInstructions() {
            // Keep a copy of the original selected instruction to compare for changes and to use for the roles editor
            this.selectedInstructionOrig = _.cloneDeep(this.selectedInstruction);

            // Load the seed data for the selected instruction
            await this.loadSelectedInstructionsSeed();

            // Content area
            const contentDiv = window.conversations.utils.createDivContainer(null, 'conversation-container-vertical');

            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversation-container-horizontal-space-between');

            const instructionPropertiesDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');
            instructionPropertiesDiv.style.flex = '0.3';

            // Name field (editable)
            window.conversations.utils.createInput(instructionPropertiesDiv, 'Name:', {
                initialValue: this.selectedInstruction.info.name,
                pattern: /^[a-zA-Z0-9 _-]+$/,
                placeholder: 'e.g., My Instruction Name',
                onChange: (value) => {
                    this.selectedInstruction.info.name = value;
                    this.updateButtonsArea();
                }
            });
            
            // Max messages (editable)
            window.conversations.utils.createInput(instructionPropertiesDiv, 'Max Messages:', {
                initialValue: this.selectedInstruction.info.max_messages || 10,
                type: 'number',
                min: 3, max: 50,
                placeholder: 'e.g., 10',
                onChange: (value) => {
                    this.selectedInstruction.info.max_messages = value;
                    this.updateButtonsArea();
                }
            });

            // Conversation Type field (read-only)
            window.conversations.utils.createField(instructionPropertiesDiv, 'Conversation Type:', this.selectedInstruction.info.conversation_type, true);

            // Instructions key field (read-only)
            window.conversations.utils.createField(instructionPropertiesDiv, 'Instructions Key:', this.selectedInstruction.info.instruction_key, true);

            // Description field (editable)
            window.conversations.utils.createTextArea(instructionPropertiesDiv, 'Description:', {
                initialValue: this.selectedInstruction.info.description,
                placeholder: 'My Instruction Description',
                onChange: (value) => {
                    this.selectedInstruction.info.description = value;
                    this.updateButtonsArea();
                },
                aiSuggestion: {
                    fn: window.conversations.apiAi.autocomplete,
                    context: {
                        field: 'instruction_description',
                        operation: 'edit_instruction',
                        existing_data: {
                            'instruction_name': this.selectedInstruction.info.name,
                            'conversation_type': this.selectedInstruction.info.conversation_type,
                            'mission': 'Create a description for the instruction'
                        }
                    }
                }
            });

            // Meta div (editable) - JSON object for metadata
            window.conversations.utils.createTextArea(instructionPropertiesDiv, 'Meta (JSON):', {
                initialValue: JSON.stringify(this.selectedInstruction.info.meta || {}, null, 2),
                placeholder: '{}',
                onChange: (value) => {
                    try {
                        this.selectedInstruction.info.meta = JSON.parse(value);
                        this.updateButtonsArea();
                    } catch (e) {
                        console.error('Invalid JSON in meta field:', e);
                    }
                },
                rows: 4
            });

            // Add the roles area
            const rolesAreaDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');
            const rolesFieldDiv = window.conversations.utils.createDivContainer(rolesAreaDiv, 'conversation-field-container-vertical-full');
            window.conversations.utils.createLabel(rolesFieldDiv, 'Roles:');
            this.rolesEditor = new window.conversations.ManageInstructionRolesComponent(rolesFieldDiv, this.group, this.selectedInstruction, (updatedInstruction) => {
                // Callback to update the selected instruction when roles are changed in the roles editor
                this.selectedInstruction.info.roles = updatedInstruction.info.roles;
                this.updateButtonsArea();
            });

            // Update the page content with the content div
            this.page.updateContentArea(contentDiv);

            // Create page buttons once
            this.createButtonsArea();

        }

        createButtonsArea() {
            const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            
            // Create buttons and store references
            this.undoButton = new window.ButtonComponent(pageButtons, {
                label: '↩️',
                onClick: () => this.undoChanges(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '↩️ Undo changes',
                disabled: true
            });
            
            this.saveButton = new window.ButtonComponent(pageButtons, {
                label: '💾',
                onClick: () => this.saveInstruction(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '💾 Save instruction',
                disabled: true
            });
            
            new window.ButtonComponent(pageButtons, {
                label: '💡',
                onClick: () => this.showSeedData(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '💡 Seed data'
            });
            
            new window.ButtonComponent(pageButtons, {
                label: '+',
                onClick: () => this.addInstruction(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '+ Add instruction'
            });
            
            new window.ButtonComponent(pageButtons, {
                label: '🗙',
                onClick: () => this.deleteInstruction(),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: '🗙 Delete instruction'
            });

            this.page.updateButtonsArea(pageButtons);
            
            // Update button states based on current data
            this.updateButtonsArea();
        }

        updateButtonsArea() {
            const hasChanges = !_.isEqual(this.selectedInstruction, this.selectedInstructionOrig);
            
            // Toggle disabled state of Save and Undo buttons
            if (this.saveButton && this.undoButton) {
                this.saveButton.setDisabled(!hasChanges);
                this.undoButton.setDisabled(!hasChanges);
            }
        }

        // Load the seed data for the selected instruction
        async loadSelectedInstructionsSeed() {
            const seedsInstructions = await window.conversations.apiSeeds.seedsInstructionsGet(null, this.group.group_key, this.selectedInstruction.info.instruction_key);
            if (seedsInstructions.length > 0) {
                if (seedsInstructions[0].json.instruction_key === this.selectedInstruction.info.instruction_key) {
                    this.selectedInstructionsSeed = seedsInstructions[0];
                } else {
                    // This should not happen since we fetched the seed data using the selected instruction key, 
                    // but just in case, we check that the instruction key of the fetched seed data matches the selected 
                    // instruction key. If it doesn't match, we ignore the seed data and set it to null.
                    console.error('Seed data instruction key does not match the selected instruction key. That should not happen since we fetched the seed data using the selected instruction key. Seed data instruction key: ', seedsInstructions[0].instructions.info.instruction_key, 'Selected instruction key: ', this.selectedInstruction.info.instruction_key);
                    this.selectedInstructionsSeed = null;
                }
            } else {
                this.selectedInstructionsSeed = null;
            }
        }

        // Show seed data differences in a popup with options to 
        // override seed data with current instruction data or to 
        // reload current instruction data from seed data
        showSeedData() {
            const popup = new window.PopupComponent({
                icon: '💡',
                title: 'Instruction Seed Data - ' + this.selectedInstruction.info.name,
                width: 1200,
                height: 720,
                content: (container) => {
                    new window.conversations.ManageInstructionsSeedCompareComponent(
                        container,
                        this.groupId,
                        this.group.group_name,
                        this.group.group_key,
                        this.selectedInstruction,
                        this.selectedInstructionsSeed,
                        () => {
                            // onReloadFromSeed callback
                            popup.hide();
                            this.loadContent();
                        },
                        () => {
                            // onOverrideSeed callback
                            popup.hide();
                            this.loadContent();
                        }
                    );
                },
            });
            popup.show();
        }

        // Undo changes
        async undoChanges() {
            this.selectedInstruction = _.cloneDeep(this.selectedInstructionOrig);
            this.loadContent();
        }

        // Save the selected instruction
        async saveInstruction() {
            // Call API to save
            try {
                await window.conversations.apiInstructions.instructionsUpdate(null, this.groupId, this.selectedInstruction.info);
                new window.AlertComponent('Save instructions', 'Instructions has been saved successfully.');
                this.loadContent();
            } catch (error) {
                console.error('Error saving instructions:', error);
                new window.AlertComponent('Save instructions', 'Failed to save instructions.');
            }
        }

        // Delete the selected instruction
        async deleteInstruction() {
            new window.AlertComponent('Delete Instructions', 'Are you sure you want to delete these instructions?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.apiInstructions.instructionsDelete(null, this.groupId, this.selectedInstructionKey);

                    // Clear selected instruction type
                    this.selectedInstructionKey = null;

                    // Reload content
                    this.loadContent();
                }],
                ['Cancel', () => { }]
            ]);
        }

        // Add new instruction
        async addInstruction() {
            const popup = new window.PopupComponent({
                icon: this.manageOptions[this.optionId].icon,
                title: 'Import ' + window.conversations.CONVERSATION_TYPES_STRING(this.manageOptions[this.optionId].info.conversationType, false, true, false, false),
                width: 1200,
                height: 720,
                content: (container) => {
                    const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
                    
                    // Create seed import component - filter by conversation type
                    const conversationType = this.manageOptions[this.optionId].info.conversationType;
                    let seedTypes = [];
                    if (conversationType === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
                        seedTypes = [window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS];
                    } else if (conversationType === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
                        seedTypes = [window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS];
                    }
                    
                    new window.conversations.ManageGroupSeedsImportComponent(
                        wrapperDiv,
                        this.group,
                        seedTypes
                    );
                },
                onClose: () => {
                    // Reload the instruction list after popup closes
                    this.loadContent();
                }
            });
            popup.show();

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsComponent = ManageInstructionsComponent;
})();
