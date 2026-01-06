// dev-tool-conversations: Regular tool entry point for the conversations dev tool
window.tool_script = {
    async init(container) {
        console.log('[Conversations Tool] Initializing conversations tool...');

        new SpinnerComponent(container, { text: 'Loading conversations tool...' });


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

        // State for selected group and mode
        this.selectedGroup = null;
        this.selectedMode = 'view';

        // Create group selection container
        const groupSelectionContainer = document.createElement('div');
        groupSelectionContainer.className = 'conversations-group-container';
        left.appendChild(groupSelectionContainer);

        // Create content container (will hold either members list or manage component)
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'conversations-content-container';
        left.appendChild(this.contentContainer);

        // Store references
        this.right = right;

        // Initialize group selection component
        this.groupSelectionComponent = new window.conversations.GroupSelectionComponent(
            groupSelectionContainer,
            (selectedGroup) => {
                this.selectedGroup = selectedGroup;
                this.updateContent();
            },
            (mode) => {
                this.selectedMode = mode;
                console.log('[Conversations Tool] Mode changed to:', mode);
                this.updateContent();
            }
        );
    },

    // Update content based on current mode and selected group
    updateContent() {
        // Clear content container
        this.contentContainer.innerHTML = '';

        if (!this.selectedGroup) {
            // No group selected
            this.right.innerHTML = '<div class="conversations-member-profile-empty">Please select a group.</div>';
            return;
        }

        if (this.selectedMode === 'view') {
            // Show members list - View mode
            this.right.innerHTML = '<div class="conversations-member-profile-empty">Select a member to view details.</div>';
            this.membersListComponent = new window.conversations.MembersListComponent(
                this.contentContainer,
                this.showMember.bind(this, this.right)
            );
            this.membersListComponent.load(this.selectedGroup);
        } else if (this.selectedMode === 'manage') {
            // Show manage component - Manage mode
            this.right.innerHTML = '<div class="conversations-member-profile-empty">Select a management option.</div>';
            this.manageListComponent = new window.conversations.ManageListComponent(
                this.contentContainer,
                this.showManageOption.bind(this, this.right)
            );
            this.manageListComponent.load(this.selectedGroup);
        }
    },

    // Show member details in right pane after selection invoked by MemberDetailsComponent
    showMember(right, memberId, membersMap) {
        right.innerHTML = '';
        if (memberId) {
            new window.conversations.MemberDetailsComponent(right, this.selectedGroup, memberId, membersMap);
        } else {
            right.innerHTML = '<div class="conversations-member-profile-empty">No member selected.</div>';
        }
    },

    // Show manage option details in right pane
    showManageOption(right, optionId) {
        right.innerHTML = '';
        if (optionId) {
            // TODO: Create and show manage option component based on optionId
            const optionDiv = document.createElement('div');
            optionDiv.className = 'conversations-member-profile-empty';
            optionDiv.textContent = `Manage option "${optionId}" will be implemented here.`;
            right.appendChild(optionDiv);
        } else {
            right.innerHTML = '<div class="conversations-member-profile-empty">Select a management option.</div>';
        }
    },

    destroy(container) {
        console.log('[Conversations Tool] Destroying conversations tool...');
    }
};
