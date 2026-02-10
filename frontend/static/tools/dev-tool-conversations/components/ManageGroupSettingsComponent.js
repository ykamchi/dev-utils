(function () {
    /*
        ManageGroupSettingsComponent: TODO - implement group settings UI and logic
    */
    class ManageGroupSettingsComponent {
        constructor(container, groupId, optionId, manageOptions) {
            this.container = container;
            this.groupId = groupId;
            this.optionId = optionId;
            this.manageOptions = manageOptions;
            this.groupEditor = null;
            this.group = null;
            this.page = null;
            this.groupSeed = null;
            this.render();
        }

        render() {

            this.loadContent();
        }

        async loadContent() {
            // Clear container - loadContent can be called multiple times
            this.container.innerHTML = '';

            this.group = await window.conversations.apiGroups.groupsGet(null, this.groupId);

            // Load group seed data
            await this.loadGroupSeed();

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                `${this.group.group_name} Settings`
            );

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            this.page.updateButtonsArea(buttonsDiv);

            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            const tabsetTabs = [
                { name: 'Properties', populateFunc: (container) => { this.populateEditTab(container); } },
                { name: 'Seed Data', populateFunc: (container) => { this.populateSeedDataTab(container); } }
            ];
            new window.TabsetComponent(contentDiv, tabsetTabs, 'manage-group-settings-tabset');
            this.page.updateContentArea(contentDiv);
        }

        async loadGroupSeed() {
            const seedsGroups = await window.conversations.apiSeeds.seedsGroupsGet(null, this.group.group_key);
            if (seedsGroups.length > 0) {
                this.groupSeed = seedsGroups[0].json;
            } else {
                this.groupSeed = null;
            }
        }

        compareSeedToCurrent() {
            if (!this.groupSeed) {
                return false;
            }
            console.log('Comparing seed to current:', this.groupSeed, this.group);
            if (this.groupSeed.group_name !== this.group.group_name ||
                this.groupSeed.group_description !== this.group.group_description) {
                return false;
            }
            return true;
        }

        populateEditTab(container) {
            // Edit group section (for Properties tab)
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');

            // Save group button
            new window.ButtonComponent(buttonContainer, {
                label: '💾',
                onClick: () => this.saveGroupProperties(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '💾 Save instruction'
            });
            this.groupEditor = new window.conversations.ManageGroupEditorComponent(container, this.group.group_name, this.group.group_description, this.group.group_key); 

            // Seed group button
            if (!this.compareSeedToCurrent()) {
                new window.ButtonComponent(buttonContainer, {
                    label: '💡 Seed data',
                    onClick: () => this.showSeedData(),
                    type: window.ButtonComponent.TYPE_GHOST_DANGER,
                    tooltip: '💡 Seed data'
                });
            }
        }
    
        async populateSeedDataTab(container) {
            // Use the new component to handle seed fetching and display
            new window.conversations.ManageGroupSeedsImportComponent(
                container,
                this.group,
                [
                    window.conversations.SEED_TYPES.MEMBERS,
                    window.conversations.SEED_TYPES.INSTRUCTIONS_ALL
                ]
            );
        }

        async saveGroupProperties() {
            const updatedGroup = this.groupEditor.updatedGroup();
            const newGroupName = updatedGroup.groupName;
            const newDescription = updatedGroup.groupDescription;

            // Validate group name
            if (!newGroupName) {
                new window.AlertComponent('Save', 'Group name cannot be empty.');
                return;
            }

            // Call API to save group settings
            try {
                const ret = await window.conversations.apiGroups.groupsUpdate(null, this.group.group_id, newGroupName, newDescription, this.group.group_name);
                if (ret.group_name !== this.group.group_name) {
                    this.manageOptions[this.optionId].info.onGroupNameChange(ret.group_id);
                }
                // this.loadContent();
            } catch (e) {
                console.error('Error saving group settings:', e);
                new window.AlertComponent('Error', `Failed to save group settings: ${e.message || e.toString()}`);
                return;
            }            
            
        }

        showSeedData() {
            const popup = new window.PopupComponent({
                icon: '💡',
                title: 'Instruction Seed Data - ' + this.group.group_name,
                width: 1200,
                height: 720,
                content: (container) => {
                    const wrapper = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

                    const pageButtons = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');

                    if (this.groupSeed) {
                        // Seed exists - save to override
                        new window.ButtonComponent(pageButtons, {
                            label: '💾 Override seed',
                            onClick: async () => {
                                // Call API to save group settings
                                try {
                                    await window.conversations.apiSeeds.seedsGroupsSet(
                                        this.container, 
                                        this.group.group_key, 
                                        {
                                            group_name: this.group.group_name,
                                            group_description: this.group.group_description
                                        }
                                    );
                                    this.loadContent();
                                    popup.hide();
                                    
                                } catch (e) {
                                    console.error('Error saving group settings:', e);
                                    new window.AlertComponent('Error', `Failed to save group settings: ${e.message || e.toString()}`);
                                    return;
                                }
                            },
                            type: window.ButtonComponent.TYPE_GHOST,
                            tooltip: '💾 Override seed'
                        });

                        // Seed exists - reload from seed
                        new window.ButtonComponent(pageButtons, {
                            label: '💡 Reload from seed',
                            onClick: async () => {
                            // Call API to save group settings
                            try {
                                const ret = await window.conversations.apiGroups.groupsUpdate(null, this.group.group_id, this.groupSeed.group_name, this.groupSeed.group_description, this.group.group_name);
                                if (ret.group_name !== this.group.group_name) {
                                    this.manageOptions[this.optionId].info.onGroupNameChange(ret.group_id);
                                }
                                this.loadContent();
                                popup.hide();

                            } catch (e) {
                                console.error('Error saving group settings:', e);
                                new window.AlertComponent('Error', `Failed to save group settings: ${e.message || e.toString()}`);
                                return;
                            }
                            },
                            type: window.ButtonComponent.TYPE_GHOST,
                            tooltip: '💡 Reload from seed'
                        });

                    } else {
                        // Seed does not exist - create new seed
                        new window.ButtonComponent(pageButtons, {
                            label: '💾 Create seed',
                            onClick: async () => {
                                // Call API to save group settings
                                try {
                                    await window.conversations.apiSeeds.seedsGroupsSet(
                                        this.container, 
                                        this.group.group_key, 
                                        {
                                            group_name: this.group.group_name,
                                            group_description: this.group.group_description
                                        }
                                    );
                                    this.loadContent();
                                    popup.hide();
                                    
                                } catch (e) {
                                    console.error('Error saving group settings:', e);
                                    new window.AlertComponent('Error', `Failed to save group settings: ${e.message || e.toString()}`);
                                    return;
                                }
                            },
                            type: window.ButtonComponent.TYPE_GHOST,
                            tooltip: '💾 Create seed'
                        });
                    }

                    // Filter group to only show relevant fields for comparison
                    const filteredGroup = {
                        group_name: this.group.group_name,
                        group_description: this.group.group_description
                    };

                    new window.DiffComponent(
                        wrapper,
                        window.Utils.sortJsonKeys(this.groupSeed),
                        window.Utils.sortJsonKeys(filteredGroup),
                        {
                            leftLabel: 'Seed Data - Info',
                            rightLabel: 'Current Data - Info',
                            height: 500
                        }
                    );

                },
            });
            popup.show();
        }

    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupSettingsComponent = ManageGroupSettingsComponent;
})();
