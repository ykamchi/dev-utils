(function () {
    /*
        ManageInstructionRolesComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageInstructionRolesComponent {
        constructor(container, group, roles, onChange, onRolesAdded, onRoleDeleted) {
            this.container = container;
            this.group = group;
            this.roles = roles;

            this.onChange = onChange;
            this.onRolesAdded = onRolesAdded;
            this.onRoleDeleted = onRoleDeleted;
            this.feedbackDefContainer = null;

            this.render();
        }

        render() {
            this.feedbackDefContainer = window.conversations.utils.createDivContainer(this.container, 'conversation-container-vertical-full');
            this.loadContent();
        }

        loadContent() {
            this.feedbackDefContainer.innerHTML = '';

            // Create tabset for roles, with an additional tab for adding a new role
            const tabsetDiv = window.conversations.utils.createDivContainer(this.feedbackDefContainer, 'conversation-container-vertical-full');

            // Add tabs for each role in the instruction, plus an additional tab for adding a new role
            const rolesTabs = [];
            console.log('Loading roles into ManageInstructionRolesComponent:', this.roles);
            this.roles.forEach(role => {
                rolesTabs.push({ name: role.role_name, populateFunc: (c) => this.populateRoleTab(c, role) });
            });
            rolesTabs.push({ name: '+ Add role', populateFunc: (c) => this.populateAddRoleTab(c) });
            new window.TabsetComponent(tabsetDiv, rolesTabs, `conversations-instruction-editor-${this.group.group_id}`);
        }

        handleDeleteRole(role) {
            new window.AlertComponent('Delete Role', `Are you sure you want to delete the role "${role.role_name}"?`, [
                ['Confirm Delete', async () => {
                    this.roles = this.roles.filter(r => r !== role);
                    this.onRoleDeleted(this.roles);
                    this.render();
                }],
                ['Cancel', () => { }]
            ]);
        }

        populateAddRoleTab(container) {
            // Use SeedImportComponent to select roles from seeds
            new window.conversations.SeedImportComponent(
                container,
                this.group.group_id,
                window.conversations.SEED_TYPES.ROLES,
                (added) => {
                    // Callback: add the selected roles to current instruction
                    if (added.roles && added.roles.length > 0) {
                        added.roles.forEach(seedRole => {
                            const roleCopy = _.cloneDeep(seedRole.json);
                            // Generate unique role_name if needed
                            if (!roleCopy.role_name || this.roles.find(r => r.role_name === roleCopy.role_name)) {
                                roleCopy.role_name = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            }
                            this.roles.push(roleCopy);
                        });
                        this.onRolesAdded(this.roles);
                        this.render();
                    }
                }
            );
        }

        populateRoleTab(container, role) {
            // Vertical wrapper for the whole role tab content
            const verticalWrapper = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            // Add buttons container
            const buttonContainer = window.conversations.utils.createDivContainer(verticalWrapper, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '+ Add feedback field',
                onClick: () => this.handleAddFeedback(role),
                type: window.ButtonComponent.TYPE_GHOST
            });
            new window.ButtonComponent(buttonContainer, {
                label: '🗙',
                onClick: () => this.handleDeleteRole(role),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: '🗙 Delete role'
            });

            // Horizontal wrapper for role details and feedback definitions
            const horizontalWrapper = window.conversations.utils.createDivContainer(verticalWrapper, 'conversation-container-horizontal-space-between-full');

            // Left side: Role details
            const systemPromptContainer = window.conversations.utils.createDivContainer(horizontalWrapper, 'conversation-container-vertical');

            const nameAndRangeDiv = window.conversations.utils.createDivContainer(systemPromptContainer, 'conversation-container-horizontal');

            // Role name (editable)
            window.conversations.utils.createInput(nameAndRangeDiv, 'Role Name:', {
                initialValue: role.role_name,
                // pattern: /^[a-zA-Z_]+$/,
                placeholder: 'e.g., Interviewer',
                onChange: (value) => {
                    role.role_name = value;
                    this.onChange(this.roles);
                }
            });

            // Participants field
            window.conversations.utils.createRange(nameAndRangeDiv, 'Participants (min - max):', role.min, role.max, (range) => {
                role.min = range.min; role.max = range.max;
                this.onChange(this.roles);
            });

            // Role objectives (editable)
            window.conversations.utils.createTextArea(systemPromptContainer, 'Role Objectives:', {
                initialValue: role.role_objectives,
                placeholder: 'Role objectives, i.e., Describe what this role is trying to achieve in this conversation.',
                onChange: (value) => {
                    role.role_objectives = value;
                    this.onChange(this.roles);
                },
                rows: 2
            });

            // Role Conversation Guide field
            window.conversations.utils.createTextArea(systemPromptContainer, 'Role Conversation Guide:', {
                initialValue: role.role_conversation_guide,
                placeholder: 'Role conversation guide, i.e. Add role-specific functional expectations for this scenario.',
                onChange: (value) => {
                    role.role_conversation_guide = value;
                    this.onChange(this.roles);
                }
            });

            // Right side: Feedback Definitions
            const feedbackContainer = window.conversations.utils.createDivContainer(horizontalWrapper, 'conversation-container-vertical');
            this.feedbackDefContainer = window.conversations.utils.createDivContainer(feedbackContainer, 'conversation-field-container-vertical-full');
            this.populateFeedbackEditor(role);
        }

        // Populate Feedback tab
        populateFeedbackEditor(role) {
            // Clear existing content - populateFeedbackEditor may be called multiple times
            this.feedbackDefContainer.innerHTML = '';

            const wrapper = window.conversations.utils.createDivContainer(this.feedbackDefContainer, 'conversation-container-vertical');
            if (role.feedback_def.length === 0) {
                window.conversations.utils.createReadOnlyText(wrapper, 'No feedback definitions found.', 'conversations-message-empty');
                return;
            }

            // container, items, renderItemFunction, selectionMode = ListComponent.SELECTION_MODE_NONE, onSelect = null, filterCondition = null
            new window.ListComponent(wrapper, role.feedback_def,
                (feedback_def) => {
                    const feedbackDiv = document.createElement('div');

                    // Name (editable)
                    window.conversations.utils.createInput(feedbackDiv, 'Name:', {
                        initialValue: feedback_def.name,
                        pattern: /^[a-z_]+$/,
                        placeholder: 'e.g., feedback_name',
                        onChange: (value) => {
                            feedback_def.name = value;
                            this.onChange(this.roles);
                        }
                    });

                    // Description field (editable)
                    window.conversations.utils.createTextArea(feedbackDiv, 'Description:', {
                        initialValue: feedback_def.description,
                        placeholder: 'Detail description of the feedback',
                        rows: 2,
                        onChange: (value) => {
                            feedback_def.description = value;
                            this.onChange(this.roles);
                        }
                    });

                    // Type field (editable)
                    // TODO: Create a util function for creating labeled select fields
                    const feedbackTypeContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(feedbackTypeContainer, 'Type:');
                    const feedbackTypeSelectContainer = window.conversations.utils.createDivContainer(feedbackTypeContainer);
                    new window.SelectComponent(
                        feedbackTypeSelectContainer,
                        {
                            options: [{ label: 'Integer', value: 'integer' }, { label: 'String', value: 'string' }],
                            onSelection: (value) => {
                                feedback_def.type = value;
                                // Clear other type-specific properties
                                delete feedback_def.min;
                                delete feedback_def.max;
                                delete feedback_def['optional-values'];
                                this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, feedback_def);
                                this.onChange(this.roles);
                            },
                            placeholder: 'Select type ...',
                            value: feedback_def.type
                        }
                    );

                    // Options Area
                    const feedbackTypeOptionsContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversation-field-container-vertical');
                    this.renderFeedbackTypeOptions(feedbackTypeOptionsContainer, feedback_def);

                    const buttonContainer = window.conversations.utils.createDivContainer(feedbackDiv, 'conversations-buttons-container');

                    // Required checkbox
                    new window.CheckboxComponent(buttonContainer, feedback_def.required, (checked) => {
                        feedback_def.required = checked;
                        this.onChange(this.roles);
                    }, 'Required');

                    // Add delete button
                    new window.ButtonComponent(buttonContainer, {
                        label: '🗙',
                        onClick: () => {
                            roleDef.feedback_def = roleDef.feedback_def.filter(fd => fd.feedbackName !== feedback_def.feedbackName);
                            this.populateFeedbackEditor(role, roleDef);
                            this.onChange(this.roles);
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
                        this.onChange(this.roles);
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
                        this.onChange(this.roles);
                    }, window.StringArrayComponent.STYLE_WRAP);

            }
        }

        // Handle adding a new feedback definition
        handleAddFeedback(role) {
            let nextIndex = 1;
            while (role.feedback_def.find(fd => fd.feedbackName === `feedback_${nextIndex}`)) {
                nextIndex++;
            }
            role.feedback_def.push({
                feedbackName: `feedback_${nextIndex}`,
                description: 'Description of the feedback field',
                type: 'integer', min: 0, max: 10, required: true
            });
            this.populateFeedbackEditor(role, roleDef);
            this.onChange(this.roles);
        }

        // // Convert feedback_def from object to array for easier editing, and deep clone the role object to avoid mutating the original
        // getRolesForEditing(origRoles) {
        //     return origRoles.map(origRole => {
        //         const ret = _.cloneDeep(origRole);
        //         ret.feedback_def = Object.entries(ret.feedback_def).map(([feedbackName, feedbackDef]) => ({
        //             feedbackName,
        //             ...feedbackDef
        //         }));
        //         return ret;
        //     });
        // }

        // // Convert feedback_def from array back to object for saving
        // getOrigRoles(rolesForEditing) {
        //     return rolesForEditing.map(roleForEditing => {
        //         const ret = _.cloneDeep(roleForEditing);
        //         ret.feedback_def = ret.feedback_def.reduce((acc, feedbackDef) => {
        //             const { feedbackName, ...rest } = feedbackDef;
        //             acc[feedbackName] = rest;
        //             return acc;
        //         }, {});
        //         return ret;
        //     });
        // }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionRolesComponent = ManageInstructionRolesComponent;
})();
