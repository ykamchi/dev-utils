(function() {
    
    class CardConversationMessageComponent {
        constructor(container, message, instructions) {
            this.container = container;
            this.message = message;
            this.instructions = instructions;
            
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, '📢', 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // First line
            const firstLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between');

            // Member names
            window.conversations.utils.createReadOnlyText(firstLine, this.message.member_nick_name, 'conversations-card-name');

            // Created at
            window.conversations.utils.createLabel(firstLine, Utils.formatDateTime(this.message.created_at), 'conversations-instructions-item-created-at');    
            
            // Second line
            const secondLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between');            

            // Description
            window.conversations.utils.createReadOnlyText(secondLine, this.message.message_text.length > 100  ? this.message.message_text.substring(0, 100) + "..." : this.message.message_text, 'conversations-card-description');

            // Body content
            const bodyContent = window.conversations.utils.createDivContainer(null, 'conversations-card-wrapper');

            // Feedback info
            if (this.message.feedback && typeof this.message.feedback === 'object') {
                new window.conversations.ConversationFeedbackInfoComponent(bodyContent, this.message.feedback, this.instructions, true, true);
            }

            // Full message text
            window.conversations.utils.createField(bodyContent, 'Full message text:', this.message.message_text);
            
            new window.ExpandDivComponent(
                this.container,                
                wrapper,
                bodyContent,
            ).body;

        }
    }

    // Ensure the namespace exists
    window.conversations = window.conversations || {};
    window.conversations.CardConversationMessageComponent = CardConversationMessageComponent;

})();