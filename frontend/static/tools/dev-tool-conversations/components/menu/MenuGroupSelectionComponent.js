(function () {
    class MenuGroupSelectionComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {function} onSelection.Change - Callback when group selection of mode or group changes
         * @param {function} onGroupAdded - Callback when a group is added
         * @param {function} onGroupDeleted - Callback when a group is deleted
         * @param {function} onGroupNameChange - Callback when a group's name is changed
         */
        constructor(container, onSelectionChange, onGroupAdded, onGroupDeleted, onGroupNameChange) {
            this.container = container;
            this.onSelectionChange = onSelectionChange;
            this.onGroupAdded = onGroupAdded;
            this.onGroupNameChange = onGroupNameChange;
            this.onGroupDeleted = onGroupDeleted;

            this.selectedGroupId = null;
            this.groups = null;

            this.settingsButton = null;
            this.addButton = null;
            this.deleteButton = null;

            this.groupSelectionContainer = null;
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-menu-selection-wrapper');

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-manage-header');

            // Header - Group
            window.conversations.utils.createReadOnlyText(headerDiv, 'Group', 'conversations-menu-selection-header');

            // Content container
            const contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-group-selection-controls');

            this.groupSelectionContainer = window.conversations.utils.createDivContainer(contentContainer, 'conversations-menu-group-selection-container');

            // Add and Delete and settings group button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, 'conversations-buttons-container');
            this.settingsButton = new window.ButtonComponent(buttonContainer, {
                label: '⚙️',
                onClick: () => window.conversations.popups.openGroupSettings(this.selectedGroupId, this.onGroupNameChange,this.onGroupDeleted),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '⚙️ Group settings'
            });
            this.deleteButton = new window.ButtonComponent(buttonContainer, {
                label: '🗙',
                onClick: () => this.deleteGroup(),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: '🗙 Delete group'
            });
            this.addButton = new window.ButtonComponent(buttonContainer, {
                label: '+',
                onClick: () => window.conversations.popups.addGroup(this.onGroupAdded),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '+ Add group'
            });

            this.load();
        }

        updateButtonsArea() {
            this.deleteButton.setVisible(this.selectedGroupId !== null);
            this.settingsButton.setVisible(this.selectedGroupId !== null);
        }

        async load() {
            this.groupSelectionContainer.innerHTML = '';
            // Fetch groups
            this.groups = await window.conversations.apiGroups.groupsList(this.groupSelectionContainer);
            if (!this.groups || this.groups.length === 0) {
                window.conversations.utils.createReadOnlyText(this.groupSelectionContainer, 'No groups available. Please add a group.', 'conversations-message-empty');
                this.selectedGroupId = null;
                this.onSelectionChange();
                this.updateButtonsArea();
                return;
            }

            // Determine selected group
            if (this.selectedGroupId === null) {
                const storedGroup = window.StorageService.getStorageJSON('last-selected-group', null);
                if (storedGroup) {
                    if (this.groups.find(g => g.group_id === storedGroup)) {
                        this.selectedGroupId = storedGroup;
                    } else {
                        this.selectedGroupId = this.groups[0].group_id;
                    }
                } else {
                    this.selectedGroupId = this.groups[0].group_id;
                }
            }

            // Clear content container
            this.groupSelectionContainer.innerHTML = '';

            // Controls container for select group dropdown
            // const controlsContainer = window.conversations.utils.createDivContainer(this.contentContainer, 'conversations-menu-selection-controls');

            // Select group dropdown 
            new window.SelectComponent(
                this.groupSelectionContainer,
                {
                    options: this.groups.map(g => ({ label: g.group_name, value: g.group_id })),
                    onSelection: (selectedGroup) => {
                        this.selectedGroupId = parseInt(selectedGroup);

                        // Persist selection
                        window.StorageService.setStorageJSON('last-selected-group', this.selectedGroupId);

                        // Trigger onChange callback
                        this.onSelectionChange();

                    },
                    placeholder: 'Select Group ...',
                    value: this.selectedGroupId
                }
            );

            this.updateButtonsArea();

            // Trigger onSelectionChange callback 
            this.onSelectionChange();
        }

        selectGroup(groupId) {
            this.selectedGroupId = groupId;
            window.StorageService.setStorageJSON('last-selected-group', this.selectedGroupId);
            this.render();
        }

        async deleteGroup() {
            new window.AlertComponent('Delete Group', 'Are you sure you want to delete this group?\n\nYou will lose all associated data including instructions and members!.\n\nThis action cannot be undone.', [
                ['Confirm Delete', async () => {

                    // Call API to delete group
                    await window.conversations.apiGroups.groupsDelete(null, this.selectedGroupId);
                    this.onGroupDeleted(this.selectedGroupId);
                }],
                ['Cancel', () => { }]
            ]);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuGroupSelectionComponent = MenuGroupSelectionComponent;
})();
