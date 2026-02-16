(function () {
    /*
        MemberConversationStartComponent: popup content for starting a new decision
    */

    class MemberConversationStartComponent {
        constructor(container, group, member, groupInstructions, conversation_type, popupInstance) {
            this.container = container;
            this.group = group;
            this.member = member;
            this.groupInstructions = groupInstructions;
            this.conversationType = conversation_type;
            this.popupInstance = popupInstance;
            this.memberListComponents = {}; // Store list components per role

            this.selectedInstruction = null;
            this.page = null;
            this.startButton = null; // Store reference to start button
            this.validationLabelDiv = null; // Store reference to validation label
            this.selectedMembers = {};
            this.members = []; // Store members list
            this.storageKeyLastSelectedInstructionKey = `conversations-start-selected-instruction-key-${group.group_id}`;

            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, 
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversationType], 
                'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversationType],
                [ this.member.member_name, this.group.group_name ]
            );

            // Start and Cancel buttons
            const pageButtonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            new window.ButtonComponent(pageButtonsDiv, {
                label: 'Cancel',
                onClick: () => this.popupInstance.hide(),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: 'Cancel'
            });
            this.startButton = new window.ButtonComponent(pageButtonsDiv, {
                label: 'Start',
                onClick: () => this.handleStartClick(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: 'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversationType],
                disabled: true 
            });
            this.page.updateButtonsArea(pageButtonsDiv);

            const pageControlDiv = window.conversations.utils.createDivContainer(null, '-');

            // If group instructions are not available, show message and return
            if (Object.entries(this.groupInstructions).length === 0) {
                this.page.updateControlArea(null);
                const missingInstructionsDiv = window.conversations.utils.createReadOnlyText(pageControlDiv, 'No instructions available for this conversation type.', 'conversations-message-empty');
                this.page.updateContentArea(missingInstructionsDiv);
                return;
            
            }

            const selectInstructionWrapper = window.conversations.utils.createDivContainer(pageControlDiv);

            // Try to load previously selected instruction from storage, if exists
            const selectedInstructionKey = window.StorageService.getStorageJSON(this.storageKeyLastSelectedInstructionKey);
            if (selectedInstructionKey) {
                this.selectedInstruction = this.groupInstructions.find(entry => entry.info.instruction_key === selectedInstructionKey);
            }

            // If no previously selected instruction or it cannot be found, default to the first instruction in the list
            if (!this.selectedInstruction) {
                this.selectedInstruction = Object.values(this.groupInstructions)[0];
            }

            // Instructions chooser
            new window.SelectComponent(
                selectInstructionWrapper, 
                Object.values(this.groupInstructions).map(entry => ({ label: entry.info.name, value: entry.info.instruction_key })), 
                (selectedValue) => { 
                    this.selectedInstruction = this.groupInstructions.find(entry => entry.info.instruction_key === selectedValue);
                    
                    // Reload content with new instruction's roles
                    this.loadContentTabs();
                    
                    // Save selected instruction to storage
                    window.StorageService.setStorageJSON(this.storageKeyLastSelectedInstructionKey, this.selectedInstruction.info.instruction_key);
                },
                'Select an instruction...',
                this.selectedInstruction.info.instruction_key
            );

            this.page.updateControlArea(pageControlDiv);
            
            // Load the content tabs
            this.loadContentTabs();
        }

        async loadContentTabs() {
            // Load members list
            this.members = await window.conversations.apiMembers.membersList(null, this.group.group_id);

            // Reset selected members when instruction changes
            this.selectedMembers = {}; 

            const contentDiv = window.conversations.utils.createDivContainer();
            
            this.validationLabelDiv = window.conversations.utils.createDivContainer(contentDiv, '-');

            if (!this.selectedInstruction) {
                window.conversations.utils.createReadOnlyText(contentDiv, 'No instruction selected.', 'conversations-message-empty');
                this.page.updateContentArea(contentDiv);
                return;
            }

            // If roles are not defined or empty, show message and return
            if (!this.selectedInstruction.info.roles || Object.keys(this.selectedInstruction.info.roles).length === 0) {
                window.conversations.utils.createReadOnlyText(contentDiv, 'No roles defined for this instruction.', 'conversations-message-empty');
                this.page.updateContentArea(contentDiv);
                return;
            }

            // Create validation label above tabs
            this.validationLabel = window.conversations.utils.createLabel(contentDiv, '');
            
            // Build tabs - one per role
            const tabs = [];
            Object.entries(this.selectedInstruction.info.roles).forEach(([role, roleDef]) => {
                console.log('Creating tab for role', role, roleDef);
                tabs.push({
                    name: roleDef.role_name,
                    populateFunc: (container) => this.populateRoleTab(container, role, roleDef)
                });
            });

            new window.TabsetComponent(contentDiv, tabs);
            
            this.page.updateContentArea(contentDiv);
            
            // Initial validation
            this.validateSelections();
        }

        async populateRoleTab(container, role, roleDef) {
            
            // Create members list component for this role
            new window.ListComponent(
                container, 
                this.members, 
                (member) => {
                    const tempDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberComponent(tempDiv, member);
                    return tempDiv;
                }, 
                window.ListComponent.SELECTION_MODE_MULTIPLE,
                (selectedItems) => {
                    this.selectedMembers[role] = selectedItems;
                    this.validateSelections();
                },
                (item, query) => {
                    return item.value.name.toLowerCase().includes(query.toLowerCase());
                }
            );
        }

        validateSelections() {
            const validationResults = [];
            let allValid = true;
            
            for (const role in this.selectedInstruction.info.roles) {
                const roleDef = this.selectedInstruction.info.roles[role];
                const roleName = roleDef.role_name || role;
                const min = roleDef.min || 0;
                const max = roleDef.max || Infinity;
                
                const selectedCount = this.selectedMembers[role] ? this.selectedMembers[role].length : 0;
                
                const isValid = selectedCount >= min && selectedCount <= max;
                if (!isValid) {
                    allValid = false;
                }
                
                let constraintText = '';
                if (min === max) {
                    constraintText = `exactly ${min}`;
                } else if (max === Infinity || max === 999 || max === 1000) {
                    constraintText = `at least ${min}`;
                } else if (min === 0) {
                    constraintText = `up to ${max}`;
                } else {
                    constraintText = `${min}-${max}`;
                }
                
                validationResults.push({
                    roleName,
                    selectedCount,
                    min,
                    max,
                    isValid,
                    constraintText
                });
            }
            
            // Update validation label
            if (this.validationLabel) {
                const messages = validationResults.map(r => {
                    const emoji = r.isValid ? '✔️' : '❌';
                    return `${emoji} ${r.roleName}: ${r.selectedCount} selected (need ${r.constraintText})`;
                });
                this.validationLabelDiv.innerHTML = ''; // Clear previous content
                window.conversations.utils.createLabel(this.validationLabelDiv, messages.join(' | '));
            }
            
            // Update start button state
            if (this.startButton) {
                this.startButton.setDisabled(!allValid);
            }
        }

        async handleStartClick() {
            // Validate inputs
            if (!this.selectedInstruction) {
                new window.AlertComponent('Missing Instruction', 'Please select an instruction type.');
                return;
            }
            
            // Build participants array with role assignments
            const participants = [];

            Object.entries(this.selectedMembers).forEach(([role, members]) => {
                members.forEach(member => {
                    participants.push({
                        member_name: member.member_name,
                        instruction_role: role  // Use the actual role
                    });
                });
            });
            
            if (participants.length === 0) {
                new window.AlertComponent('Missing Members', 'Please select at least one member to participate in the conversation.');
                return;
            }
            
            // Start the conversation with new structure
            await window.conversations.apiConversations.conversationAdd(
                null, 
                this.group.group_id, 
                this.selectedInstruction.info, 
                participants
            );
            
            // Close popup on success
            this.popupInstance.hide();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationStartComponent = MemberConversationStartComponent;
})();
