(function () {
    /*
        CardInstructionComponent: renders a single instruction item for dev-tool-conversations
    */
    class CardInstructionComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} instruction - The instruction object { name, location, age }
         */
        constructor(container, instruction) {
            this.container = container;
            this.instruction = instruction;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, window.conversations.CONVERSATION_TYPES_ICONS[this.instruction.info.conversation_type], 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // Name
            window.conversations.utils.createReadOnlyText(info, this.instruction.info.name, 'conversations-card-name');

            // Description
            window.conversations.utils.createReadOnlyText(info, `Roles - ${Object.keys(this.instruction.info.roles).length} • Turns - ${this.instruction.info.max_turns}`, 'conversations-card-description');
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardInstructionComponent = CardInstructionComponent;
})();
