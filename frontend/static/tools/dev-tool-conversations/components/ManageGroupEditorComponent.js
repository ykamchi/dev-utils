(function () {
    /*
        ManageInstructionsEditorComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageGroupEditorComponent {
        constructor(container, groupName, groupDescription, groupKey) {
            this.container = container;
            this.groupName = groupName;
            this.groupDescription = groupDescription;
            this.groupKey = groupKey;
            this.render();
        }

        render() {
            // Edit group section (for Properties tab)
            const editGroupDiv = window.conversations.utils.createDivContainer(this.container);

            // Group Name 
            const nameGroup = window.conversations.utils.createDivContainer(editGroupDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(nameGroup, 'Group Name:');
            this.groupNameInput = new window.TextInputComponent(nameGroup, {
                initialValue: this.groupName,
                pattern: /.*/,
                placeholder: 'Enter group name',
                onChange: (value) => {
                    this.groupName = value;
                },
                aiSuggestion: {
                    fn: window.conversations.apiAi.autocomplete,
                    context: {
                        field: 'group_name',
                        operation: 'edit_group',
                        existing_data: {
                            'mission': 'Create a concise and descriptive group name'
                        }
                    }
                }
            });

            // Conversation Type field (read-only)
            window.conversations.utils.createField(editGroupDiv, 'Group Key:', this.groupKey, true);

            window.conversations.utils.createTextArea(editGroupDiv, 'Description:', {
                initialValue: this.groupDescription,
                placeholder: 'Enter group description',
                onChange: (value) => {
                    this.groupDescription = value;
                },
                aiSuggestion: {
                    fn: window.conversations.apiAi.autocomplete,
                    context: {
                        field: 'group_description',
                        operation: 'edit_group',
                        existing_data: {
                            'group_name': this.groupName,
                            'mission': 'Create a description for the group name'
                        }
                    }
                }
            });
        }

        updatedGroup() {
            const updatedGroup = {
                groupName: this.groupNameInput.getValue(),
                groupDescription: this.groupDescription
            };
            return updatedGroup;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupEditorComponent = ManageGroupEditorComponent;
})();
