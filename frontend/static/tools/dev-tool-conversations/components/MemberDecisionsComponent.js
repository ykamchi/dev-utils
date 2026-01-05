(function () {
    /*
        MemberDecisionsComponent: displays decisions for a member in dev-tool-conversations
    */
    class MemberDecisionsComponent {
        constructor(container, groupName, memberId, membersMap) {
            console.log('1Selected member ID:', memberId, " members:", this.members);

            this.container = container;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupName = groupName;
            this.member = membersMap[memberId];
            this.decisions = [];
            this.instructionInfo = {};
            this.render();
        }

        async render() {
            // Show loading spinner
            new window.SpinnerComponent(this.container, { text: 'Loading decisions...' });
            
            // Fetch instruction info
            this.instructionInfo = await this.getInstructionInfo();

            // Fetch decisions for the member
            this.decisions = await this.getMemberDecisions();

            // Clear container from spinner and render list
            this.container.innerHTML = '';
            new window.ListComponent(this.container, this.decisions, (decision) => {
                const decisionDiv = document.createElement('div');
                new window.conversations.MemberDecisionCardComponent(decisionDiv, decision, this.instructionInfo);
                return decisionDiv;
            });

            // Add buttons container under the list
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'conversations-buttons-container';
            this.container.appendChild(buttonContainer);

            // 'Start new decision' button
            new window.ButtonComponent(buttonContainer, 'Start new decision', this.startNewDecisionPopup.bind(this));
        }
        
        async getMemberDecisions() {
            const res = await fetch('/api/dev-tool-conversations/member_decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },    
                body: JSON.stringify({ member_id: this.memberId })
            });
            return await res.json();
        }

        async getInstructionInfo() {
            const res = await fetch('/api/dev-tool-conversations/group_instruction_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_name: this.groupName,
                    conversation_type: 'ai_decision'
                })
            });
            const data = await res.json();
            const instructionInfo = {}
            for (const entry in data) {
                instructionInfo[data[entry].type] = data[entry];
            }
            return instructionInfo;
        }

        startNewDecisionPopup() {
            let popup = new window.PopupComponent({
                title: 'Start New Decision',
                content: (container) => {
                    new window.conversations.DecisionStartComponent(container, this.groupName, this.memberId, this.membersMap, this.instructionInfo, popup);
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
