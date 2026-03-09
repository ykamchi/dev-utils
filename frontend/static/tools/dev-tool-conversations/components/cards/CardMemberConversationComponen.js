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
        constructor(container, conversation, member) {
            this.container = container;
            this.conversation = conversation;
            this.member = member;
            this.render();
        }

        render() {
                        // window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.info.name + 'ss', 'conversations-badge-generic', this.conversation.info.conversation_objectives);

            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, `${window.conversations.CONVERSATION_STATE_ICONS[this.conversation.state]}`, 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info', { 'gap': '8px' });

            // First line
            const firstLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between-full');

            // Member names
            window.conversations.utils.createReadOnlyText(firstLine, this.conversation.participants.map(p => p.member_name).join(", "), 'conversations-card-name');

            // Created at
            // const createdAtDiv = window.conversations.utils.createDivContainer(firstLine, '-', { 'display': 'flex', 'align-items': 'center', 'gap': '4px' });
            window.conversations.utils.createSpan(firstLine, this.conversation.info.name + ' - ' +  Utils.formatDateTime(this.conversation.created_at));
            // window.conversations.utils.createLabel(createdAtDiv, Utils.formatDateTime(this.conversation.created_at), 'conversations-instructions-item-created-at');    

            // Second line
            const secondLine = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal-space-between-full');

            // Tags and metadata
            const sideLeft = window.conversations.utils.createDivContainer(secondLine, 'conversation-field-container-vertical', { 'justify-content': 'flex-end' });
            // Feedback fields
            const sideRight = window.conversations.utils.createDivContainer(secondLine, 'conversation-container-horizontal');



            // Get the participant data including the feedback and the feedback_def from the conversation
            const participant = this.conversation.participants.find(p => p.member_name === this.member.member_name);
            const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role).feedback_def;
            
            // Feedback info
            new window.conversations.ConversationFeedbackInfoComponent(sideRight, participant.feedback, feedback_def, true, false);

            

            const tagsDiv = window.conversations.utils.createDivContainer(sideLeft, 'conversations-tags-container');
            // Conversation type
            new window.ProgressBarComponent(tagsDiv, { width: '150px', height: '100%', percentage: 100 * this.conversation.message_count / this.conversation.info.max_turns });
            window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.message_count + ' / ' + this.conversation.info.max_turns, 'conversations-badge-generic', 'Number of messages');
            window.conversations.utils.messagesCost(this.conversation.llm_provider, this.conversation.llm_model, this.messages) + '$'
            window.conversations.utils.createReadOnlyText(tagsDiv, Utils.durationSecondsToHMS(this.conversation.duration_seconds), 'conversations-badge-generic', 'Duration');
            window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.llm_model, 'conversations-badge-generic', 'LLM Model');
            // window.conversations.utils.createReadOnlyText(tagsDiv, this.conversation.state, 'conversations-badge-state-'+this.conversation.state, 'State');
            
            //new window.ProgressBarComponent(rightSide, { width: '100%', height: '12px', percentage: 100*this.conversation.message_count/this.conversation.info.max_turns, label: '' });
            
            
            // Add click handler to show conversation details popup
            wrapper.addEventListener('click', () => {
                window.conversations.popups.openConversationView(this.conversation.conversation_id, this.conversation.info.conversation_type, this.member)
            });
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardMemberConversationComponent = CardMemberConversationComponent;
})();
