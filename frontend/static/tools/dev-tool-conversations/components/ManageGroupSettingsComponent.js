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
            new window.ButtonComponent(buttonContainer, '💾', () => this.saveGroupProperties(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');
            this.groupEditor = new window.conversations.ManageGroupEditorComponent(container, this.group.group_name, this.group.group_description); 

            // Seed group button
            if (!this.compareSeedToCurrent()) {
                new window.ButtonComponent(buttonContainer, '💡 Seed data', () => this.showSeedData(), window.ButtonComponent.TYPE_GHOST_DANGER, '💡 Seed data');
            }
        }
    
        async populateSeedDataTab(container) {
            const seedGroupDiv = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            const membersSeed = await window.conversations.apiSeeds.seedsMembersGet(null, this.group.group_key);
            const instructionsSeeds = await window.conversations.apiSeeds.seedsInstructionsGet(null, this.group.group_key);
            const allSeeds = [...(membersSeed || []), ...(instructionsSeeds || [])];
            if (allSeeds.length > 0) {
                // Buttons container
                const buttonContainer = window.conversations.utils.createDivContainer(seedGroupDiv, 'conversations-buttons-container');
                new window.ButtonComponent(buttonContainer, '📤 Start seeding selected items', () => this.startSeedingData(allSeeds), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');

                // Seed data list
                new window.ListComponent(seedGroupDiv, allSeeds, (seedEntry) => {
                    // Create header content
                    let icon = '☰ ';
                    let name = 'Unknown Seed';
                    if (seedEntry.type === 'members') {
                        icon = seedEntry.valid ? '👥 ' : '✘ ';
                        name = 'Members Seed';
                    } else if (seedEntry.type === 'instruction'   ) {
                        icon = seedEntry.valid ? window.conversations.CONVERSATION_TYPES_ICONS[seedEntry.json_info.conversation_type] + ' ' : '✘ ';
                        name = 'Instructions - ' + seedEntry.json_info.name;
                    } 
                     
                    // const headerContent = window.conversations.utils.createDivContainer(); 

                    const headerContent = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

                    // Icon 
                    window.conversations.utils.createReadOnlyText(headerContent, icon, 'conversations-list-card-icon');

                    // Info
                    const info = window.conversations.utils.createDivContainer(headerContent, 'conversations-card-info');

                    // Name
                    const nameWrapper = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal');
                    new window.CheckboxComponent(nameWrapper, seedEntry.include, (checked) => {
                        seedEntry.include = checked;
                    }, null, !seedEntry.valid);

                    window.conversations.utils.createReadOnlyText(nameWrapper, name, 'conversations-card-name');

                    // Description
                    const description = `${seedEntry.type} • ${seedEntry.folderName} ${!seedEntry.valid ? ' • Invalid' : ''}`
                    window.conversations.utils.createReadOnlyText(info, description, seedEntry.valid ? 'conversations-card-description' : 'conversations-error');

                    // Create body content
                    const bodyContent = window.conversations.utils.createDivContainer();
                    if (!seedEntry.valid) {
                        window.conversations.utils.createReadOnlyText(bodyContent, seedEntry.error, 'conversations-message-error');
                    } else {

                        if (seedEntry.type === 'members') {
                            window.conversations.utils.createJsonDiv(bodyContent, seedEntry.json);
                        } else if (seedEntry.type === 'instruction') {
                            const infoField = window.conversations.utils.createFieldDiv(bodyContent, 'Info Content:');
                            window.conversations.utils.createJsonDiv(infoField, seedEntry.json_info);
                            

                            const instructionField = window.conversations.utils.createFieldDiv(bodyContent, 'Info Content:');
                            window.conversations.utils.createField(instructionField, 'instructions:', seedEntry.instruction_file.content, true);
                                                        
                            const feedbackField = window.conversations.utils.createFieldDiv(bodyContent, 'Feedback Content:');
                            window.conversations.utils.createJsonDiv(feedbackField, seedEntry.json_feedback);
                        }
                    }
                    // Create ExpandDivComponent
                    const seedDiv = window.conversations.utils.createDivContainer();
                    new window.ExpandDivComponent(seedDiv, headerContent, bodyContent);
                    return seedDiv;
                    
                });
            } else {
                const noMembersSeedDiv = window.conversations.utils.createDivContainer(container, 'conversations-message-empty');
                noMembersSeedDiv.textContent = 'No seed files were found.';
            }
        }

        async startSeedingData(seedingData) {
            for (const entry of seedingData) {
                if (entry.include) {
                    if (entry.type === 'members') {
                        await window.conversations.apiMembers.membersAdd(null, this.group.group_id, entry.json);

                    } else if (entry.type === 'instruction') {
                        await window.conversations.apiInstructions.instructionsAdd(null, entry.folderName, this.group.group_id, entry.instructions, entry.json_feedback, entry.json_info);
                    }
                }
            }
            
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
                this.loadContent();
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
                        new window.ButtonComponent(pageButtons, '💾 Override seed', async () => {
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
                        }, window.ButtonComponent.TYPE_GHOST, '💾 Override seed');

                        // Seed exists - reload from seed
                        new window.ButtonComponent(pageButtons, '💡 Reload from seed', async () => {
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
                        }, window.ButtonComponent.TYPE_GHOST, '💡 Reload from seed');

                    } else {
                        // Seed does not exist - create new seed
                        new window.ButtonComponent(pageButtons, '💾 Create seed', async () => {
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
                        }, window.ButtonComponent.TYPE_GHOST, '💾 Create seed');
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
