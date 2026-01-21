(function () {
    /*
        CardMemberComponent: renders a single member item for dev-tool-conversations
    */
    class CardMemberComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {Object} member - The member object { name, location, age }
         */
        constructor(container, member) {
            this.container = container;
            this.member = member;
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

            // Icon 
            window.conversations.utils.createReadOnlyText(wrapper, '👤', 'conversations-list-card-icon');

            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

            // Name
            window.conversations.utils.createReadOnlyText(info, this.member.name, 'conversations-card-name');

            // Description
            window.conversations.utils.createReadOnlyText(info, `${this.member.location} • ${this.member.age}`, 'conversations-card-description');
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardMemberComponent = CardMemberComponent;
})();
