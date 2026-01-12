(function () {
    /*
        ManageListComponent: Manage mode for group management in dev-tool-conversations
    */
    class ManageListComponent {
        constructor(container, onOptionSelect) {
            this.container = container;
            this.onOptionSelect = onOptionSelect;
            this.groupName = null;
            this.manageOptions = [];
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-manage-wrapper';

            // Manage header
            const manageHeader = document.createElement('div');
            manageHeader.className = 'conversations-selection-header';
            manageHeader.textContent = 'Manage';
            wrapper.appendChild(manageHeader);

            // Manage list container
            this.manageListItems = document.createElement('div');
            this.manageListItems.className = 'conversations-manage-list-items';
            wrapper.appendChild(this.manageListItems);

            // Show initial loading state
            new window.SpinnerComponent(this.manageListItems, { text: 'Waiting for group selection...' });

            // Store wrapper reference
            this.wrapper = wrapper;
            this.container.appendChild(wrapper);
        }

        // Load management interface for the selected group
        async load(selectedGroup) {
            this.groupName = selectedGroup;
            
            // Show loading spinner
            new window.SpinnerComponent(this.manageListItems, { 
                text: `Loading management options for "${this.groupName}"...` 
            });

            // Define manage options
            this.manageOptions = {
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

        renderManageList() {
            this.manageListItems.innerHTML = '';
            
            const items = Object.entries(this.manageOptions).map(([id, option]) => ({ id, option }));
            const list = new window.ListComponent(
                this.manageListItems,
                items,
                (item) => {
                    const optionDiv = document.createElement('div');
                    new window.conversations.ManageCardComponent(optionDiv, item.option);
                    return optionDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onOptionSelect(selectedItems[0].id, this.manageOptions);
                    }
                }
            );

            // Automatically select the first item if available
            if (items.length > 0) {
                list.handleSelect(0);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageListComponent = ManageListComponent;
})();
