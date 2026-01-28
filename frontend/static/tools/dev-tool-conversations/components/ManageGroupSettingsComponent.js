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
            this.render();
        }

        render() {

            this.loadContent();
        }

        async loadContent() {
            this.group = await window.conversations.apiGroups.groupsGet(null, this.groupId);

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

        populateEditTab(container) {
            // Edit group section (for Properties tab)
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '💾', () => this.saveGroupProperties(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');
            this.groupEditor = new window.conversations.ManageGroupEditorComponent(container, this.group.group_name, this.group.group_description); 
        }
    
        async populateSeedDataTab(container) {
            const seedGroupDiv = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            const seedingData = await window.conversations.apiSeeds.fetchGroupSeedFiles(null, this.group.group_name);
            if (seedingData && seedingData.length > 0) {
                // Pre-load instruction file contents for valid entries
                for (const seedEntry of seedingData) {
                    if (seedEntry.valid) {
                        if (seedEntry.type === 'instruction') {
                            seedEntry.instructionContent = await seedEntry.instruction_file.content;
                            seedEntry.feedbackContent = JSON.parse(await seedEntry.feedback_file.content);
                            seedEntry.infoContent = JSON.parse(await seedEntry.info_file.content);
                        } else if (seedEntry.type === 'members') {
                            seedEntry.fileContent = JSON.parse(await seedEntry.file.content);
                        }
                    }
                }

                // Buttons container
                const buttonContainer = window.conversations.utils.createDivContainer(seedGroupDiv, 'conversations-buttons-container');
                new window.ButtonComponent(buttonContainer, '📤 Start seeding selected items', () => this.startSeedingData(seedingData), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');

                // Seed data list
                new window.ListComponent(seedGroupDiv, seedingData, (seedEntry) => {
                    // Create header content
                    const icon = seedEntry.type === 'members' ? '👥 ' : seedEntry?.infoContent?.conversation_type ? window.conversations.CONVERSATION_TYPES_ICONS[seedEntry?.infoContent?.conversation_type] + ' ' : '✘ ';
                     
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

                    window.conversations.utils.createReadOnlyText(nameWrapper, seedEntry.type + ' - ' + seedEntry.folderName, 'conversations-card-name');

                    // Description
                    const description = `${seedEntry.type} • ${seedEntry.folderName} ${!seedEntry.valid ? ' • Invalid' : ''}`
                    window.conversations.utils.createReadOnlyText(info, description, seedEntry.valid ? 'conversations-card-description' : 'conversations-error');

                    // Create body content
                    const bodyContent = window.conversations.utils.createDivContainer();
                    if (!seedEntry.valid) {
                        window.conversations.utils.createReadOnlyText(bodyContent, seedEntry.error, 'conversations-message-error');
                    } else {

                        if (seedEntry.type === 'members') {
                            window.conversations.utils.createJsonDiv(bodyContent, seedEntry.fileContent);
                        } else if (seedEntry.type === 'instruction') {
                            const infoGroup = window.conversations.utils.createDivContainer(bodyContent);
                            window.conversations.utils.createLabel(infoGroup, 'Info Content:');
                            window.conversations.utils.createJsonDiv(infoGroup, seedEntry.infoContent);
                            const instructionsGroup = window.conversations.utils.createDivContainer(bodyContent);
                            window.conversations.utils.createLabel(instructionsGroup, 'Instruction Content:');
                            window.conversations.utils.createReadOnlyText(instructionsGroup, seedEntry.instructionContent || 'No content');
                            const feedbackGroup = window.conversations.utils.createDivContainer(bodyContent, 'conversation-field-container-vertical');
                            window.conversations.utils.createLabel(feedbackGroup, 'Feedback Content:');
                            window.conversations.utils.createJsonDiv(feedbackGroup, seedEntry.feedbackContent);
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
                        await window.conversations.apiMembers.membersAdd(null, this.group.group_id, entry.fileContent);

                    } else if (entry.type === 'instruction') {
                        await window.conversations.apiInstructions.instructionsAdd(null, this.group.group_id, entry.instructionContent, entry.feedbackContent, entry.infoContent);
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

            } catch (e) {
                console.error('Error saving group settings:', e);
                new window.AlertComponent('Error', `Failed to save group settings: ${e.message || e.toString()}`);
                return;
            }            
            
        }

        load
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupSettingsComponent = ManageGroupSettingsComponent;
})();
