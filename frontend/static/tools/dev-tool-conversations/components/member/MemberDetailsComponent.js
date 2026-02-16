(function () {
    /*
        MemberDetails: right side tabset for member details in dev-tool-conversations
    */
    class MemberDetailsComponent {
        constructor(container, groupId, member, onMembersChanged = null) {
            this.container = container;
            this.groupId = groupId;
            this.member = member;
            this.onMembersChanged = onMembersChanged;
            this.page = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, '👤', this.member.member_name, {
                Age: this.member.member_profile?.age,
                Gender: this.member.member_profile?.gender,
                Location: this.member.member_profile?.location,
                Occupation: this.member.member_profile?.occupation
            });

            // Page control
            // this.page.updateButtonsArea(null);

            this.loadContent();
        }

        async loadContent() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer(null, 'conversations-page-wrapper');
            const tabs = [
                { name: '🧑 Profile', populateFunc: (container) => { new window.conversations.ManageMembersComponent(container, this.groupId, this.member, this.onMembersChanged) } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_DECISION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupId, this.member, window.conversations.CONVERSATION_TYPES.AI_DECISION); } },
                { name: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_CONVERSATION), populateFunc: (container) => { new window.conversations.MemberConversationsComponent(container, this.groupId, this.member, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION); } }
            ];
            const storageKey = `conversations-member-tabset-${this.member.member_name}`;
            new window.TabsetComponent(contentDiv, tabs, storageKey);
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDetailsComponent = MemberDetailsComponent;
})();
