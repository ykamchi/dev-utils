 (function () {
    /*
        ManageInstructionRolesComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageInstructionRolesComponent {
        constructor(container, group, instruction, onChange) {
            this.container = container;
            this.feedbackTab = null;
            this.group = group;
            this.groupId = group.group_id;
            this.onChange = onChange;
            // To make the edit easier, convert feedback_def from object to array
            // This allows easier editing of the feedback name
            this.instruction = this.getInstructionsForEditing(instruction);
            this.feedbackDefContainer = null;
            this.render();
        }
        
        render() {
            this.container.innerHTML = '';

            // Create tabset for roles, with an additional tab for adding a new role
            const tabsetDiv = window.conversations.utils.createDivContainer(this.container, 'conversation-container-vertical');

            // Add tabs for each role in the instruction, plus an additional tab for adding a new role
            const storageKey = `conversations-instruction-editor-${this.groupId}-${this.instruction.instructions_key}`;
            const rolesTabs = [];
            Object.entries(this.instruction.info.roles).forEach(([role, roleDef]) => {
                rolesTabs.push({ name: roleDef.role_name, populateFunc: (c) => this.populateRoleTab(c, role, roleDef) });
            });
            rolesTabs.push({ name: '+ Add role', populateFunc: (c) => this.populateAddRoleTab(c) });

            const tabsetFieldDiv = window.conversations.utils.createDivContainer(tabsetDiv, 'conversation-field-container-vertical-full');
            window.conversations.utils.createLabel(tabsetFieldDiv, 'Roles:');
            new window.TabsetComponent(tabsetFieldDiv, rolesTabs, storageKey);
        }

        populateAddRoleTab(container) {
            // Use the new component to handle seed fetching and display
            new window.conversations.ManageInstructionsSeedRoleComponent(
                container,
                this.group,
                (rolesToCopy) => {
                    // Callback: add the copied roles to current instruction
                    rolesToCopy.forEach(roleToCopy => {
                        const newRoleKey = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        this.instruction.info.roles[newRoleKey] = JSON.parse(JSON.stringify(roleToCopy));
                        this.instruction.info.roles[newRoleKey].role_name += ' Copy';
                    });
                    this.render();
                }
            );
        }

        populateRoleTab(container, role, roleDef) {
            // Vertical wrapper for the whole role tab content
            const verticalWrapper = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            // Add buttons container
            const buttonContainer = window.conversations.utils.createDivContainer(verticalWrapper, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '+ Add feedback field',
                onClick: () => this.handleAddFeedback(role, roleDef),
                type: window.ButtonComponent.TYPE_GHOST
            });

            // Horizontal wrapper for role details and feedback definitions
            const horizontalWrapper = window.conversations.utils.createDivContainer(verticalWrapper, 'conversation-container-horizontal-space-between');

            // Left side: Role details
            const systemPromptContainer = window.conversations.utils.createDivContainer(horizontalWrapper, 'conversation-container-vertical');

            const nameAndRangeDiv = window.conversations.utils.createDivContainer(systemPromptContainer, 'conversation-container-horizontal');

            // Role name (editable)
            window.conversations.utils.createInput(nameAndRangeDiv, 'Role Name:', {
                initialValue: roleDef.role_name,
                // pattern: /^[a-zA-Z_]+$/,
                placeholder: 'e.g., Interviewer',
                onChange: (value) => {
                    roleDef.role_name = value;
                    this.onChange(this.getOrigInstructions(this.instruction));
                }
            });

            // Participants field
            window.conversations.utils.createRange(nameAndRangeDiv, 'Participants (min - max):', roleDef.min, roleDef.max, (range) => {
                roleDef.min = range.min; roleDef.max = range.max;
                this.onChange(this.getOrigInstructions(this.instruction));
            });

            // Role description (editable)
            window.conversations.utils.createTextArea(systemPromptContainer,  'Role Description:', {
                initialValue: roleDef.role_description,
                placeholder: 'Role initial system prompt',
                onChange: (value) => {
                    roleDef.role_description = value;
                    this.onChange(this.getOrigInstructions(this.instruction));
                },
                rows: 2
            });
        
            // System Prompt field
            window.conversations.utils.createTextArea(systemPromptContainer,  'System Prompt:', {
                initialValue: roleDef.system_prompt,
                placeholder: 'Role initial system prompt',
                onChange: (value) => {
                    roleDef.system_prompt = value;
                    this.onChange(this.getOrigInstructions(this.instruction));
                }
            });

            // Right side: Feedback Definitions
            const feedbackContainer = window.conversations.utils.createDivContainer(horizontalWrapper, 'conversation-container-vertical');
            this.feedbackDefContainer = window.conversations.utils.createDivContainer(feedbackContainer, 'conversation-field-container-vertical-full');            
            this.populateFeedbackEditor(role, roleDef);
        }

        // Populate Feedback tab
        populateFeedbackEditor(role, roleDef) {
            // Clear existing content - populateFeedbackEditor may be called multiple times
            this.feedbackDefContainer.innerHTML = '';

            const wrapper = window.conversations.utils.createDivContainer(this.feedbackDefContainer, 'conversation-container-vertical');
            if (roleDef.feedback_def.length === 0) {
                window.conversations.utils.createReadOnlyText(wrapper, 'No feedback definitions found.', 'conversations-message-empty');
                return;
            }

            console.log('Populating feedback editor for role', role, 'with feedback definitions', roleDef.feedback_def, this.instruction.info.roles[role].feedback_def);
            // container, items, renderItemFunction, selectionMode = ListComponent.SELECTION_MODE_NONE, onSelect = null, filterCondition = null
            new window.ListComponent(wrapper, roleDef.feedback_def, 
                (feedback_def) => {
                    const feedbackDiv = document.createElement('div');
                    
                    // Name (editable)
                    window.conversations.utils.createInput(feedbackDiv, 'Name:', {
                        initialValue: feedback_def.feedbackName,
                        pattern: /^[a-z_]+$/,
                        placeholder: 'e.g., feedback_name',
                        onChange: (value) => {
                            feedback_def.feedbackName = value;
                            this.onChange(this.getOrigInstructions(this.instruction));
                        }
                    });
                    
                    // Description field (editable)
                    window.conversations.utils.createTextArea(feedbackDiv, 'Description:', {
                        initialValue: feedback_def.description,
                        placeholder: 'Detail description of the feedback',
                        rows: 2,
                        onChange: (value) => {
                            feedback_def.description = value;
                            this.onChange(this.getOrigInstructions(this.instruction));
                        }
                    });

                    // Type field (editable)
                    // TODO: Create a util function for creating labeled select fields
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
                            this.onChange(this.getOrigInstructions(this.instruction));
                        },
                        'Select type ...',
                        feedback_def.type
                    );

                    // Options Area
                    const feedbackTypeOptionsContainer  = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, feedback_def);

                    const buttonContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversations-buttons-container');

                    // TODO: Need to decide where to store the "important" flag in the instruction object, and how to handle it in the UI (e.g., show important feedback fields at the top of the list, or with a badge)
                    new window.CheckboxComponent(buttonContainer,this.instruction.info.meta?.feedbackImportant?.[feedback_def.feedbackName],(checked) => { 
                        if (!this.instruction.info.meta) this.instruction.info.meta = {};
                        if (!this.instruction.info.meta.feedbackImportant) this.instruction.info.meta.feedbackImportant = {};
                        this.instruction.info.meta.feedbackImportant[feedback_def.feedbackName] = checked;
                    },'Show on list');

                    // Required checkbox
                    new window.CheckboxComponent(buttonContainer,feedback_def.required,(checked) => {
                        feedback_def.required = checked;
                        this.onChange(this.getOrigInstructions(this.instruction));
                    },'Required');

                    // Add delete button
                    new window.ButtonComponent(buttonContainer, {
                        label: '🗙',
                        onClick: () => {
                            roleDef.feedback_def = roleDef.feedback_def.filter(fd => fd.feedbackName !== feedback_def.feedbackName);
                            this.populateFeedbackEditor(role, roleDef);
                            this.onChange(this.getOrigInstructions(this.instruction));
                        },
                        type: window.ButtonComponent.TYPE_GHOST_DANGER,
                        tooltip: '🗙 Delete feedback field'
                    });
                    
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
                        this.onChange(this.getOrigInstructions(this.instruction));
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
                        this.onChange(this.getOrigInstructions(this.instruction));
                    }, window.StringArrayComponent.STYLE_WRAP);

            }
        }

        // Handle adding a new feedback definition
        handleAddFeedback(role, roleDef) {
            let nextIndex = 1;
            while (roleDef.feedback_def.find(fd => fd.feedbackName === `feedback_${nextIndex}`)) {
                nextIndex++;
            }
            roleDef.feedback_def.push({
                feedbackName: `feedback_${nextIndex}`,
                description: 'Description of the feedback field',
                type: 'integer', min: 0, max: 10, required: true
            });
            this.populateFeedbackEditor(role, roleDef);
            this.onChange(this.getOrigInstructions(this.instruction));
        }

        // Convert feedback_def from object to array for easier editing, and deep clone the instruction object to avoid mutating the original
        getInstructionsForEditing(origInstruction) {
            const ret = _.cloneDeep(origInstruction);
            Object.values(ret.info.roles).forEach(role => {
                role.feedback_def = Object.entries(role.feedback_def).map(([feedbackName, feedbackDef]) => ({
                    feedbackName,
                    ...feedbackDef
                }));
            });
            console.log('getInstructionsForEditing', ret);
            return ret;
        }

        // Convert feedback_def from array back to object for saving
        getOrigInstructions(instructionForEditing) {
            const ret = _.cloneDeep(instructionForEditing);
            Object.values(ret.info.roles).forEach(role => {
                role.feedback_def = role.feedback_def.reduce((acc, feedbackDef) => {
                    const { feedbackName, ...rest } = feedbackDef;
                    acc[feedbackName] = rest;
                    return acc;
                }, {});
            });
            return ret;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionRolesComponent = ManageInstructionRolesComponent;
})();
