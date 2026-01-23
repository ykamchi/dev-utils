(function () {
    /*
        ManageInstructionsEditorComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageInstructionsEditorComponent {
        constructor(container, groupName, instruction) {
            this.container = container;
            this.feedbackTab = null;
            this.groupName = groupName;

            // To make the edit easier, convert feedback_def from object to array
            // This allows easier editing of the feedback name
            this.instruction = JSON.parse(JSON.stringify(instruction));
            this.instruction.feedback_def = Object.entries(this.instruction.feedback_def).map(([feedbackName, feedbackDef]) => ({
                feedbackName,
                ...feedbackDef
            }));
            this.render();
        }
        
        render() {
            // Create tabset for Info, Instructions, Feedback
            const tabsetDiv = window.conversations.utils.createDivContainer(this.container);

            // Add tabs for instruction details
            const storageKey = `conversations-instruction-editor-${this.groupName}-${this.instruction.instructions_type}`;
            new window.TabsetComponent(tabsetDiv, [
                { name: 'Info', populateFunc: (c) => this.populateInfoTab(c) },
                { name: 'Instructions', populateFunc: (c) => this.populateInstructionsEditorTab(c) },
                { name: 'Feedback', populateFunc: (c) => { this.feedbackTab = c; this.populateFeedbackTab(c); } }
            ], storageKey);
        }

        // Populate Info tab
        populateInfoTab(container) {
            // Name field (editable)
            const infoNameGroup = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(infoNameGroup, 'Name:');
            new window.TextInputComponent(infoNameGroup, this.instruction.info.name, /^[a-zA-Z0-9 _-]+$/, 'e.g., My Instruction Name', (value, isValid) => {
                this.instruction.info.name = value;
            });
            
            // Conversation Type field (read-only)
            const infoConversationTypeGroup = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(infoConversationTypeGroup, 'Conversation Type:');
            window.conversations.utils.createReadOnlyText(infoConversationTypeGroup, this.instruction.info.conversation_type);

            // Instructions type field (read-only)
            const infoTypeGroup = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(infoTypeGroup, 'Instructions Type:');
            new window.TextInputComponent(infoTypeGroup, this.instruction.info.type, /^[a-z-]+$/, 'e.g., custom_instruction_type', (value, isValid) => {
                this.instruction.info.type = value;
            });

            // Description field (editable)
            const infoDescriptionGroup = window.conversations.utils.createDivContainer(container);
            window.conversations.utils.createLabel(infoDescriptionGroup, 'Description:');
            new window.TextAreaComponent(infoDescriptionGroup, this.instruction.info.description, 'Description', (value) => {
                this.instruction.info.description = value;
            });
        }

        // Populate Instructions Editor tab
        populateInstructionsEditorTab(container) {
            // Instructions field (editable)
            const instructionsGroup = window.conversations.utils.createDivContainer(container);
            instructionsGroup.style.flex = '1'; //TODO: Move to CSS
            window.conversations.utils.createLabel(instructionsGroup, 'Instructions:');
            new window.TextAreaComponent(instructionsGroup, this.instruction.instructions, 'Conversation instructions', (value) => {
                this.instruction.instructions = value;
            });
        }

        // Populate Feedback tab
        populateFeedbackTab(container) {
            // Clear existing content - populateFeedbackTab may be called multiple times
            container.innerHTML = '';

            // Add button container below tabset
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '+ Add feedback field', () => this.handleAddFeedback(), window.ButtonComponent.TYPE_GHOST);

            if (this.instruction.feedback_def.length === 0) {
                window.conversations.utils.createReadOnlyText(container, 'No feedback definitions found.', 'conversations-message-empty');
                return;
            }

            // container, items, renderItemFunction, selectionMode = ListComponent.SELECTION_MODE_NONE, onSelect = null, filterCondition = null
            new window.ListComponent(container, this.instruction.feedback_def, 
                (feedback_def) => {
                    const feedbackDiv = document.createElement('div');
                    
                    // Name (editable)
                    const feedbackNameGroup = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(feedbackNameGroup, 'Name:');
                    new window.TextInputComponent(feedbackNameGroup, feedback_def.feedbackName, /^[a-z_]+$/, 'e.g., feedback_name', (value, isValid) => {
                        feedback_def.feedbackName = value;
                    });
                    
                    // Description field (editable)
                    const feedbackDescriptionGroup = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(feedbackDescriptionGroup, 'Description:');
                    new window.TextAreaComponent(feedbackDescriptionGroup, feedback_def.description, 2, (value) => {
                        feedback_def.description = value;
                    });

                    // Type field (editable)
                    const feedbackTypeContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(feedbackTypeContainer, 'Type:');
                    const feedbackTypeSelectContainer = window.conversations.utils.createDivContainer(feedbackTypeContainer);
                    new window.SelectComponent(
                        feedbackTypeSelectContainer,
                        [ { label: 'Integer', value: 'integer' }, { label: 'String', value: 'string' } ],
                        (value) => { 
                            feedback_def.type = value;
                            // Clear other type-specific properties
                            delete feedback_def.min;
                            delete feedback_def.max;
                            delete feedback_def['optional-values'];
                            this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, feedback_def);
                        },
                        'Select type ...',
                        feedback_def.type
                    );

                    // Options Area
                    const feedbackTypeOptionsContainer  = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, feedback_def);

                    const buttonContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversations-buttons-container');

                    new window.CheckboxComponent(buttonContainer,this.instruction.info.meta?.feedbackImportant?.[feedback_def.feedbackName],(checked) => { 
                        if (!this.instruction.info.meta) this.instruction.info.meta = {};
                        if (!this.instruction.info.meta.feedbackImportant) this.instruction.info.meta.feedbackImportant = {};
                        this.instruction.info.meta.feedbackImportant[feedback_def.feedbackName] = checked;
                    },'Show on list');

                    // Required checkbox
                    new window.CheckboxComponent(buttonContainer,feedback_def.required,(checked) => {feedback_def.required = checked;},'Required');

                    // Add delete button
                    new window.ButtonComponent(buttonContainer, '🗙', () => {
                        this.instruction.feedback_def = this.instruction.feedback_def.filter(fd => fd.feedbackName !== feedback_def.feedbackName);
                        this.populateFeedbackTab(container);
                    }, window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete feedback field');
                    
                    return feedbackDiv;
                }
            );
        }

        // Render type-specific options for feedback definition
        renderFeedbackTypeOptions(container, feedback_def) {
            container.innerHTML = '';

            const feedbackTypeOptionsContainer = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');

            if (feedback_def.type === 'integer') {
                // Use RangeComponent for integer type
                window.conversations.utils.createLabel(feedbackTypeOptionsContainer, 'Value Range:');
                feedbackTypeOptionsContainer.rangeComponent = new window.RangeComponent(feedbackTypeOptionsContainer, 
                    feedback_def.min, feedback_def.max || 10,
                    (range) => {
                        feedback_def.min = range.min; feedback_def.max = range.max;
                    }
                );
                feedback_def.min = feedbackTypeOptionsContainer.rangeComponent.range.min;
                feedback_def.max = feedbackTypeOptionsContainer.rangeComponent.range.max;


            } else if (feedback_def.type === 'string') {
                // Optional values field - store reference on the container for later retrieval
                window.conversations.utils.createLabel(feedbackTypeOptionsContainer, 'Optional Values:');
                feedbackTypeOptionsContainer.stringArrayComponent = new window.StringArrayComponent(feedbackTypeOptionsContainer, 
                    feedback_def['optional-values'], 'Add optional value...', (values) => {
                        feedback_def['optional-values'] = values;
                    }, window.StringArrayComponent.STYLE_WRAP);

            }
        }

        // Handle adding a new feedback definition
        handleAddFeedback() {
            let nextIndex = 1;
            while (this.instruction.feedback_def.find(fd => fd.feedbackName === `feedback_${nextIndex}`)) {
                nextIndex++;
            }
            this.instruction.feedback_def.push({
                feedbackName: `feedback_${nextIndex}`,
                description: 'Description of the feedback field',
                type: 'integer', min: 0, max: 10, required: true
            });
            this.populateFeedbackTab(this.feedbackTab);
        }

        // Get the updated instruction object for saving
        updatedInstructions() {
            // Convert the instruction back to original format where feedback_def is an object
            const ret = {...this.instruction};
            ret.feedback_def = this.instruction.feedback_def.reduce((acc, feedbackDef) => {
                const { feedbackName, ...rest } = feedbackDef;
                acc[feedbackName] = rest;
                return acc;
            }, {});
            return ret;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsEditorComponent = ManageInstructionsEditorComponent;
})();
