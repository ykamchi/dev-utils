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
            this.page = null;
            this.render();
        }

        render() {

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, 
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type], 
                'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversation_type],
                [ this.groupName ]
            );

            // Save, Add and Delete instructions button
            const pageButtons = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(pageButtons, 'Cancel', () => this.popupInstance.hide(), window.ButtonComponent.TYPE_GHOST_DANGER, 'Cancel');
            new window.ButtonComponent(pageButtons, 'Start', () => this.handleStartClick(), window.ButtonComponent.TYPE_GHOST, 'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversation_type]);
            this.page.updateButtonsArea(pageButtons);

            // Load and display the content
            this.loadContent();



        }

        loadContent() {

            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            const selectInstructionWrapper = window.conversations.utils.createDivContainer(controlDiv);
            window.conversations.utils.createLabel(selectInstructionWrapper, 'Select Instruction:');
                
            // Instructions chooser
            const selectOptions = Object.values(this.groupInstructions).map(entry => ({ label: entry.info.name, value: entry.info.type }));
            new window.SelectComponent(
                selectInstructionWrapper, 
                selectOptions, 
                (selectedValue) => { 
                    this.selectedInstruction = selectedValue 
                },
                'Select an instruction...' 
            );
            this.page.updateControlArea(controlDiv);
            
            // Members chooser - filter out the current member
            const contentDiv = window.conversations.utils.createDivContainer();
            const membersList = Object.entries(this.membersMap).filter(([id]) => id !== this.memberId).map(([id, member]) => ({label: id, value: member}));
            this.MenuListMembersComponent = new window.ListComponent(
                contentDiv, 
                membersList, 
                (member) => {
                    const tempDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberComponent(tempDiv, member.value);
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
            // this.popupInstance.hide();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationStartComponent = MemberConversationStartComponent;
})();
