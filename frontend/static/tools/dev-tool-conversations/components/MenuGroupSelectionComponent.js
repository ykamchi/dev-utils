(function () {
    class MenuGroupSelectionComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {function} onChange - Callback when group selection of mode or group changes
         */
        constructor(container, onChange) {
            this.container = container;
            this.onChange = onChange;
            this.selectedGroupId = null;
            this.selectedMode = 'view';
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

            // Add and Delete group button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '+', () => this.addGroup(), window.ButtonComponent.TYPE_GHOST, '+ Add group');
            new window.ButtonComponent(buttonContainer, '🗙', () => this.deleteGroup(), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete group');

            // Content container
            this.contentContainer = window.conversations.utils.createDivContainer(wrapper);

            this.load();
        }

        async load() {
            // Fetch groups
            this.groups = await window.conversations.apiGroups.groupsList(this.contentContainer);
            if (!this.groups || this.groups.length === 0) {
                this.contentContainer.innerHTML = '<div class="conversations-message-empty">No groups available. Please add a group.</div>';
                return;
            }

            // Determine selected group
            if (this.selectedGroupId === null) {
                const storedGroup = window.StorageService.getLocalStorageItem('last-selected-group', null);
                if (storedGroup) {
                    if (this.groups.find(g => g.group_name === storedGroup)) {
                        this.selectedGroupId = storedGroup;
                    } else {
                        this.selectedGroupId = this.groups[0].group_id;
                    }
                } else {
                    this.selectedGroupId = this.groups[0].group_id;
                }
            }

            // Clear content container
            this.contentContainer.innerHTML = '';

            // Controls container for select group and mode buttons
            const controlsContainer = window.conversations.utils.createDivContainer(this.contentContainer, 'conversations-menu-selection-controls');

            // Select group dropdown 
            new window.SelectComponent(
                controlsContainer,
                this.groups.map(g => ({ label: g.group_name, value: g.group_id })),
                (selectedGroup) => {
                    this.selectedGroupId = selectedGroup;
                    this.onChange();

                    // Persist selection
                    window.StorageService.setLocalStorageItem('last-selected-group', selectedGroup);
                },
                'Select Group ...',
                this.selectedGroupId
            );

            // Option buttons (View/Manage)
            const options = [{ label: 'View', value: 'view' }, { label: 'Manage', value: 'manage' }];
            const viewModeButtons = new window.OptionButtonsComponent(
                controlsContainer,
                options,
                'view',
                (selectedMode) => {
                    this.selectedMode = selectedMode;
                    this.onChange();
                },
                'conversations-menu-selection-mode'
            );

            this.selectedMode = viewModeButtons.getSelection();
            // Trigger onChange callback with current selection
            this.onChange();
        }

        async addGroup() {
            const popup = new window.PopupComponent({
                icon: '👥',
                title: 'Add New Group',
                width: 640,
                height: 720,
                content: (container) => {
                    const contentDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
                    const tabsetTabs = [
                        { name: 'Edit', populateFunc: (c) => this.populateAddGroupTab(c, popup), },
                        { name: 'Seed Data', populateFunc: (c) => this.populateSeedGroupsTab(c, popup), }
                    ];
                    new window.TabsetComponent(contentDiv, tabsetTabs, 'manage-group-settings-tabset');
                },
            });
            popup.show();
        }

        // Populate Seed Groups tab
        async populateSeedGroupsTab(container, popup) {
            const editorDiv = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            const seeds = await window.conversations.apiSeeds.fetchGroupSeeds(null);

            // Seed group button
            const buttonContainer = window.conversations.utils.createDivContainer(editorDiv, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '📤 Group seeding', async () => {
                popup.hide();

                // Call API to add group for each selected seed
                for (const seedEntry of seeds) {
                    if (seedEntry.include && seedEntry.valid) {
                        const result = await window.conversations.apiGroups.groupsAdd(null, seedEntry.group_name, seedEntry.fileContent.group_description);
                        this.selectedGroupId = result.group_id;
                        this.render();
                    }
                }
            }, window.ButtonComponent.TYPE_GHOST, '📤 Group seeding');

            if (seeds && seeds.length > 0) {
                new window.ListComponent(editorDiv, seeds, (seedEntry) => {
                    // Create header content
                    const headerContent = window.conversations.utils.createDivContainer();
                    new window.CheckboxComponent(headerContent, seedEntry.include, (checked) => {
                        seedEntry.include = checked;
                    }, seedEntry.group_name + (!seedEntry.valid ? ' <b style="color: var(--color-warning-error)">(Invalid)</b>' : ''), !seedEntry.valid);

                    // Create body content
                    const bodyContent = window.conversations.utils.createDivContainer();
                    if (!seedEntry.valid) {
                        window.conversations.utils.createReadOnlyText(bodyContent, seedEntry.error, 'conversations-message-error');
                    } else {
                        window.conversations.utils.createJsonDiv(bodyContent, seedEntry.fileContent);
                    }
                    // Create ExpandDivComponent
                    const seedDiv = window.conversations.utils.createDivContainer();
                    new window.ExpandDivComponent(seedDiv, headerContent, bodyContent);
                    return seedDiv;

                });
            } else {
                editorDiv.innerHTML = '<div class="conversations-message-empty">No seed data available.</div>';
            }

            return editorDiv;
        }

        async populateAddGroupTab(container, popup) {
            const editorDiv = window.conversations.utils.createDivContainer(container);

            // Save group button
            const buttonContainer = window.conversations.utils.createDivContainer(editorDiv, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '💾 Add group', async () => {
                const updatedData = groupEditor.updatedGroup();

                popup.hide();

                // Call API to add group
                const result = await window.conversations.apiGroups.groupsAdd(null, updatedData.groupName, updatedData.groupDescription);
                this.selectedGroupId = result.group_id;
                this.render();
            }, window.ButtonComponent.TYPE_GHOST, '💾 Add group');

            const groupEditor =new window.conversations.ManageGroupEditorComponent(editorDiv, '', ''); // Empty name and description for new group
            return editorDiv;
        }

        async deleteGroup() {
            new window.AlertComponent('Delete Group', 'Are you sure you want to delete this group?\n\nYou will lose all associated data including instructions and members!.\n\nThis action cannot be undone.', [
                ['Confirm Delete', async () => {

                    // Call API to delete group
                    await window.conversations.apiGroups.groupsDelete(null, this.selectedGroupId);
                    this.selectedGroupId = null;
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
