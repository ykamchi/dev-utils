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
            this.selectedInstructionsKey = null;
            this.instructions = [];
            this.instructionsEditor = null;
            this.selectedInstructionsSeed = null;
            this.group = null;
            this.page = null;
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
                this.page.updateButtonsArea(null);

            } else {
                // Set the selected instruction as the first one if not already selected
                if (!this.selectedInstructionsKey) {
                    // Set to first instruction type by default
                    this.selectedInstructionsKey = this.instructions[0].instructions_key;

                } else {
                    // Continue using the existing selected instruction type
                }

                // Add select component with first instruction as default
                const selectInstructionDiv = window.conversations.utils.createDivContainer(controlDiv);
                window.conversations.utils.createLabel(selectInstructionDiv, 'Select Instruction:');
                new window.SelectComponent(
                    selectInstructionDiv,
                    this.instructions.map(entry => ({ label: entry.info.name, value: entry.instructions_key })).sort((a, b) => a.label.localeCompare(b.label)),
                    async (selectedType) => {
                        this.selectedInstructionsKey = selectedType;
                        this.loadSelectedInstructions();
                    },
                    'Select an instruction...',
                    this.selectedInstructionsKey
                );

                // Load the selected instruction details
                this.loadSelectedInstructions();
                this.page.updateControlArea(controlDiv);
            }
        }

        async loadSelectedInstructions() {
            // Load the seed data for the selected instruction
            await this.loadSelectedInstructionsSeed();

            // Find the selected instruction using the selectedInstructionsKey
            this.selectedInstruction = this.instructions.find(entry => entry.instructions_key === this.selectedInstructionsKey);

            // Update the page content with the instructions editor
            const contentDiv = window.conversations.utils.createDivContainer();
            this.instructionsEditor = new window.conversations.ManageInstructionsEditorComponent(contentDiv, this.groupId, this.selectedInstruction);
            this.page.updateContentArea(contentDiv);

            // Save, Add and Delete instructions button
            const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(pageButtons, '💾', () => this.saveInstruction(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');
            new window.ButtonComponent(pageButtons, '+', () => this.addInstruction(), window.ButtonComponent.TYPE_GHOST, '+ Add instruction');
            new window.ButtonComponent(pageButtons, '🗙', () => this.deleteInstruction(), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete instruction');

            if (!this.compareSeedToCurrent()) {
                new window.ButtonComponent(pageButtons, '💡 Seed data', () => this.showSeedData(), window.ButtonComponent.TYPE_GHOST_DANGER, '💡 Seed data');
            }
            this.page.updateButtonsArea(pageButtons);
        }

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

        compareSeedToCurrent() {
            if (!this.selectedInstructionsSeed) {
                return false;
            }
            if (!_.isEqual(this.selectedInstruction.info, this.selectedInstructionsSeed.info) ||
                !_.isEqual(this.selectedInstruction.feedback_def, this.selectedInstructionsSeed.feedback_def) ||
                this.selectedInstruction.instructions !== this.selectedInstructionsSeed.instructions) {
                return false;
            }
            return true;
        }

        async loadSelectedInstructionsSeed() {
            const seedsInstructions = await window.conversations.apiSeeds.seedsInstructionsGet(null, this.group.group_key, this.selectedInstructionsKey);
            console.log('Loaded seedsInstructions:', seedsInstructions);
            if (seedsInstructions.length > 0) {
                this.selectedInstructionsSeed = {
                    instructions: seedsInstructions[0].instructions,
                    feedback_def: seedsInstructions[0].json_feedback,
                    info: seedsInstructions[0].json_info,
                };
            } else {
                this.selectedInstructionsSeed = null;
            }
        }

        // Save the selected instruction
        async saveInstruction() {
            const updatedInstructions = this.instructionsEditor.updatedInstructions();
            const selectedInstruction = this.instructions.find(entry => entry.instructions_key === this.selectedInstructionsKey);
            // Check if data has changed
            if (_.isEqual(selectedInstruction.feedback_def, updatedInstructions.feedback_def) &&
                selectedInstruction.instructions === updatedInstructions.instructions &&
                _.isEqual(selectedInstruction.info, updatedInstructions.info)) {
                new window.AlertComponent('Save', 'No changes detected, save skipped.');
                return;
            }

            // Call API to save
            await window.conversations.apiInstructions.instructionsUpdate(null, this.groupId,
                selectedInstruction.instructions_key,
                updatedInstructions.instructions,
                updatedInstructions.feedback_def,
                updatedInstructions.info
            );
            new window.AlertComponent('Save instructions', 'Instructions has been saved successfully.');
            this.loadContent();
        }

        // Delete the selected instruction
        async deleteInstruction() {
            new window.AlertComponent('Delete Instructions', 'Are you sure you want to delete these instructions?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.apiInstructions.instructionsDelete(null, this.groupId, this.selectedInstructionsKey);

                    // Clear selected instruction type
                    this.selectedInstructionsKey = null;

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
                title: 'Add new ' + window.conversations.CONVERSATION_TYPES_STRING(this.manageOptions[this.optionId].info.conversationType, false, true, false, false),
                width: 720,
                height: 720,
                content: (container) => {
                    const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
                    const buttonContainer = window.conversations.utils.createDivContainer(wrapperDiv, 'conversations-buttons-container');

                    // Save instructions button
                    new window.ButtonComponent(buttonContainer, '💾', async () => {
                        const updatedData = instructionsEditor.updatedInstructions();
                        const result = await window.conversations.apiInstructions.instructionsAdd(
                            null,
                            null,
                            this.groupId,
                            updatedData.instructions,
                            updatedData.feedback_def,
                            updatedData.info
                        );
                        popup.hide();
                        this.selectedInstructionsKey = result.data.instructions_key;
                        this.loadContent();

                    }, window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');

                    // Call API to add
                    const info = window.conversations.DEFAULT_INFO;
                    info.conversation_type = this.manageOptions[this.optionId].info.conversationType;
                    const instructions = {
                        info: info,
                        instructions: window.conversations.DEFAULT_INSTRUCTIONS,
                        feedback_def: window.conversations.DEFAULT_FEEDBACK_DEF
                    }

                    const editorDiv = window.conversations.utils.createDivContainer(wrapperDiv);
                    const instructionsEditor = new window.conversations.ManageInstructionsEditorComponent(editorDiv, this.groupId, instructions);
                },
            });
            popup.show();

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsComponent = ManageInstructionsComponent;
})();
