// dev-tool-conversations: Regular tool entry point for the conversations dev tool
window.tool_script = {
    async init(container) {
        console.log('[Conversations Tool] Initializing conversations tool...');

        new SpinnerComponent(container, { text: 'Loading conversations tool...' });

        // Get group names from API
        const groupNames = await this.fetchGroupNames();

        // Clear container
        container.innerHTML = '';

        // Create root
        const root = document.createElement('div');
    root.id = 'conversations-tool-root';
    root.className = 'conversations-tool-root';

        // Create left
        const left = document.createElement('div');
    left.id = 'conversations-tool-left';
    left.className = 'conversations-tool-left';
        root.appendChild(left);

        // Create right
        const right = document.createElement('div');
    right.id = 'conversations-tool-right';
    right.className = 'conversations-tool-right';
    right.innerHTML = '<div class="conversations-member-profile-empty">No member selected.</div>';
        root.appendChild(right);

        // Add to container
        container.appendChild(root);

        // Initialize members list
        new window.conversations.MembersListComponent(left, groupNames, this.showMember.bind(this, right));
    },

    // Show member details in right pane after selection invoked by MemberDetailsComponent
    showMember(right, groupName, memberId, membersMap) {
        right.innerHTML = '';
        if (memberId) {
            new window.conversations.MemberDetailsComponent(right, groupName, memberId, membersMap);
        } else {
            right.innerHTML = '<div class="conversations-member-profile-empty">No member selected.</div>';
        }
    },

    // Fetch group names from API
    // TODO: Need to get the group names from the backend API instead of hardcoding
    async fetchGroupNames() {
        // Simulate network delay
        await new Promise(res => setTimeout(res, 500));
        return ['first-date', 'co-founders', 'co-parenting'];
    },

    destroy(container) {
        console.log('[Conversations Tool] Destroying conversations tool...');
    }
};
