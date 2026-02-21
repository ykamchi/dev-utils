(function() {
    class ManageInstructionsAssistantComponent {
        constructor(component, groupName, instructions) {
            this.component = component;
            this.groupName = groupName;
            this.instructions = instructions;
            this.page = null;
            this.render();
        }

        render() {

            const wrapper = window.conversations.utils.createDivContainer(this.component);
            window.conversations.utils.createReadOnlyText(wrapper, 'Use this assistant to help you create effective instructions for your conversations. Follow the prompts and provide the necessary details.', '-');

            new window.ButtonComponent(wrapper, {
                label: 'Start',
                onClick: async () => this.showConversationStartPopup(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: 'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversation_type]
            });
            
            this.load(wrapper);
        }

        async load(component) {
            this.members = await window.conversations.apiMembers.membersList(component, this.groupName);
           
            // Create ListComponent with filtered members
            const items = Object.entries(this.members).map(([id, m]) => ({ id, member: m }));
        }

        showConversationStartPopup() {
            window.conversations.popups.startConversation(
                this.groupName, 
                null, 
                this.members, 
                { [this.instructions.info.type]: this.instructions }, 
                this.instructions.info.conversation_type,
                null // No callback needed here
            );
        }


    }
    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsAssistantComponent = ManageInstructionsAssistantComponent;
})();