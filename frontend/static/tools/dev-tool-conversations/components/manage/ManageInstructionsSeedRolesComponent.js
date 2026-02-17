(function () {
    /*
        ManageInstructionsSeedRolesComponent: Displays seed instructions and allows copying roles
    */
    class ManageInstructionsSeedRolesComponent {
        constructor(container, group, onRolesSelected) {
            this.container = container;
            this.group = group;
            this.onRolesSelected = onRolesSelected;

            this.allRoles = [];
            this.render();
        }
        
        render() {
            this.load();
        }

        async load() {
            // Fetch seed data
            const templateInstructionsSeed = await window.conversations.apiSeeds.seedsInstructionsGet(this.container, null);
            const groupInstructionsSeed = await window.conversations.apiSeeds.seedsInstructionsGet(this.container, this.group);

            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversation-container-vertical');

            // Flatten all roles from all instructions
            this.allRoles = [...groupInstructionsSeed, ...templateInstructionsSeed];

            if (this.allRoles.length === 0) {
                window.conversations.utils.createReadOnlyText(wrapper, 'No seed roles found.', 'conversations-message-empty');
                return;
            }

            // Add button at top
            const buttonContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '🗐 Copy selected roles',
                onClick: () => this.selectRoles(),
                type: window.ButtonComponent.TYPE_GHOST
            });

            // Create list of roles
            new window.ListComponent(wrapper, this.allRoles, (role) => {
                // Create header content
                const icon = role.s.valid ? window.conversations.CONVERSATION_TYPES_ICONS[roleEntry.instruction.conversation_type] + ' ' : '✘ ';
                const name = `${role.role_name} (${roleEntry.instruction.name})`;

                const headerContent = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

                // Icon 
                window.conversations.utils.createReadOnlyText(headerContent, icon, 'conversations-list-card-icon');

                // Info
                const info = window.conversations.utils.createDivContainer(headerContent, 'conversations-card-info');

                // Name with checkbox
                const nameWrapper = window.conversations.utils.createDivContainer(info, 'conversation-container-horizontal');
                new window.CheckboxComponent(nameWrapper, roleEntry.include, (checked) => {
                    roleEntry.include = checked;
                }, null, !roleEntry.valid);

                window.conversations.utils.createReadOnlyText(nameWrapper, name, 'conversations-card-name');

                // Description
                const description = `${roleEntry.source} • ${roleEntry.role.role_description}`;
                window.conversations.utils.createReadOnlyText(info, description, roleEntry.valid ? 'conversations-card-description' : 'conversations-error');

                // Create body content - show instruction info and role JSON
                const bodyContent = window.conversations.utils.createDivContainer();
                if (!roleEntry.valid) {
                    window.conversations.utils.createReadOnlyText(bodyContent, roleEntry.error, 'conversations-message-error');
                } else {
                    // Instruction details
                    const instructionDetails = window.conversations.utils.createDivContainer(bodyContent, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(instructionDetails, 'Instruction:');
                    window.conversations.utils.createJsonDiv(instructionDetails, {
                        name: roleEntry.instruction.name,
                        description: roleEntry.instruction.description,
                        conversation_type: roleEntry.instruction.conversation_type,
                        instruction_key: roleEntry.instruction.instruction_key
                    });

                    // Role details
                    const roleDetails = window.conversations.utils.createDivContainer(bodyContent, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(roleDetails, 'Role:');
                    window.conversations.utils.createJsonDiv(roleDetails, roleEntry.role);
                }

                // Create ExpandDivComponent
                const seedDiv = window.conversations.utils.createDivContainer();
                new window.ExpandDivComponent(seedDiv, headerContent, bodyContent);
                return seedDiv;
            });
        }

        getRules(seedData, sourceName) {
            if (!seedData || seedData.length === 0) {
                return;
            }

            seedData.info.roles.map(role => {
                const instruction = seedItem.json;
                const roles = instruction.roles || {};

                return {
                        type: 'role',
                        seed_key: seedItem.seed_key,
                        instruction: instruction,
                        role: roleCopy,
                        roleKey: roleKey,
                        source: sourceName,
                        include: false,
                        valid: seedItem.valid,
                        error: seedItem.error
                };
            });
        }

        selectRoles() {
            const selectedRoles = this.allRoles.filter(roleEntry => roleEntry.include && roleEntry.valid);
            
            if (selectedRoles.length === 0) {
                new window.AlertComponent('Copy Roles', 'No roles selected. Please select at least one role to copy.');
                return;
            }

            // Pass array of role objects to callback
            this.onRolesSelected(selectedRoles.map(entry => entry.role));
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionsSeedRolesComponent = ManageInstructionsSeedRolesComponent;
})();
