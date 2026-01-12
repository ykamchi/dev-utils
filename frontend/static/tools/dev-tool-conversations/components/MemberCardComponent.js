(function () {
    /*
        MemberCardComponent: renders a single member item for dev-tool-conversations
    */
    class MemberCardComponent {
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
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-member-card-wrapper';

            // Avatar 
            const avatar = document.createElement('div');
            avatar.className = 'conversations-list-card-icon';
            avatar.textContent = '👤';
            wrapper.appendChild(avatar);

            // Info
            const info = document.createElement('div');
            info.className = 'conversations-member-card-info';

            // Name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'conversations-member-card-name';
            nameDiv.textContent = this.member.name;
            info.appendChild(nameDiv);

            const metaDiv = document.createElement('div');
            metaDiv.className = 'conversations-member-card-meta';
            metaDiv.textContent = `${this.member.location} • ${this.member.age}`;
            info.appendChild(metaDiv);

            wrapper.appendChild(info);
            this.container.appendChild(wrapper);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberCardComponent = MemberCardComponent;
})();
