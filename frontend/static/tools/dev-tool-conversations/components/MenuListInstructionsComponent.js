(function () {
    /*
        MenuListInstructionsComponent: left side to select members in dev-tool-conversations
    */
    class MenuListInstructionsComponent {
        constructor(container, groupId, conversation_type, onInstructionSelect) {
            this.container = container;
            this.groupId = groupId;
            this.conversation_type = conversation_type;
            this.onInstructionSelect = onInstructionSelect;
            this.instructions = null;
            this.list = null;
        
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-menu-selection-wrapper');

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-manage-header');

            // Header - Group
            window.conversations.utils.createReadOnlyText(headerDiv, 'Instructions', 'conversations-menu-selection-header');

            // Content container
            const contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversation-field-container-vertical-full');

            // Instructions list container
            this.instructionSelectionContainer = window.conversations.utils.createDivContainer(contentContainer, 'conversations-menu-list-items');

            // Add and Delete and settings group button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, 'conversations-buttons-container');
            this.addButton = new window.ButtonComponent(buttonContainer, {
                label: '+',
                onClick: () => window.conversations.popups.addInstruction(this.groupId, this.conversation_type, () => this.loadContent()),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '+ Add instruction'
            });

            this.loadContent();
        }

        // Load instructions for the selected group
        async loadContent() {
            // Clear previous content
            this.instructionSelectionContainer.innerHTML = '';

            this.instructions = await window.conversations.apiInstructions.instructionsList(this.instructionSelectionContainer, this.groupId, this.conversation_type);

            if (!this.instructions || this.instructions.length === 0) {
                window.conversations.utils.createReadOnlyText(this.instructionSelectionContainer, 'No instructions available. Please add an instruction.', 'conversations-message-empty');
                this.onInstructionSelect(null);
                this.list = null;
                
                return;
            }

            // Create ListComponent with filtered members
            // const items = Object.entries(this.members).map(m => ({ id: m.name, member: m }));
            this.list = new window.ListComponent(
                this.instructionSelectionContainer,
                this.instructions,
                (item) => {
                    const instructionDiv = document.createElement('div');
                    new window.conversations.CardInstructionComponent(instructionDiv, item);
                    return instructionDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onInstructionSelect(selectedItems[0]);
                        this.list.storeLastSelected('instructions-list-last-selection-' + this.groupId, item => item.instruction_name);
                        
                    } else {
                        this.onInstructionSelect(null);
                        
                    }
                },
                (item, query) => {
                    return item.instruction_name.toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Name', func: (a, b) => { return a.instruction_name < b.instruction_name ? -1 : 1; } , direction: 1 },
                    { label: 'Location', func: (a, b) => a.instruction_profile.location < b.instruction_profile.location ? -1 : 1, direction: 1 },
                    { label: 'Age', func: (a, b) => a.instruction_profile.age < b.instruction_profile.age ? -1 : 1, direction: 1 },
                ] 
            );

            // Restore last selection, or select first item
            this.list.setLastSelected('instructions-list-last-selection-' + this.groupId, item => item.instruction_name);
            this.onInstructionSelect(this.list.getSelectedItems()[0] || null);
        }

        async refreshInstruction(instruction) {
            console.log('[MenuListInstructionsComponent] Refreshing instruction:', instruction);
            // Update the specific instruction in the list without reloading from API
            if (instruction && this.list) {
                // Use the list's updateItem method to update only this instruction
                this.list.updateItem(instruction, (item) => item.instruction_id === instruction.instruction_id);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuListInstructionsComponent = MenuListInstructionsComponent;
})();