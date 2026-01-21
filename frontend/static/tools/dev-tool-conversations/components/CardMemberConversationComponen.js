(function () {
    /*
        CardMemberConversationComponent: renders a single decision card for dev-tool-conversations
    */
    class CardMemberConversationComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} decision - The decision object
         * @param {string} memberId - The ID of the current member
         * @param {Object} membersMap - Map of member IDs to member objects
         * @param {Object} groupInstructions - The instructions map
         * 
         */
        constructor(container, decision, memberId, membersMap, groupInstructions) {
            this.container = container;
            this.decision = decision;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupInstructions = groupInstructions;
            this.feedbackDefMap = this.groupInstructions[this.decision.context.type]?.feedback_def;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, `${window.conversations.CONVERSATION_TYPES_ICONS[this.decision?.info?.conversation_type]}`, 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // First line
            const firstLine = window.conversations.utils.createDivContainer(info, 'conversations-container-horizontal-space-between');

            // Member names
            window.conversations.utils.createReadOnlyText(firstLine, this.decision.members.map(m => m.member_nick_name).filter(name => name !== this.membersMap[this.memberId].name).join(', '), 'conversations-card-name');

            // Created at
            window.conversations.utils.createLabel(firstLine, Utils.formatDateTime(this.decision.created_at), 'conversations-instructions-item-created-at');

            // Second line
            const secondLine = window.conversations.utils.createDivContainer(info, 'conversations-container-horizontal-space-between');

            // Feedback fields
            const leftSide = window.conversations.utils.createDivContainer(secondLine, 'conversation-container-horizontal');
            
            for (const [key, value] of Object.entries(this.decision?.feedback || {})) {
                if (this.decision.info.meta?.feedbackImportant[key]) {
                    const feedbackDef = this.feedbackDefMap[key];
                    if (!feedbackDef) continue;
                    const feedbackField = window.conversations.utils.createDivContainer(leftSide, 'conversation-container-vertical', feedbackDef.description);
                    window.conversations.utils.createLabel(feedbackField, key);
                    if (feedbackDef.type === 'integer') {
                        new window.RateComponent(feedbackField, feedbackDef.min, feedbackDef.max, value, '100px', '18px', true);
                    } else {
                        window.conversations.utils.createReadOnlyText(feedbackField, value, 'conversations-field-value');
                    }
                }
            }

            // Tags and metadata
            const rightSide = window.conversations.utils.createDivContainer(secondLine, 'conversation-container-vertical');

            const tagsDiv = window.conversations.utils.createDivContainer(rightSide, 'conversations-tags-container');
            // Decision type
            window.conversations.utils.createReadOnlyText(tagsDiv, this.groupInstructions[this.decision.context.type].info.name, 'conversations-badge-generic', this.groupInstructions[this.decision.context.type].info?.description);
            window.conversations.utils.createReadOnlyText(tagsDiv, Utils.durationSecondsToHMS(this.decision.status?.duration_seconds), 'conversations-badge-generic', 'Duration');
            window.conversations.utils.createReadOnlyText(tagsDiv, this.decision.status?.message_count, 'conversations-badge-generic', 'Number of messages');
            window.conversations.utils.createReadOnlyText(tagsDiv, this.decision.status?.state, 'conversations-badge-state-'+this.decision.status?.state, 'State');
            
            // Add click handler to show decision details popup
            wrapper.addEventListener('click', this.showDecisionDetails.bind(this));

        }

        async showDecisionDetails() {
            new window.PopupComponent({
                title: 'Decision Details',
                content: (container) => {
                    new window.conversations.MemberConversationDetailsComponent(container, this.decision, this.memberId, this.membersMap, this.groupInstructions);
                },
                closable: true,
                width: '600px',
                height: '400px'
            }).show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardMemberConversationComponent = CardMemberConversationComponent;
})();
