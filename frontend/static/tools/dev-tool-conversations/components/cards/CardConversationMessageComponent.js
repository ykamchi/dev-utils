(function () {

    class CardConversationMessageComponent {
        constructor(container, message, conversation) {
            this.container = container;
            this.message = message;
            this.conversation = conversation;

            this.render();
        }

        render() {
            const wrapperDetails = window.conversations.utils.createDivContainer(this.container, '-');
            const splitter = window.conversations.utils.createDivContainer(wrapperDetails, 'conversation-container-horizontal-space-between-full', { gap: '64px' });
            const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.1', 'align-items': 'flex-start' });
            const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.9' });

            // Member name
            window.conversations.utils.createReadOnlyText(leftDiv, this.message.member_name, 'conversations-card-name');

            // Member role
            const memberRole = this.conversation.participants.find(p => p.member_name === this.message.member_name).instruction_role;
            window.conversations.utils.createLabel(leftDiv, `Role: ${memberRole}`);

            // Created at
            window.conversations.utils.createLabel(leftDiv, Utils.formatDateTime(this.message.created_at), 'conversations-instructions-item-created-at');

            // Cost
            const cost = window.conversations.utils.messageCost(this.conversation.llm_provider, this.conversation.llm_model, this.message) + '$';
            window.conversations.utils.createLabel(leftDiv, cost, 'conversations-instructions-item-created-at');

            // Feedback info
            if (this.message.feedback && typeof this.message.feedback === 'object') {

                // Get the participant data including the feedback and the feedback_def from the conversation
                const participant = this.conversation.participants.find(p => p.member_name === this.message.member_name);
                const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role).feedback_def;

                new window.conversations.ConversationFeedbackInfoComponent(rightDiv, this.message.feedback, feedback_def, true, false);
            }

            // Full message text
            window.conversations.utils.createField(rightDiv, 'Full message text:', this.message.message_text);
        }
    }

    // Ensure the namespace exists
    window.conversations = window.conversations || {};
    window.conversations.CardConversationMessageComponent = CardConversationMessageComponent;

})();