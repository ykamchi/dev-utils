(function() {
    
    class CardConversationMessageComponent {
        constructor(container, message, conversation) {
            this.container = container;
            this.message = message;
            this.conversation = conversation;
            
            this.render();
        }

        render() {
            // const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            

            const wrapperDetails = window.conversations.utils.createDivContainer(this.container, '-');
            const splitter = window.conversations.utils.createDivContainer(wrapperDetails, 'conversation-container-horizontal-space-between-full', { gap: '64px' });
            const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.1', 'align-items': 'flex-start' });
            const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.9' });

            // // Icon 
            // window.conversations.utils.createReadOnlyText(wrapper, '📢', 'conversations-list-card-icon');

            // // Info
            // const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // // First line
            // const firstLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between-full');

            // const leftDiv = window.conversations.utils.createDivContainer(wrapper, '-', { width: '150px'})
            // Member names
            window.conversations.utils.createReadOnlyText(leftDiv, this.message.member_name, 'conversations-card-name');

            const memberRole = this.conversation.participants.find(p => p.member_name === this.message.member_name)?.instruction_role || 'unknown';
            window.conversations.utils.createLabel(leftDiv, `Role: ${memberRole}`);


            // Created at
            window.conversations.utils.createLabel(leftDiv, Utils.formatDateTime(this.message.created_at), 'conversations-instructions-item-created-at');    

            // Info
            // const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-field-container-vertical');

            // First line
            // const firstLine = window.conversations.utils.createDivContainer(rightDiv, 'conversation-container-horizontal-space-between-full');

            // Second line
            // const secondLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between-full');            

            // // Description
            // window.conversations.utils.createReadOnlyText(secondLine, this.message.message_text.length > 100  ? this.message.message_text.substring(0, 100) + "..." : this.message.message_text, 'conversations-card-description');

            // Body content
            // const bodyContent = window.conversations.utils.createDivContainer(null, 'conversations-card-wrapper');


            // Feedback info
            if (this.message.feedback && typeof this.message.feedback === 'object') {

                // Get the participant data including the feedback and the feedback_def from the conversation
                const participant = this.conversation.participants.find(p => p.member_name === this.message.member_name);
                const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role).feedback_def;
                
                new window.conversations.ConversationFeedbackInfoComponent(rightDiv, this.message.feedback, feedback_def, true, false);
            }

            // Full message text
            window.conversations.utils.createField(rightDiv, 'Full message text:', this.message.message_text);
            
            // new window.ExpandDivComponent(
            //     this.container,                
            //     wrapper,
            //     bodyContent,
            // ).body;

        }
    }

    // Ensure the namespace exists
    window.conversations = window.conversations || {};
    window.conversations.CardConversationMessageComponent = CardConversationMessageComponent;

})();