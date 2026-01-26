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

            new window.ButtonComponent(wrapper, 'Start', async () => this.showConversationStartPopup(), window.ButtonComponent.TYPE_GHOST, 'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversation_type]);
            
            this.load(wrapper);
        }

        async load(component) {
            this.members = await window.conversations.api.fetchGroupMembers(component, this.groupName);
           
            // Create ListComponent with filtered members
            const items = Object.entries(this.members).map(([id, m]) => ({ id, member: m }));
        }

        showConversationStartPopup() {
            let popup = new window.PopupComponent({
                icon: window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type],
                title: 'Start new ' + window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false),
                content: (container) => {
                    new window.conversations.MemberConversationStartComponent(container, this.groupName, null, this.members, { [this.instructions.info.type]: this.instructions }, this.instructions.info.conversation_type, popup);
                },
                closable: true,
                width: '910px',
                height: '900px'
            });
            popup.show();
        }


    }
    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsAssistantComponent = ManageInstructionsAssistantComponent;
})();