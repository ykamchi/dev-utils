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
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, null, 'conversations-buttons-container');
            this.onlyLastCheckbox = new window.CheckboxComponent(buttonsDiv, false, (checked) => {
                this.loadContent();
            }, 'Only show latest decision', false, 'If checked, only the latest decision will be shown for each decision type.');
            new window.ButtonComponent(buttonsDiv, '⚖️ Start new decision', this.startNewDecisionPopup.bind(this), window.ButtonComponent.TYPE_GHOST, '⚖️ Start new decision');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Fetch decisions for the member
            const decisions = await window.conversations.api.fetchMemberConversations('', this.memberId, this.conversation_type, this.onlyLastCheckbox.isChecked());
            
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer(null, null, '');
            new window.ListComponent(contentDiv, decisions, (decision) => {
                const decisionDiv = window.conversations.utils.createDivContainer(null, null, '');
                new window.conversations.CardMemberDecisionComponent(decisionDiv, decision, this.memberId, this.membersMap, this.groupInstructions);
                return decisionDiv;
            });
            this.page.updateContentArea(contentDiv);
        }

        startNewDecisionPopup() {
            let popup = new window.PopupComponent({
                title: 'Start New Decision',
                content: (container) => {
                    new window.conversations.MemberConversationStartComponent(container, this.groupName, this.memberId, this.membersMap, this.groupInstructions, this.conversation_type, popup);
                },
                closable: true,
                width: '660px',
                height: '600px'
            });
            popup.show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationsComponent = MemberConversationsComponent;
})();
