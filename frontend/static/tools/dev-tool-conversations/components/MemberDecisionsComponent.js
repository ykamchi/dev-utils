(function () {
    /*
        MemberDecisionsComponent: displays decisions for a member in dev-tool-conversations
    */
    class MemberDecisionsComponent {
        constructor(container, groupName, memberId, membersMap) {
            this.container = container;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupName = groupName;
            this.member = membersMap[memberId];
            this.decisions = [];
            this.groupInstructions = {};
            this.render();
        }

        async render() {
            // Show loading spinner
            new window.SpinnerComponent(this.container, { text: 'Loading decisions...' });
            
            // Fetch decisions for the member
            this.decisions = await window.conversations.api.fetchMemberDecisions(this.memberId);

            const groupInstructions = await window.conversations.api.fetchGroupInstructions(this.groupName, 'ai_decision');
            this.groupInstructions = {}
            for (const entry in groupInstructions) {
                this.groupInstructions[groupInstructions[entry].info.type] = groupInstructions[entry];
            }

            // Clear container from spinner and render list
            this.container.innerHTML = '';
            new window.ListComponent(this.container, this.decisions, (decision) => {
                const decisionDiv = document.createElement('div');
                new window.conversations.MemberDecisionCardComponent(decisionDiv, decision, this.memberId, this.membersMap, this.groupInstructions);
                return decisionDiv;
            });

            // Add buttons container under the list
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'conversations-buttons-container';
            this.container.appendChild(buttonContainer);

            // 'Start new decision' button
            new window.ButtonComponent(buttonContainer, 'Start new decision', this.startNewDecisionPopup.bind(this));
        }

        startNewDecisionPopup() {
            let popup = new window.PopupComponent({
                title: 'Start New Decision',
                content: (container) => {
                    new window.conversations.DecisionStartComponent(container, this.groupName, this.memberId, this.membersMap, this.groupInstructions, popup);
                },
                closable: true,
                width: '660px',
                height: '600px'
            });
            popup.show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDecisionsComponent = MemberDecisionsComponent;
})();
