// dev-tool-conversations: Regular tool entry point

window.tool_script = {
  async init(container) {
    console.log('[Conversations Tool] Initializing conversations tool...');

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
    right.innerHTML = '<div class="member-profile-empty">No member selected.</div>';
    root.appendChild(right);

    // Add to container
    container.appendChild(root);

    // Get group names from member function
    const groupNames = await this.fetchGroupNames();

    // Initialize members list
    new window.MembersListComponent(left, {
      groupNames,
      onMemberSelect: this.showMember.bind(this, right)
    });
  },

  showMember(right, member) {
    right.innerHTML = '';
    if (member) {
      new window.Conversations.MemberDetailsComponent(right, member);
    } else {
      right.innerHTML = '<div class="member-profile-empty">No member selected.</div>';
    }
  },

  async fetchGroupNames() {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 100));
    return ['co-founders', 'first-date', 'co-parenting'];
  },

  destroy(container) {
    console.log('[Conversations Tool] Destroying conversations tool...');
  }
};
