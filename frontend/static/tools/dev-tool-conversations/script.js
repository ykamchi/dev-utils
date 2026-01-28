// dev-tool-conversations: Regular tool entry point for the conversations dev tool
window.tool_script = {
    async init(container) {

        console.log('[Conversations Tool] Initializing conversations tool...');

        // Clear container
        container.innerHTML = '';

        // Create root
        const root = window.conversations.utils.createDivContainer(container, 'conversations-tool-root');

        // Create left
        const left = window.conversations.utils.createDivContainer(root, 'conversations-layout-left');

        // Create right
        this.right = window.conversations.utils.createDivContainer(root, 'conversations-layout-right');

        // Create group selection container at the top of left
        this.groupSelectionContainer = window.conversations.utils.createDivContainer(left, 'conversations-layout-group-container');

        // Create content container (will hold either members list or manage component) at the bottom of left
        this.contentContainer = window.conversations.utils.createDivContainer(left, 'conversations-layout-content-container');

        // Register the Chart datalabels plugin globally if available, but disable by default
        if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
            Chart.defaults.set('plugins.datalabels', {
                display: false // Disable by default
            });
        }
        // Initialize group selection component
        // MenuGroupSelectionComponent expose the selectedGroupId and selectedMode properties
        // the initial values of selectedGroupId and selectedMode will be available and triggered 
        // from the callback onChange when component is loaded
        this.MenuGroupSelectionComponent = new window.conversations.MenuGroupSelectionComponent(
            this.groupSelectionContainer, () => { 
                console.log('[Conversations Tool] Group selection changed to:', this.MenuGroupSelectionComponent.selectedGroupId, 'Mode:', this.MenuGroupSelectionComponent.selectedMode);
                this.updateContent(); 
            }
        );
    },

    // Update content based on current mode and selected group
    updateContent() {
        // Clear content container
        this.contentContainer.innerHTML = '';
        console.log('[Conversations Tool] Loading manage component for group:', this.MenuGroupSelectionComponent.selectedGroupId);
        
        if (!this.MenuGroupSelectionComponent.selectedGroupId) {
            // No group selected
            this.right.innerHTML = '<div class="conversations-message-empty">Please select a group.</div>';
            return;
        }

        if (this.MenuGroupSelectionComponent.selectedMode === 'view') {
            // Show members list - View mode
            this.right.innerHTML = '<div class="conversations-message-empty">Select a member to view details.</div>';
            this.MenuListMembersComponent = new window.conversations.MenuListMembersComponent(
                this.contentContainer,
                this.onMemberSelect.bind(this, this.right)
            );
            this.MenuListMembersComponent.load(this.MenuGroupSelectionComponent.selectedGroupId);

        } else if (this.MenuGroupSelectionComponent.selectedMode === 'manage') {
            // Show manage component - Manage mode
            this.right.innerHTML = '<div class="conversations-message-empty">Select a management option.</div>';
            this.MenuListManageComponent = new window.conversations.MenuListManageComponent(
                this.contentContainer,
                this.onManageOptionSelect.bind(this, this.right),
                this.onGroupNameChange.bind(this, this.MenuGroupSelectionComponent)
            );
            this.MenuListManageComponent.load(this.MenuGroupSelectionComponent.selectedGroupId);
        }
    },

    // Show member details in right pane after 
    // selection invoked by MenuListMembersComponent
    onMemberSelect(right, memberId, membersMap) {
        right.innerHTML = '';
        if (memberId) {
            new window.conversations.MemberDetailsComponent(right, this.MenuGroupSelectionComponent.selectedGroupId, memberId, membersMap);
        } else {
            right.innerHTML = '<div class="conversations-message-empty">No member selected.</div>';
        }
    },

    // Show manage option details in right pane after 
    // selection invoked by MenuListManageComponent
    onManageOptionSelect(right, optionId, manageOptions) {
        right.innerHTML = '';
        if (optionId) {
            const selectedOption = manageOptions[optionId];
            if (selectedOption && selectedOption.component) {
                const ComponentClass = window.conversations[selectedOption.component];
                if (ComponentClass) {
                    new ComponentClass(right, this.MenuGroupSelectionComponent.selectedGroupId, optionId, manageOptions);
                } else {
                    console.error(`Component ${selectedOption.component} not found`);
                    right.innerHTML = '<div class="conversations-message-empty">Component not found.</div>';
                }
            } else {
                right.innerHTML = '<div class="conversations-message-empty">This feature is not yet implemented.</div>';
            }
        } else {
            right.innerHTML = '<div class="conversations-message-empty">Select a management option.</div>';
        }
    },

    // Handle group name change from MenuListManageComponent
    // Update the selected group and reload the group selection component
    async onGroupNameChange(MenuGroupSelectionComponent, groupId) {
        MenuGroupSelectionComponent.selectedGroupId = groupId;
        await MenuGroupSelectionComponent.load();
    },

    destroy(container) {
        console.log('[Conversations Tool] Destroying conversations tool...');
    }
};
