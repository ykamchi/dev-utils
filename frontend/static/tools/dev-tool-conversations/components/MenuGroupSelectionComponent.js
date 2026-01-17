(function () {
    class MenuGroupSelectionComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {function} onChange - Callback when group selection of mode or group changes
         */
        constructor(container, onChange) {
            this.container = container;
            this.onChange = onChange;
            this.selectedGroup = null;
            this.selectedMode = 'view';
            this.render();
        }

        render() {
            this.container.innerHTML = '';
            
            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-group-selection-wrapper', 'conversations-group-selection-wrapper');
             
            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-group-manage-header');

            // Header - Group
            window.conversations.utils.createReadOnlyText(headerDiv, 'conversations-selection-header', 'Group', 'conversations-selection-header');
            
            // Add and Delete group button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '+', () => this.addGroup(), window.ButtonComponent.TYPE_GHOST, '+ Add group');
            new window.ButtonComponent(buttonContainer, '🗙', () => this.deleteGroup(), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete group');

            // Content container
            this.contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-group-selection-content');
                        
            this.load();
        }

        async load() {
            // Fetch groups
            this.groups = await window.conversations.api.fetchGroups(this.contentContainer);
            if (!this.groups || this.groups.length === 0) {
                this.contentContainer.innerHTML = '<div class="conversations-message-empty">No groups available. Please add a group.</div>';
                return;
            }

            // Determine selected group
            if (this.selectedGroup === null) {
                const storedGroup = window.StorageService.getLocalStorageItem('last-selected-group', null);
                if (storedGroup) {
                    if (this.groups.find(g => g.group_name === storedGroup)) {
                        this.selectedGroup = storedGroup;
                    } else {
                        this.selectedGroup = this.groups[0].group_name;
                    }
                } else {
                    this.selectedGroup = this.groups[0].group_name;
                }
            }
            
            // Clear content container
            this.contentContainer.innerHTML = '';

            // Controls container for select group and mode buttons
            const controlsContainer = window.conversations.utils.createDivContainer(this.contentContainer, 'conversations-group-selection-controls', 'conversations-group-selection-controls');
            
            // Select group dropdown 
            new window.SelectComponent(
                controlsContainer,
                this.groups.map(g => ({ label: g.group_name, value: g.group_name })),
                (selectedGroup) => {
                    this.selectedGroup = selectedGroup;
                    this.onChange();

                    // Persist selection
                    window.StorageService.setLocalStorageItem('last-selected-group', selectedGroup);
                },
                'Select Group ...',
                this.selectedGroup
            );
            
            // Option buttons (View/Manage)
            const options = [ { label: 'View', value: 'view' }, { label: 'Manage', value: 'manage' } ];
            new window.OptionButtonsComponent(
                controlsContainer, 
                options, 
                'view', 
                (selectedMode) => {
                    this.selectedMode = selectedMode;
                    this.onChange();
                },
                // this.onModeChange.bind(this),
                'conversations-group-selection-mode'
            );

            // Trigger onChange callback with current selection
            this.onChange();
        }

        async addGroup() {
            const popup = new window.PopupComponent({
                icon: '👥',
                title: 'Add New Group',
                width: 420,
                height: 720,
                content: (container) => {
                    const buttonContainer = window.conversations.utils.createDivContainer(container, null, 'conversations-buttons-container');

                    // Save instructions button
                    new window.ButtonComponent(buttonContainer, '💾', async () => {
                        const updatedData = groupEditor.updatedGroup();

                        popup.hide();

                        // Call API to add group
                        const result = await window.conversations.api.addGroup(null, updatedData.groupName, updatedData.groupDescription);
                        this.selectedGroup = result.group.group_name;
                        this.render();
                        

                    }, window.ButtonComponent.TYPE_GHOST, '💾');
                    

                    const editorDiv = window.conversations.utils.createDivContainer(container, null, 'conversations-manage-instructions-content');
                    const groupEditor = new window.conversations.ManageGroupEditorComponent(editorDiv, '', ''); // Empty name and description for new group
                },
            });
            popup.show();
        }

        async deleteGroup() {
            new window.AlertComponent('Delete Group', 'Are you sure you want to delete this group?\n\nYou will lose all associated data including instructions and members!.\n\nThis action cannot be undone.', [
                ['Confirm Delete', async () => {

                    // Call API to delete group
                    await window.conversations.api.deleteGroup(null, this.selectedGroup);
                    this.selectedGroup = null;
                    this.load();
                    // this.render();
                    this.onChange();
                }],
                ['Cancel', () => { }]
            ]);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuGroupSelectionComponent = MenuGroupSelectionComponent;
})();
