(function () {
    /*
        DecisionDetailsComponent: displays details for a decision in dev-tool-conversations
        Usage: new window.conversations.DecisionDetailsComponent(container, decision, groupInstructions)
    */
    class DecisionDetailsComponent {
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
            // Clear container
            this.container.innerHTML = '';

            // First line
            const firstLine = window.conversations.utils.createDivContainer(this.container, 'conversations-decision-item-header', 'conversations-decision-item-header');

            // Current member name
            const memberNameDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createLabel(memberNameDiv, 'Member');
            window.conversations.utils.createReadOnlyText(memberNameDiv, 'conversations-decision-item-members-names', this.membersMap[this.memberId].name, 'conversations-decision-item-members-names');

            // Member names
            const otherNameDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createLabel(otherNameDiv, 'Participants');
            window.conversations.utils.createReadOnlyText(otherNameDiv, 'conversations-decision-item-members-names', this.decision.members.map(m => m.member_nick_name).filter(name => name !== this.membersMap[this.memberId].name).join(', '), 'conversations-decision-item-members-names');

            // Decision type and date/time
            const typeDateDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createReadOnlyText(typeDateDiv, 'conversations-decision-item-created-at', Utils.formatDateTime(this.decision.created_at), 'conversations-decision-item-created-at');
            const typeDiv = window.conversations.utils.createReadOnlyText(typeDateDiv, 'conversations-decision-item-decision-type', this.groupInstructions[this.decision.context.type]?.info?.name, 'conversations-decision-item-decision-type');
            typeDiv.title = this.groupInstructions[this.decision.context.type]?.info?.description;

            // Feedback fields
            if (this.decision.feedback && typeof this.decision.feedback === 'object') {
                const feedbackContainer = window.conversations.utils.createDivContainer(this.container, null, 'conversations-decision-item-feedback-container');
                
                for (const [key, value] of Object.entries(this.decision.feedback)) {
                    const fieldDiv = window.conversations.utils.createDivContainer(feedbackContainer, null, 'conversations-decision-item-feedback-field');

                    // Feedback entry key
                    window.conversations.utils.createReadOnlyText(fieldDiv, null, key, 'conversations-decision-item-feedback-name');
                    
                    // Feedback entry value using the feedback definition   
                    const valueDiv = window.conversations.utils.createDivContainer(fieldDiv, null, 'conversations-decision-item-feedback-value');
                    const feedbackDef = this.feedbackDefMap[key];
                    if (feedbackDef.type === 'integer') {
                        new window.RateComponent(valueDiv, feedbackDef.min, feedbackDef.max, value, '100px', '16px', true);
                    } else if (feedbackDef.type === 'string') {
                        valueDiv.textContent = value;
                    } else {
                        valueDiv.textContent = value;
                    }
                    valueDiv.title = feedbackDef.description;
                }
            }

            // Decision response
            window.conversations.utils.createReadOnlyText(this.container, null, this.decision.response,'conversations-decision-item-response-container');
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.DecisionDetailsComponent = DecisionDetailsComponent;
})();
