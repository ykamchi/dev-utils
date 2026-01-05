(function () {
    /*
        MemberProfileComponent: right side profile viewer for dev-tool-conversations
    */
    class MemberProfileComponent {
        constructor(container, groupName, memberId, membersMap) {
            this.container = container;
            this.groupName = groupName;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.member = membersMap[memberId];
            this.renderProfile();
        }

        renderProfile() {
            this.container.innerHTML = '';

            // Create wrapper for profile
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-member-profile-wrapper';

            // Header
            const header = document.createElement('div');
            header.className = 'conversations-member-profile-header';
            header.textContent = this.member.member_nick_name || this.member.name || 'Member';
            wrapper.appendChild(header);

            // JSON block
            const profile = document.createElement('pre');
            profile.className = 'conversations-member-profile-json';
            profile.textContent = JSON.stringify(this.member, null, 2);
            wrapper.appendChild(profile);

            this.container.appendChild(wrapper);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberProfileComponent = MemberProfileComponent;
})();