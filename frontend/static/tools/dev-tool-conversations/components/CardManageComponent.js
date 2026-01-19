(function () {
    /*
        CardManageComponent: renders a single manage option item for dev-tool-conversations
    */
    class CardManageComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} manageOption - The manage option object { name, icon, description }
         */
        constructor(container, manageOption) {
            this.container = container;
            this.manageOption = manageOption;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, null, 'conversations-card-wrapper');

            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, null, this.manageOption.icon, 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-card-info');

            // Name
            window.conversations.utils.createReadOnlyText(info, null, this.manageOption.name, 'conversations-card-name');

            // Description
            window.conversations.utils.createReadOnlyText(info, null, this.manageOption.description, 'conversations-card-description');
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardManageComponent = CardManageComponent;
})();
