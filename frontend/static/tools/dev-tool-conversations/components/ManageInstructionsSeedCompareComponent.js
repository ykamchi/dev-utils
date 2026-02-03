(function () {
    /*
        ManageInstructionsSeedCompareComponent: displays comparison between seed data and current instruction data
    */
    class ManageInstructionsSeedCompareComponent {
        constructor(container, groupId, groupName, selectedInstruction, selectedInstructionsSeed, onReloadFromSeed, onOverrideSeed) {
            this.container = container;
            this.groupId = groupId;
            this.groupName = groupName;
            this.selectedInstruction = selectedInstruction;
            this.selectedInstructionsSeed = selectedInstructionsSeed;
            this.onReloadFromSeed = onReloadFromSeed;
            this.onOverrideSeed = onOverrideSeed;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');

            const pageButtons = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');

            if (this.selectedInstructionsSeed) {
                // Seed exists - save to override
                new window.ButtonComponent(pageButtons, '💾 Override seed', async () => {
                    await window.conversations.apiSeeds.seedsInstructionsSet(
                        this.container, 
                        this.groupName, 
                        this.selectedInstruction.instructions_key, 
                        this.selectedInstruction
                    );
                    if (this.onOverrideSeed) {
                        this.onOverrideSeed();
                    }
                }, window.ButtonComponent.TYPE_GHOST, '💾 Override seed');

                // Seed exists - reload from seed
                new window.ButtonComponent(pageButtons, '💡 Reload from seed', async () => {
                    await window.conversations.apiInstructions.instructionsUpdate(
                        this.container, 
                        this.groupId,
                        this.selectedInstruction.instructions_key,
                        this.selectedInstructionsSeed.instructions,
                        this.selectedInstructionsSeed.feedback_def,
                        this.selectedInstructionsSeed.info
                    );
                    if (this.onReloadFromSeed) {
                        this.onReloadFromSeed();
                    }
                }, window.ButtonComponent.TYPE_GHOST, '💡 Reload from seed');

            } else {
                // Seed does not exist - create new seed
                new window.ButtonComponent(pageButtons, '💾 Create seed', async () => {
                    await window.conversations.apiSeeds.seedsInstructionsSet(
                        this.container, 
                        this.groupName, 
                        this.selectedInstruction.instructions_key, 
                        this.selectedInstruction
                    );
                    if (this.onOverrideSeed) {
                        this.onOverrideSeed();
                    }
                }, window.ButtonComponent.TYPE_GHOST, '💾 Create seed');
            }

            // Create tabset for different diff views
            const tabsetDiv = window.conversations.utils.createDivContainer(wrapper);
            const storageKey = `conversations-seed-diff-${this.groupId}-${this.selectedInstruction.instructions_key}`;
            new window.TabsetComponent(tabsetDiv, [
                { name: 'Info', populateFunc: (c) => this.populateInfoDiffTab(c) },
                { name: 'Instructions', populateFunc: (c) => this.populateInstructionsDiffTab(c) },
                { name: 'Feedback', populateFunc: (c) => this.populateFeedbackDiffTab(c) }
            ], storageKey);
        }

        populateInfoDiffTab(container) {
            new window.DiffComponent(
                container,
                window.Utils.sortJsonKeys(this.selectedInstructionsSeed?.info || {}),
                window.Utils.sortJsonKeys(this.selectedInstruction.info),
                {
                    leftLabel: 'Seed Data - Info',
                    rightLabel: 'Current Data - Info',
                    height: 500
                }
            );
        }

        populateInstructionsDiffTab(container) {
            new window.DiffComponent(
                container,
                this.selectedInstructionsSeed?.instructions || '',
                this.selectedInstruction.instructions,
                {
                    leftLabel: 'Seed Data - Instructions',
                    rightLabel: 'Current Data - Instructions',
                    height: 500
                }
            );
        }

        populateFeedbackDiffTab(container) {
            new window.DiffComponent(
                container,
                window.Utils.sortJsonKeys(this.selectedInstructionsSeed?.feedback_def || {}),
                window.Utils.sortJsonKeys(this.selectedInstruction.feedback_def),
                {
                    leftLabel: 'Seed Data - Feedback',
                    rightLabel: 'Current Data - Feedback',
                    height: 500
                }
            );
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsSeedCompareComponent = ManageInstructionsSeedCompareComponent;
})();
