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
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-manage-card-wrapper';

            // Icon 
            const icon = document.createElement('div');
            icon.className = 'conversations-list-card-icon';
            icon.textContent = this.manageOption.icon;
            wrapper.appendChild(icon);

            // Info
            const info = document.createElement('div');
            info.className = 'conversations-manage-card-info';

            // Name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'conversations-manage-card-name';
            nameDiv.textContent = this.manageOption.name;
            info.appendChild(nameDiv);

            // Description
            if (this.manageOption.description) {
                const descDiv = document.createElement('div');
                descDiv.className = 'conversations-manage-card-description';
                descDiv.textContent = this.manageOption.description;
                info.appendChild(descDiv);
            }

            wrapper.appendChild(info);
            this.container.appendChild(wrapper);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardManageComponent = CardManageComponent;
})();
