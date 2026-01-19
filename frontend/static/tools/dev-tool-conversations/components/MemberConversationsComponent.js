(function () {
    /*
        MemberConversationsComponent: displays decisions for a member in dev-tool-conversations
    */
    class MemberConversationsComponent {
        constructor(container, groupName, memberId, membersMap, groupInstructions, conversation_type) {
            this.container = container;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupName = groupName;
            this.member = membersMap[memberId];
            this.conversation_type = conversation_type;
            this.groupInstructions = {};
            for (const [key, instructions] of Object.entries(groupInstructions)) {
                if (instructions.info.conversation_type === conversation_type) {
                    this.groupInstructions[key] = instructions;
                }
            }
            this.onlyLastCheckbox = null;
            this.contentDiv = null;
            this.page = null;
            this.render();
        }

        render() {
            this.page = new window.conversations.PageComponent(this.container);
            
            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, null, '-');
            this.onlyLastCheckbox = new window.CheckboxComponent(controlDiv, false, (checked) => {
                this.loadContent();
            }, 'Only show latest decision', false, 'If checked, only the latest decision will be shown for each decision type.');

            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, null, 'conversations-buttons-container');
            
            // Create "Start new ..." button text
            let startNewConversationButtonText = window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type];
            startNewConversationButtonText += ' Start new ';
            startNewConversationButtonText += window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false);

            new window.ButtonComponent(buttonsDiv, startNewConversationButtonText, this.startNewDecisionPopup.bind(this), window.ButtonComponent.TYPE_GHOST, startNewConversationButtonText);
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Fetch decisions for the member
            const conversations = await window.conversations.api.fetchMemberConversations('', this.memberId, this.conversation_type, this.onlyLastCheckbox.isChecked());
            
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            new window.ListComponent(contentDiv, conversations, (conversation) => {
                const conversationDiv = window.conversations.utils.createDivContainer();
                new window.conversations.CardMemberConversationComponent(conversationDiv, conversation, this.memberId, this.membersMap, this.groupInstructions);
                return conversationDiv;
            });
            this.page.updateContentArea(contentDiv);
        }

        startNewDecisionPopup() {
            let popup = new window.PopupComponent({
                icon: window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type],
                title: 'Start new ' + window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false),
                content: (container) => {
                    new window.conversations.MemberConversationStartComponent(container, this.groupName, this.memberId, this.membersMap, this.groupInstructions, this.conversation_type, popup);
                },
                closable: true,
                width: '910px',
                height: '900px'
            });
            popup.show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationsComponent = MemberConversationsComponent;
})();
