(function () {
    /*
        ManageInstructionsEditorComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageInstructionsEditorComponent {
        constructor(container, groupName, instruction) {
            this.container = container;
            this.groupName = groupName;
            this.instruction = instruction;
            this.tabsetDiv = null;
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create tabset for Info, Instructions, Feedback
            this.tabsetDiv = window.conversations.utils.createDivContainer(this.container, 'conversations-manage-instruction-editor-tabset-div');
            this.tabsetDiv.className = 'conversations-manage-instruction-editor-tabset';

            // Add tabs for instruction details
            const storageKey = `conversations-instruction-editor-${this.groupName}-${this.instruction.instructions_type}`;
            new window.TabsetComponent(this.tabsetDiv, [
                { name: 'Info', populateFunc: (c) => this.renderInfoTab(c) },
                { name: 'Instructions', populateFunc: (c) => this.renderInstructionsEditorTab(c) },
                { name: 'Feedback', populateFunc: (c) => this.renderFeedbackTab(c) }
            ], storageKey, this.onTabSwitch.bind(this));
        }

        onTabSwitch(tabName) {
            // Currently no specific actions on tab switch
        }

        // Render Info tab
        renderInfoTab(container) {
            container.innerHTML = '';
            container.className = 'conversations-instruction-editor-tab';

            // Name field (editable)
            const infoNameGroup = window.conversations.utils.createDivContainer(container, 'conversations-instruction-scrollable-group');
            window.conversations.utils.createLabel(infoNameGroup, 'Name:');
            window.conversations.utils.createPatternTextInput(infoNameGroup, 'conversations-instruction-name-input', this.instruction.info.name);
            
            // Conversation Type field (read-only)
            const infoConversationTypeGroup = window.conversations.utils.createDivContainer(container, 'conversations-instruction-scrollable-group');
            window.conversations.utils.createLabel(infoConversationTypeGroup, 'Conversation Type:');
            window.conversations.utils.createReadOnlyText(infoConversationTypeGroup, 'conversations-instruction-conversation-type-value', this.instruction.info.conversation_type);

            // Instructions type field (read-only)
            const infoTypeGroup = window.conversations.utils.createDivContainer(container, 'conversations-instruction-scrollable-group');
            window.conversations.utils.createLabel(infoTypeGroup, 'Instructions Type:');
            // window.conversations.utils.createReadOnlyText(infoTypeGroup, 'conversations-instruction-type-value', this.instruction.info.type);
            window.conversations.utils.createPatternTextInput(infoTypeGroup, 'conversations-instruction-type-value', this.instruction.info.type, /^[a-z-]+$/, 'e.g., custom_instruction_type');

            // Description field (editable)
            const infoDescriptionGroup = window.conversations.utils.createDivContainer(container);
            window.conversations.utils.createLabel(infoDescriptionGroup, 'Description:');
            window.conversations.utils.createTextArea(infoDescriptionGroup, 'conversations-instruction-description-textarea', this.instruction.info.description, 3);
        }

        // Render Instructions Editor tab
        renderInstructionsEditorTab(container) {
            container.innerHTML = '';
            container.className = 'conversations-instruction-editor-tab';

            // Instructions field (editable)
            const instructionsGroup = window.conversations.utils.createDivContainer(container);
            instructionsGroup.style.flex = '1'; //TODO: Move to CSS
            window.conversations.utils.createLabel(instructionsGroup, 'Instructions:');
            window.conversations.utils.createTextArea(instructionsGroup, 'conversations-instruction-instructions-textarea', this.instruction.instructions);
        }

        // Render Feedback tab
        renderFeedbackTab(container) {
            container.innerHTML = '';
            container.className = 'conversations-instruction-editor-tab';
            container.id = 'conversations-instruction-feedback-tab';

            // Add button container below tabset
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container', 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '+ Add feedback', () => this.handleAddFeedback(), window.ButtonComponent.TYPE_GHOST);

            const feedbackEntries = Object.entries(this.instruction.feedback_def);

            if (feedbackEntries.length === 0) {
                const emptyMsg = window.conversations.utils.createDivContainer(container);
                emptyMsg.className = 'conversations-instruction-field-empty';
                emptyMsg.textContent = 'No feedback definitions found.';
                container.appendChild(emptyMsg);
                return;
            }

            const feedbackCards = window.conversations.utils.createDivContainer(container, null, 'conversations-instruction-scrollable-group');
            feedbackEntries.forEach(([fieldName, fieldDef], index) => {
                const feedbackCard = window.conversations.utils.createDivContainer(feedbackCards, `conversations-feedback-card-${index}`, 'conversations-feedback-card');

                // Name (editable)
                const feedbackNameGroup = window.conversations.utils.createDivContainer(feedbackCard);
                window.conversations.utils.createLabel(feedbackNameGroup, 'Name:');
                window.conversations.utils.createPatternTextInput(
                    feedbackNameGroup, 
                    `conversations-feedback-name-input-${index}`, 
                    fieldName,
                    /^[a-z_]+$/,
                    'e.g., feedback_name'
                );

                // Description field (editable)
                const feedbackDescriptionGroup = window.conversations.utils.createDivContainer(feedbackCard);
                window.conversations.utils.createLabel(feedbackDescriptionGroup, 'Description:');
                window.conversations.utils.createTextArea(feedbackDescriptionGroup, `conversations-feedback-description-textarea-${index}`, fieldDef.description, 2);

                const typeContainer = window.conversations.utils.createDivContainer(feedbackCard);
                typeContainer.className = 'conversations-feedback-type-container';

                // Type field (editable)
                const feedbackTypeContainer = window.conversations.utils.createDivContainer(typeContainer);
                window.conversations.utils.createLabel(feedbackTypeContainer, 'Type:');
                const feedbackTypeSelectContainer = window.conversations.utils.createDivContainer(feedbackTypeContainer, `conversations-feedback-type-select-${index}`);
                new window.SelectComponent(
                    feedbackTypeSelectContainer,
                    [ { label: 'Integer', value: 'integer' }, { label: 'String', value: 'string' } ],
                    (value) => { 
                        fieldDef = { type: value };
                        this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, index, fieldDef);
                    },
                    'Select type ...',
                    fieldDef.type
                );

                // Options Area
                const feedbackTypeOptionsContainer  = window.conversations.utils.createDivContainer(typeContainer, `conversations-feedback-type-options-container-${index}`);
                this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, index, fieldDef);

                const buttonContainer = window.conversations.utils.createDivContainer(feedbackCard, null, 'conversations-buttons-container');
                new window.ButtonComponent(buttonContainer, '🗙', () => {   
                    delete this.instruction.feedback_def[fieldName];
                    this.renderFeedbackTab(container);
                }, window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete feedback');
            });
        }

        renderFeedbackTypeOptions(container, feedbackIndex, fieldDef) {
            container.innerHTML = '';

            if (fieldDef.type === 'integer') {
                // Use RangeComponent for integer type
                window.conversations.utils.createLabel(container, 'Value Range:');
                container.rangeComponent = new window.RangeComponent(container, fieldDef.min, fieldDef.max);

            } else if (fieldDef.type === 'string') {
                // Optional values field - store reference on the container for later retrieval
                window.conversations.utils.createLabel(container, 'Optional Values:');
                container.stringArrayComponent = new window.StringArrayComponent(container, fieldDef['optional-values'], 'Add optional value...', window.StringArrayComponent.STYLE_WRAP);

            }
        }

        handleAddFeedback() {
            this.instruction.feedback_def['new_feedback_field'] = {
                description: 'Description of the new feedback field',
                type: 'integer',
                min: 0,
                max: 10, 
                required: true
            };
            // Re-render Feedback tab
            const feedbackTab = this.tabsetDiv.querySelector('#conversations-instruction-feedback-tab');
            this.renderFeedbackTab(feedbackTab);
        }

        updatedInstructions() {
            const updatedData = {
                info: {
                    name: this.container.querySelector('#conversations-instruction-name-input').getValue(),
                    description: this.container.querySelector('#conversations-instruction-description-textarea').value,
                    conversation_type: this.container.querySelector('#conversations-instruction-conversation-type-value').textContent,
                    type: this.container.querySelector('#conversations-instruction-type-value').getValue()
                },
                instructions: this.container.querySelector('#conversations-instruction-instructions-textarea').value,
                feedback_def: {}
            };

            // Fill Feedback values
            const feedbackCards = this.container.querySelector('#conversations-instruction-feedback-tab').querySelectorAll('.conversations-feedback-card');
            feedbackCards.forEach((card, index) => {
                const feedbackName = card.querySelector(`#conversations-feedback-name-input-${index}`).getValue();
                const feedbackDescription = card.querySelector(`#conversations-feedback-description-textarea-${index}`).value;
                const feedbackTypeContainer = card.querySelector(`#conversations-feedback-type-select-${index}`);
                const feedbackType = feedbackTypeContainer.querySelector('select').value;
                updatedData.feedback_def[feedbackName] = {
                    description: feedbackDescription,
                    type: feedbackType,
                    required: true
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
            return updatedData;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsEditorComponent = ManageInstructionsEditorComponent;
})();
