(function () {
    /*
        CardMemberDecisionComponent: renders a single decision card for dev-tool-conversations
    */
    class CardMemberDecisionComponent {
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
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-decision-item-wrapper', 'conversations-decision-item-wrapper');

            // First line
            const firstLine = window.conversations.utils.createDivContainer(wrapper, 'conversations-decision-item-header', 'conversations-decision-item-header');

            // Member names
            window.conversations.utils.createReadOnlyText(firstLine, null, this.decision.members.map(m => m.member_nick_name).filter(name => name !== this.membersMap[this.memberId].name).join(', '), 'conversations-decision-item-members-names');

            // Decision type
            const typeDiv = window.conversations.utils.createReadOnlyText(firstLine, 'conversations-decision-item-decision-type', this.groupInstructions[this.decision.context.type]?.info?.name, 'conversations-decision-item-decision-type');
            typeDiv.title = this.groupInstructions[this.decision.context.type]?.info?.description;

            // Second line
            const secondLine = window.conversations.utils.createDivContainer(wrapper);
            secondLine.className = 'conversations-decision-item-header';

            // Feedback fields
            if (this.decision.feedback && typeof this.decision.feedback === 'object') {
                const feedbackContainer = window.conversations.utils.createDivContainer(secondLine, null, 'conversations-decision-item-feedback-container');
                
                for (const [key, value] of Object.entries(this.decision.feedback)) {
                    const fieldDiv = window.conversations.utils.createDivContainer(feedbackContainer, null, 'conversations-decision-item-feedback-field');

                    // Feedback entry key
                    window.conversations.utils.createLabel(fieldDiv, key);
                    
                    // Feedback entry value using the feedback definition   
                    const valueDiv = window.conversations.utils.createDivContainer(fieldDiv, null, 'conversations-decision-item-feedback-value');
                    if (this.feedbackDefMap === undefined) {
                        valueDiv.textContent = value;
                        continue;
                    }
                    const feedbackDef = this.feedbackDefMap[key];
                    if (!feedbackDef) {
                        valueDiv.textContent = value;
                        continue;
                    }
                    if (feedbackDef.type === 'integer') {
                        new window.RateComponent(valueDiv, feedbackDef.min, feedbackDef.max, value, '100px', '8px', false);
                    } else if (feedbackDef.type === 'string') {
                        valueDiv.textContent = value;
                    } else {
                        valueDiv.textContent = value;
                    }
                    valueDiv.title = feedbackDef.description;
                }
            }






            // Created at
            window.conversations.utils.createReadOnlyText(secondLine, 'conversations-decision-item-created-at', Utils.formatDateTime(this.decision.created_at), 'conversations-decision-item-created-at');

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
    window.conversations.CardMemberDecisionComponent = CardMemberDecisionComponent;
})();
