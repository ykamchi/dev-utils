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
            this.tabsetComponent = null;
            this.contentContainer = null;
            this.selectedInstruction = null;
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, null, 'conversations-page-details-wrapper');

            // Header
            const header = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-page-details-header');

            // Icon
            const icon = window.conversations.utils.createDivContainer(header, null, 'conversations-page-details-icon');
            icon.textContent = this.manageOptions[this.optionId].icon;

            // Info section
            const info = window.conversations.utils.createDivContainer(header, null, 'conversations-page-details-info');

            // Title
            const title = window.conversations.utils.createDivContainer(info, null, 'conversation-page-details-title');
            title.textContent = this.manageOptions[this.optionId].name;

            // Subtitle (group name and description)
            const subtitle = window.conversations.utils.createDivContainer(info, null, 'conversation-page-details-subtitle');
            subtitle.textContent = `${this.groupName} • ${this.manageOptions[this.optionId].description}`;
            
            // Content area
            this.contentContainer = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-manage-details-content');

            // Load the actual content
            this.loadContent();
        }

        // Get the group available instructions and render them in tabs according to the conversation types
        async loadContent() {
            // Show loading spinner
            new window.SpinnerComponent(this.contentContainer, { text: `Loading ${this.manageOptions[this.optionId].name.toLowerCase()}...` });

            // Fetch instruction info
            const instructions = await window.conversations.api.fetchGroupInstructions(this.groupName, this.manageOptions[this.optionId].info.conversationType);

            // // Clear loading spinner
            this.contentContainer.innerHTML = '';

            // Create tab header container
            const tabHeader = window.conversations.utils.createDivContainer(this.contentContainer, null, 'conversations-manage-instructions-tab-header');

            // Check if instructions are empty first, or set the selected instruction as the first one
            if (instructions.length === 0) {
                window.conversations.utils.createReadOnlyText(tabHeader, null, 'No instructions available for this conversation type.', 'conversations-member-profile-empty');
                return;
            } else {
                if (!this.selectedInstruction) {
                    this.selectedInstruction = instructions[0];
                }
            }

            // Create content container for instruction details
            const tabContent = window.conversations.utils.createDivContainer(this.contentContainer, null, 'conversations-manage-instructions-content');

            // Add select component with first instruction as default
            const selectInstructionWrapper = window.conversations.utils.createDivContainer(tabHeader);
            window.conversations.utils.createLabel(selectInstructionWrapper, 'Select Instruction:');
            new window.SelectComponent(
                selectInstructionWrapper,
                instructions.map(entry => ({ label: entry.info.name, value: entry.instructions_type })).sort((a, b) => a.label.localeCompare(b.label)),
                (selectedType) => this.renderInstructionsDetail(tabContent, instructions, selectedType),
                'Select an instruction...',
                this.selectedInstruction.instructions_type
            );

            // Add button container below tabset
            const selectAndButtonsDiv = window.conversations.utils.createDivContainer(tabHeader);
            const buttonsArea = window.conversations.utils.createDivContainer(selectAndButtonsDiv);
            window.conversations.utils.createLabel(buttonsArea, ''); // Placeholder for alignment
            const buttonContainer = window.conversations.utils.createDivContainer(buttonsArea, null, 'conversations-buttons-container');

            // Save instructions button
            new window.ButtonComponent(buttonContainer, '💾', () => this.saveInstruction(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');

            // Add instruction button
            new window.ButtonComponent(buttonContainer, '+', () => this.addInstruction(), window.ButtonComponent.TYPE_GHOST, '+ Add instruction');

            // Delete instruction button
            new window.ButtonComponent(buttonContainer, '🗙', () => this.deleteInstruction(), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete instruction');

            // Render the first instruction details
            this.renderInstructionsDetail(tabContent, instructions, this.selectedInstruction.instructions_type);
        }

        renderInstructionsDetail(contentDiv, instructions, selectedType) {
            this.selectedInstruction = instructions.find(entry => entry.instructions_type === selectedType);
            if (!this.selectedInstruction) {
                window.conversations.utils.createReadOnlyText(contentDiv, null, `Selected ${selectedType} instruction not found.`, 'conversations-member-profile-empty');
                return;
            }
            // Clear and use the new editor component
            contentDiv.innerHTML = '';
            new window.conversations.ManageInstructionsEditorComponent(contentDiv, this.groupName, this.selectedInstruction);
        }

        async saveInstruction() {
            // Prepare updated data object with defaults from this.instruction (Original)
            const updatedData = {
                info: {
                    name: this.contentContainer.querySelector('#conversations-instruction-name-input').getValue(),
                    description: this.contentContainer.querySelector('#conversations-instruction-description-textarea').value,
                    conversation_type: this.contentContainer.querySelector('#conversations-instruction-conversation-type-value').textContent,
                    type: this.contentContainer.querySelector('#conversations-instruction-type-value').getValue()
                },
                instructions: this.contentContainer.querySelector('#conversations-instruction-instructions-textarea').value,
                feedback_def: {}
            };

            // Fill Feedback values
            const feedbackCards = this.contentContainer.querySelector('#conversations-instruction-feedback-tab').querySelectorAll('.conversations-feedback-card');
            feedbackCards.forEach((card, index) => {
                const feedbackName = card.querySelector(`#conversations-feedback-name-input-${index}`).getValue();
                const feedbackDescription = card.querySelector(`#conversations-feedback-description-textarea-${index}`).value;
                const feedbackTypeContainer = card.querySelector(`#conversations-feedback-type-select-${index}`);
                const feedbackType = feedbackTypeContainer.querySelector('select').value;
                updatedData.feedback_def[feedbackName] = {
                    description: feedbackDescription,
                    type: feedbackType
                };

                if (feedbackType === 'integer') {
                    // Get range from RangeComponent
                    const optionalValuesContainer = card.querySelector(`#conversations-feedback-type-options-container-${index}`);
                    const range = optionalValuesContainer.rangeComponent.getRange();
                    updatedData.feedback_def[feedbackName].min = range.min;
                    updatedData.feedback_def[feedbackName].max = range.max;
                } else if (feedbackType === 'string') {
                    // Get values from StringArrayComponent
                    const optionalValuesContainer = card.querySelector(`#conversations-feedback-type-options-container-${index}`);
                    updatedData.feedback_def[feedbackName]['optional-values'] = optionalValuesContainer.stringArrayComponent.getValues();
                }
            });

            // Check if data has changed
            if (_.isEqual(this.selectedInstruction.feedback_def, updatedData.feedback_def) &&
                this.selectedInstruction.instructions === updatedData.instructions &&
                _.isEqual(this.selectedInstruction.info, updatedData.info)) {
                new window.AlertComponent('Save', 'No changes detected, save skipped.');
                return;
            }

            // Call API to save
            await window.conversations.api.updateGroupInstructions(this.groupName, this.selectedInstruction.instructions_type, updatedData.instructions, updatedData.feedback_def, updatedData.info);
            new window.AlertComponent('Save instructions', 'Instructions has been saved successfully.');
            this.loadContent();
        }

        async deleteInstruction() {
            new window.AlertComponent('Delete Instructions', 'Are you sure you want to delete these instructions?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.api.deleteGroupInstructions(this.groupName, this.selectedInstruction.instructions_type);
                    // Reload content
                    this.loadContent();
                }],
                ['Cancel', () => { }]
            ]);
        }

        async addInstruction() {
            // Call API to add
            const newInstructionInfo = window.conversations.DEFAULT_INFO;
            newInstructionInfo.conversation_type = this.tabsetComponent.activeTab;
            await window.conversations.api.addGroupInstructions(
                this.groupName,
                window.conversations.DEFAULT_INSTRUCTIONS,
                window.conversations.DEFAULT_FEEDBACK_DEF,
                newInstructionInfo
            );
            this.loadContent();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsComponent = ManageInstructionsComponent;
})();
