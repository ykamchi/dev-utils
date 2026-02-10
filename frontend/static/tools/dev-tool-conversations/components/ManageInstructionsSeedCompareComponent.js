(function () {
    /*
        ManageInstructionsSeedCompareComponent: displays comparison between seed data and current instruction data
    */
    class ManageInstructionsSeedCompareComponent {
        constructor(container, groupId, groupName, groupKey,selectedInstruction, selectedInstructionsSeed, onReloadFromSeed, onOverrideSeed) {
            this.container = container;
            this.groupId = groupId;
            this.groupName = groupName;
            this.groupKey = groupKey;
            this.selectedInstruction = selectedInstruction;
            this.selectedInstructionsSeed = selectedInstructionsSeed;
            console.log('Selected instruction:', this.selectedInstruction);
            console.log('Selected instruction seed:', this.selectedInstructionsSeed);
            this.onReloadFromSeed = onReloadFromSeed;
            this.onOverrideSeed = onOverrideSeed;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');

            const pageButtons = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');

            if (this.selectedInstructionsSeed) {
                // Seed exists - save to override
                new window.ButtonComponent(pageButtons, {
                    label: '💾 Override seed',
                    onClick: async () => {
                        await window.conversations.apiSeeds.seedsInstructionsSet(
                            this.container, 
                            this.groupName, 
                            this.selectedInstruction.instructions_key, 
                            this.selectedInstruction
                        );
                        if (this.onOverrideSeed) {
                            this.onOverrideSeed();
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '💾 Override seed'
                });

                // Seed exists - reload from seed
                new window.ButtonComponent(pageButtons, {
                    label: '💡 Reload from seed',
                    onClick: async () => {
                        await window.conversations.apiInstructions.instructionsUpdate(
                            this.container, 
                            this.groupId,
                            this.selectedInstructionsSeed.json
                        );
                        if (this.onReloadFromSeed) {
                            this.onReloadFromSeed();
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
                        await window.conversations.apiSeeds.seedsInstructionsSet(
                            this.container, 
                            this.groupKey, 
                            this.selectedInstruction.info.instruction_key, 
                            this.selectedInstruction.info
                        );
                        if (this.onOverrideSeed) {
                            this.onOverrideSeed();
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '💾 Create seed'
                });
            }

            // Create tabset for different diff views
            const tabsetDiv = window.conversations.utils.createDivContainer(wrapper);
            const storageKey = `conversations-seed-diff-${this.groupId}-${this.selectedInstruction.info.instruction_key}`;
            
            // Build tabs dynamically: Info tab + one tab per role
            const tabs = [
                { name: 'Info', populateFunc: (c) => this.populateInfoDiffTab(c) }
            ];
            
            // Merge role keys from both seed and current instruction
            const seedRoles = this.selectedInstructionsSeed?.json?.roles || {};
            const currentRoles = this.selectedInstruction.info.roles || {};
            const allRoleKeys = new Set([...Object.keys(seedRoles), ...Object.keys(currentRoles)]);
            
            // Add a tab for each role
            allRoleKeys.forEach(roleKey => {
                const seedRole = seedRoles[roleKey];
                const currentRole = currentRoles[roleKey];
                // Use role_name from current, fallback to seed, fallback to roleKey
                const roleName = currentRole?.role_name || seedRole?.role_name || roleKey;
                
                tabs.push({
                    name: roleName,
                    populateFunc: (c) => this.populateRoleDiffTab(c, roleKey, roleName)
                });
            });
            
            new window.TabsetComponent(tabsetDiv, tabs, storageKey);
        }

        populateInfoDiffTab(container) {
            // Get seed and current data without roles
            const seedInfoWithoutRoles = { ...(this.selectedInstructionsSeed?.json || {}) };
            delete seedInfoWithoutRoles.roles;
            
            const currentInfoWithoutRoles = { ...this.selectedInstruction.info };
            delete currentInfoWithoutRoles.roles;
            
            new window.DiffComponent(
                container,
                window.Utils.sortJsonKeys(seedInfoWithoutRoles),
                window.Utils.sortJsonKeys(currentInfoWithoutRoles),
                {
                    leftLabel: 'Seed Data - Info',
                    rightLabel: 'Current Data - Info',
                    height: 500
                }
            );
        }

        populateRoleDiffTab(container, roleKey, roleName) {
            const seedRole = this.selectedInstructionsSeed?.json?.roles?.[roleKey] || {};
            const currentRole = this.selectedInstruction.info.roles?.[roleKey] || {};
            
            new window.DiffComponent(
                container,
                window.Utils.sortJsonKeys(seedRole),
                window.Utils.sortJsonKeys(currentRole),
                {
                    leftLabel: `Seed Data - ${roleName}`,
                    rightLabel: `Current Data - ${roleName}`,
                    height: 500
                }
            );
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsSeedCompareComponent = ManageInstructionsSeedCompareComponent;
})();
