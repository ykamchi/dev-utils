(function () {
    /*
        MemberDecisionCardComponent: renders a single decision card for dev-tool-conversations
    */
    class MemberDecisionCardComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} decision - The decision object
         * @param {Object} instructionInfo - The instruction info map
         */
        constructor(container, decision, instructionInfo) {
            this.container = container;
            this.decision = decision;
            this.instructionInfo = instructionInfo;
            this.render();
        }

        render() {
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-decision-item-wrapper';

            // First line
            const firstLine = document.createElement('div');
            firstLine.className = 'conversations-decision-item-header';
            firstLine.style.display = 'flex';
            firstLine.style.justifyContent = 'space-between';
            firstLine.style.alignItems = 'center';

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

            wrapper.appendChild(firstLine);

            // Second line
            const createdAtDiv = document.createElement('div');
            createdAtDiv.className = 'conversations-decision-item-created-at';
            createdAtDiv.textContent = Utils.formatDateTime(this.decision.created_at);
            wrapper.appendChild(createdAtDiv);

            // Add click handler to show decision details popup
            wrapper.addEventListener('click', this.showDecisionDetails.bind(this));

            this.container.appendChild(wrapper);
        }

        async showDecisionDetails() {
            new window.PopupComponent({
                title: 'Decision Details',
                content: (container) => {
                    new window.conversations.DecisionDetailsComponent(container, this.decision, this.instructionInfo);
                },
                closable: true,
                width: '600px',
                height: '400px'
            }).show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDecisionCardComponent = MemberDecisionCardComponent;
})();
