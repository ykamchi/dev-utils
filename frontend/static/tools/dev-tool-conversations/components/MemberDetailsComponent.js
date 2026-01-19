(function () {
    /*
        MemberDetails: right side tabset for member details in dev-tool-conversations
    */
    class MemberDetailsComponent {
        constructor(container, groupName, memberId, membersMap) {
            this.container = container;
            this.groupName = groupName;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.member = membersMap[memberId];
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
            const controlDiv = window.conversations.utils.createDivContainer(null, null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonsDiv, '💾', () => window.AlertComponent('Save', 'Save member not yet implemented'), window.ButtonComponent.TYPE_GHOST, '💾 Save member');
            new window.ButtonComponent(buttonsDiv, '+', () => window.AlertComponent('Add', 'Add member not yet implemented'), window.ButtonComponent.TYPE_GHOST, '+ Add member');
            new window.ButtonComponent(buttonsDiv, '🗙', () => window.AlertComponent('Delete', 'Delete member not yet implemented'), window.ButtonComponent.TYPE_GHOST_DANGER, '🗙 Delete member');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Fetch group instructions for AI decision types
            const groupInstructionsResults = await window.conversations.api.fetchGroupInstructions(this.container, this.groupName);          
            const groupInstructions = {}
            for (const entry in groupInstructionsResults) {
                groupInstructions[groupInstructionsResults[entry].info.type] = groupInstructionsResults[entry];
            }

            // Page content
            const contentDiv = window.conversations.utils.createDivContainer(null, null, '');
            const tabs = [
                { name: '🧑 Profile', populateFunc: (container) => { window.conversations.utils.createJsonDiv(container, this.member) } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_DECISION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupName, this.memberId, this.membersMap, groupInstructions, window.conversations.CONVERSATION_TYPES.AI_DECISION); } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_CONVERSATION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupName, this.memberId, this.membersMap, groupInstructions, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION); } }
            ];
            const storageKey = this.member ? `conversations-member-tabset` : '';
            new window.TabsetComponent(contentDiv, tabs, storageKey);
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDetailsComponent = MemberDetailsComponent;
})();