(function () {
    /*
        ManageInstructionsComponent: displays instructions for a selected group in dev-tool-conversations
    */
    class ManageInstructionsComponent {
        constructor(container, group, conversationType) {
            this.container = container;
            this.group = group;
            this.conversationType = conversationType;

            this.seed = null;

            this.undoButton = null;
            this.saveButton = null;
            this.seedButton = null;

            this.seedCompare = new window.conversations.ManageSeedCompareComponent(
                null,
                async () => {
                    // onReloadFromSeed callback - we update the data with the new data from seed and save
                    // this.member = newData;
                    await this.save();
                },
                async (newSeed) => {
                    // onOverrideSeed callback - we save the new seed (the data filter is applied in the 
                    // ManageSeedCompareComponent before calling this callback)
                    await window.conversations.apiSeeds.seedsInstructionsSet(this.wrapper, this.group.group_key, this.seedCompare.data.instruction_key, newSeed);
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
                ['created_at', 'group_id', 'instruction_id']
            );

            this.page = null;

            this.instructionPropertiesDiv = null;
            this.rolesAreaDiv = null;
            
            this.menuListInstructionsComponent = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(
                this.container, 
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversationType],
                `Group ${window.conversations.CONVERSATION_TYPES_STRING(this.conversationType, false, true, true, true)} Instructions Settings`
                ,
                [this.group.group_name, `Manage group ${window.conversations.CONVERSATION_TYPES_STRING(this.conversationType, false, true, false, true)}`]
            );

            // Create buttons area
            this.createButtonsArea();

            // Content area
            const contentDiv = window.conversations.utils.createDivContainer(null, 'conversation-container-vertical');

            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversation-container-horizontal-space-between-full');

            this.instructionListDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-layout-left');
            this.instructionPropertiesDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');
            this.rolesAreaDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');

            // Load instructions list component
            this.loadInstructions();

            // Update the page content
            this.page.updateContentArea(contentDiv);

            // Load content
            this.loadContent();
        }

        loadInstructions() {
            this.menuListInstructionsComponent = new window.conversations.MenuListInstructionsComponent(
                this.instructionListDiv,
                this.group.group_id,
                this.conversationType,
                (selectedInstruction) => {
                    if (selectedInstruction) {
                        this.seedCompare.update(selectedInstruction);
                        this.loadContent();
                    }
                }
            );
        }

        createButtonsArea() {
            // Create buttons and store references
            const buttonContainer = window.conversations.utils.createDivContainer(this.wrapper, 'conversations-buttons-container');
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
            this.instructionPropertiesDiv.innerHTML = '';
            this.rolesAreaDiv.innerHTML = '';


            if (!this.seedCompare.data) {
                window.conversations.utils.createReadOnlyText(this.instructionPropertiesDiv, 'Please select an instruction to view and edit.', 'conversations-message-empty');
                return;
            }
            
            // Load the seed data
            await this.loadSeed();

            // Name field (editable)
            window.conversations.utils.createInput(this.instructionPropertiesDiv, 'Name:', {
                initialValue: this.seedCompare.data.info.name,
                pattern: /^[a-zA-Z0-9 _-]+$/,
                placeholder: 'e.g., My Instruction Name',
                onChange: (value) => {
                    this.seedCompare.change((data) => data.info.name = value);
                }
            });
            
            // Max turns (editable)
            window.conversations.utils.createInput(this.instructionPropertiesDiv, 'Max Turns:', {
                initialValue: this.seedCompare.data.info.max_turns,
                type: 'number',
                min: 3, max: 50,
                placeholder: 'e.g., 10',
                onChange: (value) => {
                    this.seedCompare.change((data) => data.info.max_turns = value);
                }
            });

            // Conversation Type field (read-only)
            window.conversations.utils.createField(this.instructionPropertiesDiv, 'Conversation Type:', this.seedCompare.data.info.conversation_type, true);

            // Instructions key field (read-only)
            window.conversations.utils.createField(this.instructionPropertiesDiv, 'Instructions Key:', this.seedCompare.data.instruction_key, true);

            // Description field (editable)
            window.conversations.utils.createTextArea(this.instructionPropertiesDiv, 'Description:', {
                initialValue: this.seedCompare.data.info.description,
                placeholder: 'My Instruction Description',
                onChange: (value) => {
                    this.seedCompare.change((data) => data.info.description = value);
                },
                aiSuggestion: {
                    fn: window.conversations.apiAi.autocomplete,
                    context: {
                        field: 'instruction_description',
                        operation: 'edit_instruction',
                        existing_data: {
                            'instruction_name': this.seedCompare.data.info.name,
                            'conversation_type': this.seedCompare.data.info.conversation_type,
                            'mission': 'Create a description for the instruction'
                        }
                    }
                }
            });

            // Meta div (editable) - JSON object for metadata
            window.conversations.utils.createTextArea(this.instructionPropertiesDiv, 'Meta (JSON):', {
                initialValue: JSON.stringify(this.seedCompare.data.info.meta || {}, null, 2),
                placeholder: '{}',
                onChange: (value) => {
                    try {
                        this.seedCompare.change((data) => data.info.meta = JSON.parse(value));
                    } catch (e) {
                        console.error('Invalid JSON in meta field:', e);
                    }
                },
                rows: 4
            });

            // Roles area
            const rolesFieldDiv = window.conversations.utils.createDivContainer(this.rolesAreaDiv, 'conversation-field-container-vertical-full');
            window.conversations.utils.createLabel(rolesFieldDiv, 'Roles:');
            new window.conversations.ManageInstructionRolesComponent(rolesFieldDiv, this.group, this.seedCompare.data.info, (info) => {
                // Callback to update the selected instruction when roles are changed in the roles editor
                this.seedCompare.change((data) => data.info.roles = info.roles);
            });
        }

        // Load the seed data
        async loadSeed() {
            const seeds = await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group, this.seedCompare.data.instruction_key);
            if (seeds.length > 0) {
                if (seeds[0].json.instruction_key === this.seedCompare.data.instruction_key) {
                    this.seed = seeds[0].json;
                } else {
                    // This should not happen since we fetched the seed data using the selected instruction key, 
                    // but just in case, we check that the instruction key of the fetched seed data matches the selected 
                    // instruction key. If it doesn't match, we ignore the seed data and set it to null.
                    console.error('Seed data instruction key does not match the selected instruction key. That should not happen since we fetched the seed data using the selected instruction key. Seed data instruction key: ', seeds[0].json.instruction_key, 'Selected instruction key: ', this.seedCompare.data.instruction_key);
                    this.seed = null;
                }
            } else {
                this.seed = null;
            }
            this.seedCompare.updateSeed(this.seed);
        }

        // Save the selected instruction
        async save() {
            // Call API to save
            try {
                const updatedInstruction = await window.conversations.apiInstructions.instructionsUpdate(
                    null, 
                    this.seedCompare.data.instruction_id, 
                    this.seedCompare.data.info
                );
                
                this.seedCompare.update(updatedInstruction);

                this.menuListInstructionsComponent.refreshInstruction(updatedInstruction);

                new window.AlertComponent('Save instructions', 'Instructions has been saved successfully.');
                this.loadContent();
            } catch (error) {
                console.error('Error saving instructions:', error);
                new window.AlertComponent('Save instructions', 'Failed to save instructions.');
            }
        }

        // Delete the selected instruction
        async delete() {
            new window.AlertComponent('Delete Instructions', 'Are you sure you want to delete this instruction?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.apiInstructions.instructionsDelete(null, this.seedCompare.data.instruction_id);

                    // Clear selected instruction
                    this.seedCompare.update(null);

                    // Refresh instructions list
                    this.loadInstructions();

                    // Reload content
                    this.loadContent();
                }],
                ['Cancel', () => { }]
            ]);
        }

    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsComponent = ManageInstructionsComponent;
})();
















        // // Show seed data differences in a popup with options to 
        // // override seed data with current instruction data or to 
        // // reload current instruction data from seed data
        // showSeedData() {
        //     const popup = new window.PopupComponent({
        //         icon: '💡',
        //         title: 'Instruction Seed Data - ' + this.selectedInstruction.info.name,
        //         width: 1200,
        //         height: 720,
        //         content: (container) => {
        //             new window.conversations.ManageInstructionsSeedCompareComponent(
        //                 container,
        //                 this.group.group_id,
        //                 this.group.group_name,
        //                 this.group.group_key,
        //                 this.selectedInstruction,
        //                 this.seed,
        //                 () => {
        //                     // onReloadFromSeed callback
        //                     popup.hide();
        //                     this.loadContent();
        //                 },
        //                 () => {
        //                     // onOverrideSeed callback
        //                     popup.hide();
        //                     this.loadContent();
        //                 }
        //             );
        //         },
        //     });
        //     popup.show();
        // }







        // // Add new instruction
        // async addInstruction() {
        //     const popup = new window.PopupComponent({
        //         icon: window.conversations.CONVERSATION_TYPES_ICONS[this.conversationType],
        //         title: 'Import ' + window.conversations.CONVERSATION_TYPES_STRING(this.conversationType, false, true, false, false),
        //         width: 1200,
        //         height: 720,
        //         content: (container) => {
        //             const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
                    
        //             // Create seed import component - filter by conversation type
        //             let seedTypes = [];
        //             if (this.conversationType === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
        //                 seedTypes = [window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS];
        //             } else if (this.conversationType === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
        //                 seedTypes = [window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS];
        //             }
                    
        //             new window.conversations.ManageSeedsImportComponent(
        //                 wrapperDiv,
        //                 this.groupId,
        //                 seedTypes
        //             );
        //         },
        //         onClose: () => {
        //             // Reload the instruction list after popup closes
        //             this.loadContent();
        //         }
        //     });
        //     popup.show();

        // }
