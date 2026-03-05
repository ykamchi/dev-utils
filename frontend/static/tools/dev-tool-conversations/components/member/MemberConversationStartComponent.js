(function () {
    /*
        MemberConversationStartComponent: popup content for starting a new decision
    */

    class MemberConversationStartComponent {
        constructor(container, group, member, conversation_type, popupInstance) {
            this.container = container;
            this.group = group;
            this.member = member;
            this.groupInstructions = null;
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
            this.memberSelectedRole = null; // Store the role selected for this.member
            this.memberRoleSelectComponent = null; // Store reference to role select component

            this.render();
        }

        render() {
            this.load();
        }

        async load() {
            this.groupInstructions = await window.conversations.apiInstructions.instructionsList(this.container, this.group.group_id, this.conversation_type);

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container,
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversationType],
                'Start ' + window.conversations.CONVERSATION_TYPES_NAMES[this.conversationType] + (this.member ? ' - ' + this.member.member_name : ''),
                [this.group.group_name]
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

            // Filter instructions based on member roles if member is provided
            let availableInstructions = Object.values(this.groupInstructions);
            if (this.member && this.member.member_roles) {
                availableInstructions = availableInstructions.filter(instruction => {
                    if (!instruction.info.roles || instruction.info.roles.length === 0) {
                        return false;
                    }
                    // Check if any instruction role matches any member role
                    return instruction.info.roles.some(role =>
                        this.member.member_roles.includes(role.role_name)
                    );
                });
            }

            // If no instructions available after filtering, show message
            if (availableInstructions.length === 0) {
                this.page.updateControlArea(null);
                const missingInstructionsDiv = window.conversations.utils.createReadOnlyText(
                    pageControlDiv,
                    this.member
                        ? `No instructions available for ${this.member.member_name}.`
                        : 'No instructions available for this conversation type.',
                    'conversations-message-empty'
                );
                this.page.updateContentArea(missingInstructionsDiv);
                return;
            }

            // Try to load previously selected instruction from storage, if exists
            const selectedInstructionKey = window.StorageService.getStorageJSON(this.storageKeyLastSelectedInstructionKey);
            if (selectedInstructionKey) {
                this.selectedInstruction = availableInstructions.find(entry => entry.info.instruction_key === selectedInstructionKey);
            }

            // Don't auto-select - let user choose
            // Only pre-select if we found a previously selected instruction from storage
            // Instructions chooser
            new window.SelectComponent(
                selectInstructionWrapper,
                availableInstructions.map(entry => ({ label: entry.info.name, value: entry.instruction_key })),
                (selectedValue) => {
                    this.selectedInstruction = availableInstructions.find(entry => entry.instruction_key === selectedValue);

                    // Reload content with new instruction's roles
                    this.loadContentTabs();

                    // Save selected instruction to storage
                    window.StorageService.setStorageJSON(this.storageKeyLastSelectedInstructionKey, this.selectedInstruction.instruction_key);
                },
                'Select an instruction...',
                this.selectedInstruction ? this.selectedInstruction.info.instruction_key : null
            );

            this.page.updateControlArea(pageControlDiv);

            // Only load content tabs if we have a selected instruction
            if (this.selectedInstruction) {
                this.loadContentTabs();
            } else {
                // Show empty state
                const contentDiv = window.conversations.utils.createDivContainer(null, '-', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' });
                new window.conversations.ConvyComponent(contentDiv, { reaction: 'conversation-table-drinking', width: 480, height: 480 });
                window.conversations.utils.createReadOnlyText(contentDiv, 'Please select an instruction to start.', 'conversations-message-empty');
                this.page.updateContentArea(contentDiv);
            }
        }

        async loadContentTabs() {
            // Load members list
            this.members = await window.conversations.apiMembers.membersList(null, this.group.group_id);

            // Reset selected members when instruction changes
            this.selectedMembers = {};
            this.memberSelectedRole = null;

            const contentDiv = window.conversations.utils.createDivContainer();

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

            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversations-page-wrapper');
            const splitter = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-horizontal-space-between-full');
            const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5', padding: '8px' });
            const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });

            // If member is provided, add role selector field
            if (this.member && this.member.member_roles) {
                // Get allowed roles for this member in this instruction
                const allowedRoles = this.selectedInstruction.info.roles.filter(role =>
                    this.member.member_roles.includes(role.role_name)
                );

                if (allowedRoles.length > 0) {
                    // Create field for member role selection
                    const memberRoleFieldDiv = window.conversations.utils.createDivContainer(leftDiv, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(memberRoleFieldDiv, `Select role for ${this.member.member_name}:`);

                    // Auto-select first allowed role
                    this.memberSelectedRole = allowedRoles[0].role_name;

                    // Add member to selected members with their role
                    this.selectedMembers[this.memberSelectedRole] = [this.member];

                    // Create select component for role selection
                    this.memberRoleSelectComponent = new window.SelectComponent(
                        memberRoleFieldDiv,
                        allowedRoles.map(role => ({ label: role.role_name, value: role.role_name })),
                        (selectedRole) => {
                            // Remove member from old role
                            if (this.memberSelectedRole && this.selectedMembers[this.memberSelectedRole]) {
                                this.selectedMembers[this.memberSelectedRole] = this.selectedMembers[this.memberSelectedRole].filter(
                                    m => m.member_name !== this.member.member_name
                                );
                                if (this.selectedMembers[this.memberSelectedRole].length === 0) {
                                    delete this.selectedMembers[this.memberSelectedRole];
                                }
                            }

                            // Add member to new role
                            this.memberSelectedRole = selectedRole;
                            if (!this.selectedMembers[this.memberSelectedRole]) {
                                this.selectedMembers[this.memberSelectedRole] = [];
                            }
                            this.selectedMembers[this.memberSelectedRole].push(this.member);

                            // Revalidate
                            this.validateSelections();
                        },
                        'Select role...',
                        this.memberSelectedRole
                    );
                }
            }

            const convyDiv = window.conversations.utils.createDivContainer(leftDiv, '-', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' });
            const conversationConditions = this.selectedInstruction.info.roles.map(role => {
                let ret = '';
                if (role.min === role.max) {
                    ret = `exactly ${role.min} ${role.role_name}`;
                } else {
                    ret = `at least ${role.min} ${role.role_name} (up to ${role.max})`;
                }
                if (this.member) {
                    ret += `, you have already selected ${this.member.member_name} for the role of ${this.memberSelectedRole}`;
                }
                return ret;
            }).join(', ');
            window.conversations.utils.createReadOnlyText(convyDiv, 'To run this conversation you must select ' + conversationConditions, 'conversations-message-empty');
            new window.conversations.ConvyComponent(convyDiv, { reaction: 'conversation-table-drinking', width: 480, height: 480 });
            this.validationLabelDiv = window.conversations.utils.createDivContainer(convyDiv, '-');

            // Create validation label above tabs
            this.validationLabel = window.conversations.utils.createReadOnlyText(this.validationLabelDiv, '');


            // Build tabs - one per role
            const tabs = [];
            this.selectedInstruction.info.roles.forEach(role => {
                console.log('Creating tab for role', role);
                tabs.push({
                    name: role.role_name,
                    populateFunc: (container) => this.populateRoleTab(container, role)
                });
            });

            new window.TabsetComponent(rightDiv, tabs);

            // Add OpenAI checkbox at the bottom
            const openaiCheckboxDiv = window.conversations.utils.createDivContainer(contentDiv, 'conversation-field-container-vertical');
            this.useOpenAICheckbox = new window.CheckboxComponent(
                openaiCheckboxDiv,
                false,  // checked
                null,   // onChange
                'Use OpenAI'  // labelText
            );

            this.page.updateContentArea(contentDiv);

            // Initial validation
            this.validateSelections();
        }

        async populateRoleTab(container, role) {
            // Filter members for this role
            let filteredMembers = this.members.filter(member => {
                // Filter out this.member if it's provided
                if (this.member && member.member_name === this.member.member_name) {
                    return false;
                }
                // Only show members that have this role in their member_roles array
                return member.member_roles && member.member_roles.includes(role.role_name);
            });

            // Create members list component for this role
            new window.ListComponent(
                container,
                filteredMembers,
                (member) => {
                    const tempDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberComponent(tempDiv, member);
                    return tempDiv;
                },
                window.ListComponent.SELECTION_MODE_MULTIPLE,
                (selectedItems) => {
                    // Start with selected items from the list
                    let membersForRole = [...selectedItems];

                    // If this.member is assigned to this role, add them to the array
                    if (this.member && this.memberSelectedRole === role.role_name) {
                        membersForRole.push(this.member);
                    }

                    this.selectedMembers[role.role_name] = membersForRole;
                    this.validateSelections();
                },
                (item, query) => {
                    return item.member_name.toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Name', func: (a, b) => { return a.member_name < b.member_name ? -1 : 1; }, direction: 1 },
                    { label: 'Location', func: (a, b) => a.member_profile.location < b.member_profile.location ? -1 : 1, direction: 1 },
                    { label: 'Age', func: (a, b) => a.member_profile.age < b.member_profile.age ? -1 : 1, direction: 1 },
                ]
            );
        }

        validateSelections() {
            const validationResults = [];
            let allValid = true;

            for (const role of this.selectedInstruction.info.roles) {
                const roleName = role.role_name || role;
                const min = role.min || 0;
                const max = role.max || Infinity;

                // Count selected members for this role (including this.member if they selected this role)
                let selectedCount = 0;
                if (this.selectedMembers[roleName]) {
                    selectedCount = this.selectedMembers[roleName].length;
                }

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
                window.conversations.utils.createReadOnlyText(this.validationLabelDiv, messages.join(' | '));
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

            // Prepare optional LLM parameters
            const llmParams = {};
            if (this.useOpenAICheckbox && this.useOpenAICheckbox.isChecked()) {
                llmParams.llm_provider = 'openai';
                llmParams.llm_model = 'gpt-5.2';
            }

            // Start the conversation with new structure
            await window.conversations.apiConversations.conversationAdd(
                null,
                this.group.group_id,
                this.selectedInstruction.info,
                participants,
                llmParams.llm_provider,
                llmParams.llm_model
            );

            // Close popup on success
            this.popupInstance.hide();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationStartComponent = MemberConversationStartComponent;
})();
