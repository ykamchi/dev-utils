(function () {
    /*
        CardQueueEntryComponent: Displays a single queue entry card
    */
    class CardQueueEntryComponent {
        constructor(container, conversation, onAction) {
            this.container = container;
            this.conversation = conversation;
            this.onAction = onAction; // Callback when an action is performed
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon based on state
            const statusIcon = window.conversations.CONVERSATION_STATE_ICONS[this.conversation.state] || '❓';
            window.conversations.utils.createReadOnlyText(wrapper, statusIcon, 'conversations-list-card-icon');
            
            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');
            
            // Name (conversation type + status)
            const nameText = `${window.conversations.CONVERSATION_TYPES_STRING(this.conversation.info.conversation_type, true, true, true, false) || 'N/A'} - ${this.conversation.state}`;
            window.conversations.utils.createReadOnlyText(info, nameText, 'conversations-card-name');
            
            // Description (group, provider, created at)
            const descriptionParts = [];
            if (this.conversation.conversation_id) {
                descriptionParts.push(`ID: ${this.conversation.conversation_id}`);
            }
            if (this.conversation.group_id) {
                descriptionParts.push(`Group: ${this.conversation.group_id}`);
            }
            if (this.conversation.llm_provider) {
                descriptionParts.push(this.conversation.llm_provider);
            }
            if (this.conversation.llm_model) {
                descriptionParts.push(this.conversation.llm_model);
            }
            if (this.conversation.created_at) {
                descriptionParts.push(new Date(this.conversation.created_at).toLocaleString());
            }
            
            if (descriptionParts.length > 0) {
                window.conversations.utils.createReadOnlyText(info, descriptionParts.join(' • '), 'conversations-card-description');
            }
            
            // Show error message if exists
            if (this.conversation.error_message) {
                window.conversations.utils.createReadOnlyText(info, `Error: ${this.conversation.error_message}`, 'conversations-card-description');
            }
            
            // Add action buttons based on state
            new window.conversations.ConversationButtonsControlComponent(wrapper, this.conversation);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardQueueEntryComponent = CardQueueEntryComponent;
})();
