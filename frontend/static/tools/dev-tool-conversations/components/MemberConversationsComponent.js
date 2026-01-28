(function () {
    /*
        MemberConversationsComponent: displays conversations for a member in dev-tool-conversations
    */
    class MemberConversationsComponent {
        constructor(container, groupId, member, groupInstructions, conversation_type) {
            this.container = container;
            this.groupId = groupId;
            this.member = member
            this.conversation_type = conversation_type;
            this.groupInstructions = {};
            for (const [key, instructions] of Object.entries(groupInstructions)) {
                if (instructions.info.conversation_type === conversation_type) {
                    this.groupInstructions[key] = instructions;
                }
            }
            this.showOnlyLast = true;
            this.contentDiv = null;
            this.page = null;
            this.render();
        }

        render() {
            this.page = new window.conversations.PageComponent(this.container);
            
            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            new ToggleButtonComponent(
                controlDiv,
                this.showOnlyLast,
                async (v) => {
                    if (v) {
                        this.showOnlyLast = true;
                    } else {
                        this.showOnlyLast = false;
                    }
                    this.loadContent();
                },
                'Last per type',
                'All',
                '140px',
                '34px'
            );
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversation-container-horizontal');
            
            // Create "Start new ..." button text
            let startNewConversationButtonText = window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type];
            startNewConversationButtonText += ' Start new ';
            startNewConversationButtonText += window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false);

            

            new window.ButtonComponent(buttonsDiv, startNewConversationButtonText, this.showConversationStartPopup.bind(this), window.ButtonComponent.TYPE_GHOST, startNewConversationButtonText);

            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Fetch conversations for the member
            const conversations = await window.conversations.apiConversations.conversationsList('', this.groupId, this.member.name, this.conversation_type, this.showOnlyLast);
            for (const conversation of conversations) {
                conversation['names'] = conversation.members.map(m => m.member_nick_name).filter(name => name !== this.member.name).join(', ');
            }
            
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            new window.ListComponent(contentDiv, conversations, (conversation) => {
                    const conversationDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberConversationComponent(conversationDiv, conversation, this.member, this.groupInstructions);
                    return conversationDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE, null, 
                (item, query) => {
                    
                    return item.names.toLowerCase().includes(query.toLowerCase());
                }, 
                [
                    { label: 'Creation Date', func: (a, b) => new Date(a.created_at) - new Date(b.created_at), direction: -1 },
                    { label: 'Name', func: (a, b) => { return a.names < b.names ? -1 : 1; } , direction: 1 },
                    { label: 'Instruction Type', func: (a, b) => a.info.type < b.info.type ? -1 : 1, direction: 1 },
                ] 
            );
            this.page.updateContentArea(contentDiv);
        }

        showConversationStartPopup() {
            let popup = new window.PopupComponent({
                icon: window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type],
                title: 'Start new ' + window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false),
                content: (container) => {
                    new window.conversations.MemberConversationStartComponent(container, this.groupId, this.member, this.groupInstructions, this.conversation_type, popup);
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
