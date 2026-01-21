(function () {
    /*
        ManageInstructionsComponent: displays instructions for a selected group in dev-tool-conversations
    */
    class ManageInstructionsComponent {
        constructor(container, groupName, optionId, manageOptions) {
            this.container = container;
            this.groupName = groupName;
            this.optionId = optionId;
            this.manageOptions = manageOptions;
            this.selectedInstructionType = null;
            this.instructions = [];
            this.instructionsEditor = null;
            this.page = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                [ this.groupName, this.manageOptions[this.optionId].description ]
            );

            // Save, Add and Delete instructions button
            const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(pageButtons, '💾', () => this.saveInstruction(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');
            new window.ButtonComponent(pageButtons, '+', () => this.addInstruction(), window.ButtonComponent.TYPE_GHOST, '+ Add instruction');
            new window.ButtonComponent(pageButtons, '🗙', () => this.deleteInstruction(), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete instruction');
            this.page.updateButtonsArea(pageButtons);

            // Load and display the content
            this.loadContent();
        }

        // Get the group available instructions and render them in tabs according to the conversation types
        async loadContent() {
            // Fetch instruction info
            this.instructions = await window.conversations.api.fetchGroupInstructions(null, this.groupName, this.manageOptions[this.optionId].info.conversationType);

            // Create content container for instruction details
            const tabContent = window.conversations.utils.createDivContainer();

            // Set the selected instruction as the first one and add select component
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            if (this.instructions.length > 0) {
                if (!this.selectedInstructionType) {
                    this.selectedInstructionType = this.instructions[0].instructions_type;
                }
                // Add select component with first instruction as default
                const selectInstructionWrapper = window.conversations.utils.createDivContainer(controlDiv);
                window.conversations.utils.createLabel(selectInstructionWrapper, 'Select Instruction:');
                new window.SelectComponent(
                    selectInstructionWrapper,
                    this.instructions.map(entry => ({ label: entry.info.name, value: entry.instructions_type })).sort((a, b) => a.label.localeCompare(b.label)),
                    (selectedType) => this.loadSelectedInstructions(tabContent, this.instructions, selectedType),
                    'Select an instruction...',
                    this.selectedInstructionType
                );
            }
            this.page.updateControlArea(controlDiv);

            // Render the first instruction details
            if (this.instructions.length === 0) {
                const noInstructionsMessage = window.conversations.utils.createReadOnlyText(tabContent, 'No instructions available for this conversation type.', 'conversations-message-empty');
                this.page.updateContentArea(noInstructionsMessage);
            } else {
                // Load details for the selected instruction type
                this.loadSelectedInstructions(tabContent, this.instructions, this.selectedInstructionType);
            }
        }

        loadSelectedInstructions(contentDiv, instructions, instructionType) {
            // Find the selected instruction using the instructionType
            const selectedInstruction = instructions.find(entry => entry.instructions_type === instructionType);
            
            // Update the instructions editor
            const content = window.conversations.utils.createDivContainer();
            this.instructionsEditor = new window.conversations.ManageInstructionsEditorComponent(content, this.groupName, selectedInstruction);
            this.page.updateContentArea(content);
        }

        // Save the selected instruction
        async saveInstruction() {
            const updatedInstructions = this.instructionsEditor.updatedInstructions();
            const selectedInstruction = this.instructions.find(entry => entry.instructions_type === this.selectedInstructionType);
            // Check if data has changed
            if (_.isEqual(selectedInstruction.feedback_def, updatedInstructions.feedback_def) &&
                selectedInstruction.instructions === updatedInstructions.instructions &&
                _.isEqual(selectedInstruction.info, updatedInstructions.info)) {
                new window.AlertComponent('Save', 'No changes detected, save skipped.');
                return;
            }

            // Call API to save
            await window.conversations.api.updateGroupInstructions(null, this.groupName,
                selectedInstruction.instructions_type,
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
                    await window.conversations.api.deleteGroupInstructions(null, this.groupName, this.selectedInstructionType);

                    // Clear selected instruction type
                    this.selectedInstructionType = null;

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
                title: 'View Profile Candidates',
                width: 420,
                height: 720,
                content: (container) => {
                    const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');

                    // Save instructions button
                    new window.ButtonComponent(buttonContainer, '💾', async () => {
                        const updatedData = instructionsEditor.updatedInstructions();
                        const result = await window.conversations.api.addGroupInstructions(
                            null,
                            this.groupName,
                            updatedData.instructions,
                            updatedData.feedback_def,
                            updatedData.info
                        );
                        popup.hide();
                        this.selectedInstructionType = result.data.instructions_type;
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

                    const editorDiv = window.conversations.utils.createDivContainer(container);
                    const instructionsEditor = new window.conversations.ManageInstructionsEditorComponent(editorDiv, this.groupName, instructions);
                },
            });
            popup.show();

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsComponent = ManageInstructionsComponent;
})();
