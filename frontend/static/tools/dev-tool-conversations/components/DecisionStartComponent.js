(function () {
    /*
        DecisionStartComponent: popup content for starting a new decision
    */

    class DecisionStartComponent {
        constructor(container, groupName, memberId, membersMap, groupInstructions, popupInstance) {
            this.container = container;
            this.groupName = groupName;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupInstructions = groupInstructions;
            this.popupInstance = popupInstance;
            this.membersListComponent = null;
            this.render();
        }

        render() {
            // Clear container
            this.container.innerHTML = '';

            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'conversations-decision-start-wrapper';

            // Instructions chooser
            console.log('array:', Object.values(this.groupInstructions))
            const selectOptions = Object.values(this.groupInstructions).map(entry => ({ label: entry.info.name, value: entry.info.type }));
            new window.SelectComponent(wrapperDiv, selectOptions, this.handleSelectionChange.bind(this),'Select an instruction...' );

            // Members chooser - filter out the current member
            const membersList = Object.entries(this.membersMap).filter(([id]) => id !== this.memberId).map(([id, member]) => ({label: id, value: member}));
            this.membersListComponent = new window.ListComponent(wrapperDiv, membersList, this.renderMemberItem.bind(this), window.ListComponent.SELECTION_MODE_MULTIPLE);

            // Button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'conversations-buttons-container';

            // Cancel button (framework)
            new window.ButtonComponent(buttonContainer, 'Cancel', this.handleCancelClick.bind(this));

            // Start button (framework)
            new window.ButtonComponent(buttonContainer, 'Start', this.handleStartClick.bind(this));

            wrapperDiv.appendChild(buttonContainer);
            this.container.appendChild(wrapperDiv);
        }

        renderMemberItem(member) {
            const tempDiv = document.createElement('div');
            new window.conversations.MemberCardComponent(tempDiv, member.value);
            return tempDiv;

        }

        handleSelectionChange(selectedValue) {
            this.selectedInstruction = selectedValue;
        }

        handleCancelClick() {
            if (this.popupInstance && typeof this.popupInstance.hide === 'function') {
                this.popupInstance.hide();
            }
        }

        async handleStartClick() {
            if (!this.selectedInstruction) {
                new window.AlertComponent('Missing Instruction', 'Please select an instruction type.');
                return;
            }
            // Get selected members from the members list component and include the current member
            const selectedMembers = this.membersListComponent.getSelectedItems();
            if (selectedMembers.length === 0) {
                new window.AlertComponent('Missing Members', 'Please select at least one member to participate in the decision.');
                return;
            }
            const participant_members_nick_names = selectedMembers.map(m => m.value.name);
            participant_members_nick_names.push(this.membersMap[this.memberId].name);

            // Start the decision
            await window.conversations.api.decisionStart(this.groupName, this.selectedInstruction, participant_members_nick_names);
            
            // Close popup
            this.popupInstance.hide();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.DecisionStartComponent = DecisionStartComponent;
})();
