(function () {
    /*
        MemberDetails: right side tabset for member details in dev-tool-conversations
    */
    class MemberDetailsComponent {
        constructor(container, groupId, member) {
            this.container = container;
            this.groupId = groupId;
            this.member = member;
            this.page = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, '👤', this.member.name, {
                Age: this.member.age,
                Gender: this.member.gender,
                Location: this.member.location,
                Occupation: this.member.occupation
            });

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonsDiv, '💾', () => new window.AlertComponent('Save', 'Save member not yet implemented'), window.ButtonComponent.TYPE_GHOST, '💾 Save member');
            new window.ButtonComponent(buttonsDiv, '+', () => new window.AlertComponent('Add', 'Add member not yet implemented'), window.ButtonComponent.TYPE_GHOST, '+ Add member');
            new window.ButtonComponent(buttonsDiv, '🗙', () => new window.AlertComponent('Delete', 'Delete member not yet implemented'), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete member');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Fetch group instructions for AI decision types
            const groupInstructionsResults = await window.conversations.apiInstructions.instructionsList(this.container, this.groupId);
            const groupInstructions = {}
            for (const entry in groupInstructionsResults) {
                groupInstructions[groupInstructionsResults[entry].instructions_key] = groupInstructionsResults[entry];
            }

            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            const tabs = [
                { name: '🧑 Profile', populateFunc: (container) => { window.conversations.utils.createJsonDiv(container, this.member) } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_DECISION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupId, this.member, groupInstructions, window.conversations.CONVERSATION_TYPES.AI_DECISION); } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_CONVERSATION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupId, this.member, groupInstructions, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION); } }
            ];
            const storageKey = `conversations-member-tabset-${this.member.name}`;
            new window.TabsetComponent(contentDiv, tabs, storageKey);
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDetailsComponent = MemberDetailsComponent;
})();