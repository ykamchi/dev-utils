(function () {
    /*
        MemberConversationStartComponent: popup content for starting a new decision
    */

    class MemberConversationStartComponent {
        constructor(container, groupId, member, groupInstructions, conversation_type, popupInstance) {
            this.container = container;
            this.groupId = groupId;
            this.member = member;
            this.groupInstructions = groupInstructions;
            this.conversationType = conversation_type;
            this.popupInstance = popupInstance;
            this.MenuListMembersComponent = null;
            this.selectedInstructionsKey = null;
            this.page = null;
            this.render();
        }

        render() {

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, 
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversationType], 
                'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversationType],
                [ this.groupName ]
            );

            // Save, Add and Delete instructions button
            const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(pageButtons, 'Cancel', () => this.popupInstance.hide(), window.ButtonComponent.TYPE_GHOST_DANGER, 'Cancel');
            new window.ButtonComponent(pageButtons, 'Start', () => this.handleStartClick(), window.ButtonComponent.TYPE_GHOST, 'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversationType]);
            this.page.updateButtonsArea(pageButtons);

            // Load and display the content
            this.loadContent();

        }

        async loadContent() {

            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            const selectInstructionWrapper = window.conversations.utils.createDivContainer(controlDiv);
            window.conversations.utils.createLabel(selectInstructionWrapper, 'Select Instruction:');
            
            if (Object.entries(this.groupInstructions).length > 0) {
                this.selectedInstructionsKey = Object.values(this.groupInstructions)[0].instructions_key;
                // Instructions chooser
                const selectOptions = Object.values(this.groupInstructions).map(entry => ({ label: entry.info.name, value: entry.instructions_key }));
                new window.SelectComponent(
                    selectInstructionWrapper, 
                    selectOptions, 
                    (selectedValue) => { 
                        this.selectedInstructionsKey = selectedValue 
                    },
                    'Select an instruction...',
                    this.selectedInstructionsKey
                );
                this.page.updateControlArea(controlDiv);
            } else {
                this.page.updateControlArea(null);
                const missingInstructionsDiv = window.conversations.utils.createReadOnlyText(controlDiv, 'No instructions available for this conversation type.', 'conversations-message-empty');
                this.page.updateContentArea(missingInstructionsDiv);
                // new window.AlertComponent('No Instructions Available', 'There are no instructions available to start a conversation.');
                return;
            }

            // Members chooser - filter out the current member
            const contentDiv = window.conversations.utils.createDivContainer();
            const members = await window.conversations.apiMembers.membersList(this.membersListItems, this.groupId);
            // const members = window.conversations.apiMembers.membersList(null, this.groupId);
            // const membersList = Object.entries(this.membersMap).filter(([id]) => id !== this.memberId).map(([id, member]) => ({label: id, value: member}));
            this.MenuListMembersComponent = new window.ListComponent(
                contentDiv, 
                members, 
                (member) => {
                    const tempDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberComponent(tempDiv, member);
                    return tempDiv;
                }, 
                window.ListComponent.SELECTION_MODE_MULTIPLE,
                null,
                (item, query) => {
                    return item.value.name.toLowerCase().includes(query.toLowerCase());
                }
            );
            this.page.updateContentArea(contentDiv);
        }

        async handleStartClick() {
            // Validate inputs
            if (!this.selectedInstructionsKey) {
                new window.AlertComponent('Missing Instruction', 'Please select an instruction type.');
                return;
            }
            // Get selected members from the members list component and include the current member
            const selectedMembers = this.MenuListMembersComponent.getSelectedItems();
            if (selectedMembers.length === 0) {
                new window.AlertComponent('Missing Members', 'Please select at least one member to participate in the decision.');
                return;
            }
            const participant_members_nick_names = selectedMembers.map(m => m.name);
            if (this.member) {
                participant_members_nick_names.push(this.member.name);
            }

            // Start the conversation
            window.conversations.apiConversations.conversationAdd(null, this.groupId, this.conversationType, this.selectedInstructionsKey, participant_members_nick_names, participant_members_nick_names.length * 5);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationStartComponent = MemberConversationStartComponent;
})();
