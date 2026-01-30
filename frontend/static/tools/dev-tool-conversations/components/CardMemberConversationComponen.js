(function () {
    /*
        CardMemberConversationComponent: renders a single conversation card for dev-tool-conversations
    */
    class CardMemberConversationComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} conversation - The conversation object
         * @param {string} memberId - The ID of the current member
         * @param {Object} membersMap - Map of member IDs to member objects
         * @param {Object} groupInstructions - The instructions map
         * 
         */
        constructor(container, conversation, member, instructions) {
            this.container = container;
            this.conversation = conversation;
            this.member = member;
            this.instructions = instructions;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, `${window.conversations.CONVERSATION_TYPES_ICONS[this.instructions.info.conversation_type]}`, 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // First line
            const firstLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between');

            // Member names
            window.conversations.utils.createReadOnlyText(firstLine, this.conversation.participants, 'conversations-card-name');

            // Created at
            window.conversations.utils.createLabel(firstLine, Utils.formatDateTime(this.conversation.created_at), 'conversations-instructions-item-created-at');    

            // Second line
            const secondLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between');

            // Feedback fields
            const leftSide = window.conversations.utils.createDivContainer(secondLine, 'conversation-container-horizontal');
            
            // Feedback info
            new window.conversations.ConversationFeedbackInfoComponent(leftSide, this.conversation.feedback, this.instructions, true, false);

            // Tags and metadata
            const rightSide = window.conversations.utils.createDivContainer(secondLine, 'conversation-field-container-vertical');

            const tagsDiv = window.conversations.utils.createDivContainer(rightSide, 'conversations-tags-container');
            // Conversation type
            window.conversations.utils.createReadOnlyText(tagsDiv, this.instructions.info.name, 'conversations-badge-generic', this.instructions.info.description);
            window.conversations.utils.createReadOnlyText(tagsDiv, Utils.durationSecondsToHMS(this.conversation.status?.duration_seconds), 'conversations-badge-generic', 'Duration');
            window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.status?.message_count, 'conversations-badge-generic', 'Number of messages');
            window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.status?.state, 'conversations-badge-state-'+this.conversation.status?.state, 'State');
            
            // Add click handler to show conversation details popup
            wrapper.addEventListener('click', this.showConversationDetails.bind(this));

        }

        async showConversationDetails() {
            new window.PopupComponent({
                icon: window.conversations.CONVERSATION_TYPES_ICONS[this.instructions.info.conversation_type],
                title: 'Conversation Details',
                content: (container) => {
                    new window.conversations.MemberConversationDetailsComponent(container, this.conversation, this.member, this.instructions);
                },
                closable: true,
                width: '1200px',
                height: '800px'
            }).show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardMemberConversationComponent = CardMemberConversationComponent;
})();
