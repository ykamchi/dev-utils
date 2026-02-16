(function () {
    /*
        ManageGroupEditComponent: Standalone component for editing group properties
    */
    class ManageGroupEditComponent {
        constructor(container, group, onGroupNameChange = null) {
            this.container = container;
            this.onGroupNameChange = onGroupNameChange;

            this.seed = null;

            this.undoButton = null;
            this.saveButton = null;
            this.seedButton = null;

            this.seedCompare = new window.conversations.ManageSeedCompareComponent(
                group,
                async () => {
                    // onReloadFromSeed callback - we update the data with the new data from seed and save
                    // this.member = newData;
                    await this.save();
                },
                async (newSeed) => {
                    // onOverrideSeed callback - we save the new seed (the data filter is applied in the 
                    // ManageSeedCompareComponent before calling this callback)
                    await window.conversations.apiSeeds.seedsGroupsSet(this.container, this.seedCompare.data.group_key, newSeed);
                    this.loadContent();
                },
                (seedDirty) => {
                    // onDirty callback - we update the buttons area to show/hide seed button 
                    // based on whether there are changes compared to seed
                    this.seedButton.setVisible(seedDirty);
                },
                (dirty) => {
                    // onDirty callback - we update the buttons area to show/hide save and undo buttons
                    this.saveButton.setDisabled(!dirty);
                    this.undoButton.setDisabled(!dirty);
                },
                ['created_at', 'group_id', 'info']
            );

            this.page = null;

            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, '👥', 'Group Definition and Properties',
                [`${this.seedCompare.data.group_name}`, 'Manage group properties', `ID: ${this.seedCompare.data.group_id}`]
            );

            // Create buttons area
            this.createButtonsArea();

            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');

            // Group edit area
            this.groupEditArea = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');

            // Update the page content
            this.page.updateContentArea(wrapper);

            // Load content
            this.loadContent();
        }

        createButtonsArea() {
            // Create buttons and store references
            const buttonContainer = window.conversations.utils.createDivContainer(this.container, 'conversations-buttons-container');
            this.undoButton = new window.ButtonComponent(buttonContainer, {
                label: '↩️',
                onClick: () => { this.seedCompare.undoChanges(); this.loadContent(); },
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '↩️ Undo changes',
                disabled: true
            });

            this.saveButton = new window.ButtonComponent(buttonContainer, {
                label: '💾',
                onClick: () => this.save(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '💾 Save group',
                disabled: true
            });

            this.seedButton = new window.ButtonComponent(buttonContainer, {
                label: '💡',
                onClick: () => this.seedCompare.show(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '💡 Seed data'
            });
            new window.ButtonComponent(buttonContainer, {
                label: '🗙',
                onClick: () => this.delete(),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: '🗙 Delete group',
            });
            this.page.updateButtonsArea(buttonContainer);
        }

        async loadContent() {
            this.groupEditArea.innerHTML = '';

            // Load the seed data
            await this.loadSeedData();

            // Group Name input
            window.conversations.utils.createInput(this.groupEditArea, 'Group Name:', {
                initialValue: this.seedCompare.data.group_name,
                pattern: /.*/,
                placeholder: 'Enter group name',
                onChange: (value) => {
                    this.seedCompare.change((data) => { data.group_name = value; });
                }
            });
        }
        
        // Load the seed data
        async loadSeedData() {
            const seeds = await window.conversations.apiSeeds.seedsGroupsGet(null, this.seedCompare.data.group_key);
            if (seeds.length > 0) {
                this.seed = seeds[0].json;
            } else {
                this.seed = null;
            }
            this.seedCompare.updateSeed(this.seed);
        }

        // Save the group properties
        async save() {
            // Call API to save
            try {
                const nameChanged = this.seedCompare.data.group_name !== this.seedCompare.dataOrig.group_name;
                
                this.seedCompare.update(await window.conversations.apiGroups.groupsUpdate(null, this.seedCompare.data.group_id, this.seedCompare.data.group_name, this.seedCompare.dataOrig.group_name));

                // If the group name was changed and we have a callback, notify parent
                if (nameChanged) {
                    this.onGroupNameChange(this.seedCompare.data.group_id);
                } 
                this.loadContent();
                new window.AlertComponent('Save group', 'Group has been saved successfully.');
            } catch (error) {
                console.error('Error saving group:', error);
                new window.AlertComponent('Save group', 'Failed to save group');
                return;
            }
        }

        async delete() {
            new window.AlertComponent('Delete Group', 'Are you sure you want to delete this group?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.apiGroups.groupsDelete(null, this.group.group_id);

                    // Notify parent if callback provided (e.g., to reload members in left panel)
                    this.onGroupNameChange(null);
                }],
                ['Cancel', () => { }]
            ]);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupEditComponent = ManageGroupEditComponent;
})();
