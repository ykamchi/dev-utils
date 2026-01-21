(function () {
    /*
        ManageGroupSettingsComponent: TODO - implement group settings UI and logic
    */
    class ManageGroupSettingsComponent {
        constructor(container, groupName, optionId, manageOptions) {
            this.container = container;
            this.groupName = groupName;
            this.optionId = optionId;
            this.group = null;
            this.manageOptions = manageOptions;
            this.groupEditor = null;
            this.page = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                `${this.groupName} Settings`
            );

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {      
            // Fetch group details
            // TODO: Need API to fetch single group details
            const groups = await window.conversations.api.fetchGroups(null);
            const groupDescription = groups.find(g => g.group_name === this.groupName).group_description; 

            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            const tabsetTabs = [
                {
                    name: 'Properties',
                    populateFunc: (container) => {
                        this.populateEditTab(container, groupDescription);
                    }
                },
                {
                    name: 'Seed Data',
                    populateFunc: (container) => {
                        this.populateSeedDataTab(container);
                    }
                }
            ];
            new window.TabsetComponent(contentDiv, tabsetTabs, 'manage-group-settings-tabset');
            this.page.updateContentArea(contentDiv);
        }

        populateEditTab(container, groupDescription) {
            // Edit group section (for Properties tab)
            const buttonContainer = window.conversations.utils.createDivContainer(container, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, '💾', () => this.saveGroupProperties(), window.ButtonComponent.TYPE_GHOST, '💾 Save instruction');
            this.groupEditor = new window.conversations.ManageGroupEditorComponent(container, this.groupName, groupDescription); 
        }
    
        async populateSeedDataTab(container) {
            container.innerHTML = '';

            const seedGroupDiv = window.conversations.utils.createDivContainer(container);

            const seedingData = await window.conversations.api.fetchGroupSeedFiles(null, this.groupName);
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
                            const feedbackGroup = window.conversations.utils.createDivContainer(bodyContent, 'conversation-container-vertical');
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
                        console.log("Seeding members from:", entry.file.name);
                        await window.conversations.api.addGroupMembers(null, this.groupName, entry.fileContent);

                    } else if (entry.type === 'instruction') {
                        console.log("Seeding instruction from folder:", entry.folderName);
                        await window.conversations.api.addGroupInstructions(null, this.groupName, entry.instructionContent, entry.feedbackContent, entry.infoContent);

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
            const result = await window.conversations.api.updateGroup(null, this.groupName, newGroupName, newDescription);
            
            if (result.success) {
                new window.AlertComponent('Success', 'Group settings saved successfully.');
                this.manageOptions[this.optionId].info.onGroupNameChange(newGroupName);
            } else {
                new window.AlertComponent('Error', `Failed to save group settings: ${result.error || 'Unknown error'}`);
            }
        }

        load
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupSettingsComponent = ManageGroupSettingsComponent;
})();
