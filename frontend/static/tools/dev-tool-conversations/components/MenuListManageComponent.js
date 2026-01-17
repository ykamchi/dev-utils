(function () {
    /*
        ListMenuListManageComponent: Manage mode for group management in dev-tool-conversations
    */
    class ListMenuListManageComponent {
        constructor(container, onManageOptionSelect, onGroupNameChange) {
            this.container = container;
            this.onManageOptionSelect = onManageOptionSelect;
            this.onGroupNameChange = onGroupNameChange;
            this.manageOptions = [];
            this.render();
        }

        render() {
            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, null, 'conversations-manage-wrapper');

            // Manage header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-group-manage-header');
            window.conversations.utils.createReadOnlyText(headerDiv, null, 'Manage', 'conversations-selection-header');

            // Manage list container
            this.manageListItems = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-manage-list-items');
        }

        // Load management interface for the selected group
        async load(selectedGroup) {
            // Define manage options
            this.manageOptions = {
                groupSettings: { 
                    name: 'Group Settings', 
                    icon: '🛠️',
                    description: 'Manage group settings',
                    component: 'ManageGroupSettingsComponent',
                    info: {
                        groupName: selectedGroup,
                        onGroupNameChange: async (newGroupName) => {
                            this.onGroupNameChange(newGroupName);
                        }
                    }
                },
                decisions: { 
                    name: 'Decisions', 
                    icon: '⚖️',
                    description: 'Manage group decisions',
                    component: 'ManageInstructionsComponent',
                    info: {
                        conversationType: 'ai_decision'
                    }
                },
                conversation: { 
                    name: 'Conversations', 
                    icon: '💬',
                    description: 'Manage group conversations',
                    component: 'ManageInstructionsComponent',
                    info: {
                        conversationType: 'ai_conversation'
                    }
                },
                editMembers: { 
                    name: 'Edit Members', 
                    icon: '✏️',
                    description: 'Edit group members',
                    component: null
                }
            };

            // Render the list
            this.renderManageList();
        }

        // Render the manage options list
        renderManageList() {
            const items = Object.entries(this.manageOptions).map(([id, option]) => ({ id, option }));
            const list = new window.ListComponent(
                this.manageListItems,
                items,
                (item) => {
                    const optionDiv = document.createElement('div');
                    new window.conversations.CardManageComponent(optionDiv, item.option);
                    return optionDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onManageOptionSelect(selectedItems[0].id, this.manageOptions);
                        list.storeLastSelected('manage-list-last-selection', item => item.id);
                    }
                }
            );

            // Restore last selection, or select first item
            list.setLastSelected('manage-list-last-selection', item => item.id);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ListMenuListManageComponent = ListMenuListManageComponent;
})();
