(function () {
    /*
        MemberConversationStartComponent: popup content for starting a new decision
    */

    class MemberConversationStartComponent {
        constructor(container, groupName, memberId, membersMap, groupInstructions, conversation_type, popupInstance) {
            this.container = container;
            this.groupName = groupName;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupInstructions = groupInstructions;
            this.conversation_type = conversation_type;
            this.popupInstance = popupInstance;
            this.MenuListMembersComponent = null;
            this.render();
        }

        render() {
            const wrapperDiv = window.conversations.utils.createDivContainer(this.container, null, 'conversations-decision-start-wrapper');

            // Instructions chooser
            const selectOptions = Object.values(this.groupInstructions).map(entry => ({ label: entry.info.name, value: entry.info.type }));
            new window.SelectComponent(
                wrapperDiv, 
                selectOptions, 
                (selectedValue) => { 
                    this.selectedInstruction = selectedValue 
                },
                'Select an instruction...' 
            );

            // Members chooser - filter out the current member
            const membersList = Object.entries(this.membersMap).filter(([id]) => id !== this.memberId).map(([id, member]) => ({label: id, value: member}));
            this.MenuListMembersComponent = new window.ListComponent(
                wrapperDiv, 
                membersList, 
                (member) => {
                    const tempDiv = window.conversations.utils.createDivContainer(null, null, '-');
                    new window.conversations.CardMemberComponent(tempDiv, member.value);
                    return tempDiv;
                }, 
                window.ListComponent.SELECTION_MODE_MULTIPLE
            );

            // Button
            const buttonContainer = window.conversations.utils.createDivContainer(wrapperDiv, null, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, 'Cancel', () => this.popupInstance.hide());
            new window.ButtonComponent(buttonContainer, 'Start', () => this.handleStartClick());
        }

        async handleStartClick() {
            // Validate inputs
            if (!this.selectedInstruction) {
                new window.AlertComponent('Missing Instruction', 'Please select an instruction type.');
                return;
            }
            // Get selected members from the members list component and include the current member
            const selectedMembers = this.MenuListMembersComponent.getSelectedItems();
            if (selectedMembers.length === 0) {
                new window.AlertComponent('Missing Members', 'Please select at least one member to participate in the decision.');
                return;
            }
            const participant_members_nick_names = selectedMembers.map(m => m.value.name);
            participant_members_nick_names.push(this.membersMap[this.memberId].name);

            // Start the decision
            window.conversations.api.conversationStart(null, this.groupName, this.conversation_type, this.selectedInstruction, participant_members_nick_names);
            
            // Close popup
            this.popupInstance.hide();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationStartComponent = MemberConversationStartComponent;
})();
