(function () {
    /*
        MemberPropertiesComponent: Manage group members
    */
    class MemberPropertiesComponent {
        constructor(container, groupId, member, onMembersChanged = null) {
            this.container = container;
            this.groupId = groupId;
            this.member = member;
            this.onMembersChanged = onMembersChanged;
            this.group = null;

            this.membersSeed = null;

            this.undoButton = null;
            this.saveButton = null;
            this.seedButton = null;

            this.seedCompare = new window.conversations.SeedCompareComponent(
                member,
                async () => {
                    // onReloadFromSeed callback - we update the data with the new data from seed and save
                    // this.member = newData;
                    await this.save();
                },
                async (newSeed) => {
                    // onOverrideSeed callback - we save the new seed (the data filter is applied in the 
                    // SeedCompareComponent before calling this callback)
                    await window.conversations.apiSeeds.seedsMembersSet(this.wrapper, this.group.group_key, this.seedCompare.data.member_key, newSeed);
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
                ['created_at', 'group_id', 'member_id']
            );

            this.wrapper = null;

            this.render();
        }

        render() {
            this.wrapper = window.conversations.utils.createDivContainer(this.container, '-');

            // Create buttonsArea
            this.createButtonsArea();

            // Member edit area
            this.memberEditArea = window.conversations.utils.createDivContainer(this.wrapper, 'conversation-container-vertical');

            this.loadContent();
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
                tooltip: '💾 Save instruction',
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
                tooltip: '🗙 Delete member',
            });
        }

        async loadContent() {
            // Clear member profile area
            this.memberEditArea.innerHTML = '';

            this.group = await window.conversations.apiGroups.groupsGet(this.memberEditArea, this.groupId);

            // Load the seed data for the selected member
            const seeds = await window.conversations.apiSeeds.seedsMembersGet(this.memberEditArea, this.group, this.seedCompare.data.member_key);
            if (seeds.length > 0) {
                this.selectedMembersSeed = seeds[0].json;
            } else {
                this.selectedMembersSeed = null;
            }
            this.seedCompare.updateSeed(this.selectedMembersSeed);

            // Member Name input
            window.conversations.utils.createInput(this.memberEditArea, 'Member Name:', {
                initialValue: this.seedCompare.data.member_name,
                placeholder: 'Enter member name',
                onChange: (value) => {
                    this.seedCompare.change((data) => { data.member_name = value; });
                }
            });
            
            const rolesFieldDiv = window.conversations.utils.createFieldDiv(this.memberEditArea, 'Member Roles:');
            new window.StringArrayComponent(rolesFieldDiv, 
                    this.seedCompare.data['member_roles'], 'Add optional value...', (values) => {
                        this.seedCompare.change((data) => { data['member_roles'] = values; });
                    }, window.StringArrayComponent.STYLE_WRAP);


            // Member profile as JSON textarea
            window.conversations.utils.createTextArea(this.memberEditArea, 'Member Profile (JSON):', {
                initialValue: JSON.stringify(this.member.member_profile, null, 2),
                placeholder: '{}',
                onChange: (value) => {
                    try {
                        // this.member = JSON.parse(value);
                        // TODO: Add save functionality to persist changes
                        try {
                            this.seedCompare.change((data) => { data['member_profile'] = JSON.parse(value); });
                        } catch (e) {
                            // console.error('Invalid JSON in member profile:', e);
                        }
                    } catch (e) {
                        console.error('Invalid JSON in member profile:', e);
                    }
                },
                rows: 25
            });
        }

        // Save the selected member
        async save() {
            // Call API to save
            try {
                this.seedCompare.update(await window.conversations.apiMembers.membersUpdate(null, this.seedCompare.data));
                this.onMembersChanged(this.seedCompare.data);
                this.loadContent();
                new window.AlertComponent('Save member', 'Member has been saved successfully.');
            } catch (error) {
                console.error('Error saving member:', error);
                new window.AlertComponent('Save member', 'Failed to save member.');
            }
        }

        // Delete the member
        async delete() {
            new window.AlertComponent('Delete Member', 'Are you sure you want to delete this member?', [
                ['Confirm Delete', async () => {
                    // Call API to delete
                    await window.conversations.apiMembers.membersDelete(null, this.seedCompare.data.member_id);

                    // Notify parent if callback provided (e.g., to reload members in left panel)
                    this.onMembersChanged(null);
                }],
                ['Cancel', () => { }]
            ]);
        }

        destroy() {
            console.log('[Conversations Tool] - Destroying MemberPropertiesComponent and cleaning up resources...');
            if (this.seedCompare && this.seedCompare.destroy) {
                this.seedCompare.destroy();
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberPropertiesComponent = MemberPropertiesComponent;
})();
