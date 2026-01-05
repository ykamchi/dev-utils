(function () {
    /*
        DecisionDetailsComponent: displays details for a decision in dev-tool-conversations
        Usage: new window.conversations.DecisionDetailsComponent(container, decision, instructionInfo)
    */
    class DecisionDetailsComponent {
        constructor(container, decision, instructionInfo) {
            this.container = container;
            this.decision = decision;
            this.instructionInfo = instructionInfo;
            this.render();
        }

        render() {
            // Clear container
            this.container.innerHTML = '';

            // First line
            const firstLine = document.createElement('div');
            firstLine.className = 'conversations-decision-item-header';

            // Member names
            const namesDiv = document.createElement('div');
            namesDiv.className = 'conversations-decision-item-members-names';
            namesDiv.textContent = this.decision.members.map(m => m.member_nick_name).filter(Boolean).join(', ');

            // Decision type
            const typeDiv = document.createElement('div');
            typeDiv.className = 'conversations-decision-item-decision-type';
            typeDiv.textContent = this.instructionInfo[this.decision.context.type].name;
            typeDiv.title = this.instructionInfo[this.decision.context.type].description;

            firstLine.appendChild(namesDiv);
            firstLine.appendChild(typeDiv);

            this.container.appendChild(firstLine);

            // Second line
            const createdAtDiv = document.createElement('div');
            createdAtDiv.className = 'conversations-decision-item-created-at';
            createdAtDiv.textContent = Utils.formatDateTime(this.decision.created_at);
            this.container.appendChild(createdAtDiv);

            // Feedback fields
            if (this.decision.feedback && typeof this.decision.feedback === 'object') {
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'conversations-decision-item-feedback-container';

                for (const [key, value] of Object.entries(this.decision.feedback)) {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'conversations-decision-item-feedback-field';

                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'conversations-decision-item-feedback-name';
                    nameDiv.textContent = key;

                    const valueDiv = document.createElement('div');
                    valueDiv.className = 'conversations-decision-item-feedback-value';
                    valueDiv.textContent = value;

                    fieldDiv.appendChild(nameDiv);
                    fieldDiv.appendChild(valueDiv);
                    feedbackContainer.appendChild(fieldDiv);
                }
                this.container.appendChild(feedbackContainer);
            }

            // Decision response
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'conversations-decision-item-type-description';
            descriptionDiv.textContent = this.decision.response;
            this.container.appendChild(descriptionDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.DecisionDetailsComponent = DecisionDetailsComponent;
})();
