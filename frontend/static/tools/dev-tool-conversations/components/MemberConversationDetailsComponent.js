(function () {
    /*
        MemberConversationDetailsComponent: displays details for a decision in dev-tool-conversations
        Usage: new window.conversations.MemberConversationDetailsComponent(container, decision, groupInstructions)
    */
    class MemberConversationDetailsComponent {
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
            const firstLine = window.conversations.utils.createDivContainer(this.container, 'conversations-container-horizontal-space-between', 'conversations-container-horizontal-space-between');

            // Current member name
            const memberNameDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createLabel(memberNameDiv, 'Member');
            window.conversations.utils.createReadOnlyText(memberNameDiv, null, this.membersMap[this.memberId].name, 'conversations-field-value');

            // Member names
            const otherNameDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createLabel(otherNameDiv, 'Participants');
            window.conversations.utils.createReadOnlyText(otherNameDiv, null, this.decision.members.map(m => m.member_nick_name).filter(name => name !== this.membersMap[this.memberId].name).join(', '), 'conversations-field-value');

            // Decision type and date/time
            const typeDateDiv = window.conversations.utils.createDivContainer(firstLine);
            window.conversations.utils.createReadOnlyText(typeDateDiv, null, Utils.formatDateTime(this.decision.created_at), 'conversations-instructions-item-created-at');
            const typeDiv = window.conversations.utils.createReadOnlyText(typeDateDiv, 'conversations-badge-generic', this.groupInstructions[this.decision.context.type]?.info?.name, 'conversations-badge-generic');
            typeDiv.title = this.groupInstructions[this.decision.context.type]?.info?.description;

            // if (this.decision.last_feedback) {
            //     this.decision.feedback = this.decision.last_feedback;
            // }
            // Feedback fields
            if (this.decision.feedback && typeof this.decision.feedback === 'object') {
                const feedbackContainer = window.conversations.utils.createDivContainer(this.container, null, 'conversation-container-horizontal');
                
                for (const [key, value] of Object.entries(this.decision.feedback)) {
                    const fieldDiv = window.conversations.utils.createDivContainer(feedbackContainer, null, '.conversation-container-vertical');

                    // Feedback entry key
                    window.conversations.utils.createLabel(fieldDiv, key);
                    
                    // Feedback entry value using the feedback definition   
                    const valueDiv = window.conversations.utils.createDivContainer(fieldDiv, null, 'conversations-field-value');
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
            window.conversations.utils.createReadOnlyText(this.container, null, this.decision.response,'conversations-instructions-item-response-container');
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationDetailsComponent = MemberConversationDetailsComponent;
})();
