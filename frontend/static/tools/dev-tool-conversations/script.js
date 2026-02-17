// dev-tool-conversations: Regular tool entry point for the conversations dev tool
window.tool_script = {
    async init(container) {

        console.log('[Conversations Tool] Initializing conversations tool...');

        // Register the Chart datalabels plugin globally if available, but disable by default
        if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
            console.log('[Conversations Tool] Registering ChartDataLabels plugin globally with default display disabled.');
            Chart.register(ChartDataLabels);
            Chart.defaults.set('plugins.datalabels', {
                display: false // Disable by default
            });
        }

        // Clear container
        container.innerHTML = '';

        // Create root
        const root = window.conversations.utils.createDivContainer(container, 'conversations-tool-root');

        // Create left
        const left = window.conversations.utils.createDivContainer(root, 'conversations-layout-left');

        // Create group selection container at the top of left
        this.groupSelectionArea = window.conversations.utils.createDivContainer(left, 'conversations-layout-group-container');

        // Create content container (will hold either members list or manage component) at the bottom of left
        this.memberSelectionArea = window.conversations.utils.createDivContainer(left, 'conversations-layout-content-container');

        // Create right
        // this.right = window.conversations.utils.createDivContainer(root, 'conversations-layout-right');

        this.contentArea = window.conversations.utils.createDivContainer(root, 'conversations-layout-right');

        this.loadGroupSelectionArea();
    },

    async loadGroupSelectionArea() {
        // Initialize group selection component
        // MenuGroupSelectionComponent exposes the selectedGroupId property
        // the initial value of selectedGroupId will be available and triggered 
        // from the callback onChange when component is loaded
        this.menuGroupSelectionComponent = new window.conversations.MenuGroupSelectionComponent(this.groupSelectionArea,
            // onChange callback when group selection changes in MenuGroupSelectionComponent
            async () => {
                console.log('[Conversations Tool] Group selection changed to:', this.menuGroupSelectionComponent.selectedGroupId, ' - reloading content and member selection area based on the new selected group');
                this.loadContentAndMemberSelectionArea();
            },
            // onGroupAdded callback when a group is added
            async (added) => {
                console.log('[Conversations Tool] Group added:', added.groups[0].group_id);
                this.menuGroupSelectionComponent.selectGroup(added.groups[0].group_id);
            },
            // onGroupDeleted callback when a group is deleted from the ManageGroupSettingsComponent
            async () => {
                console.log('[Conversations Tool] Group deleted');
                await this.loadGroupSelectionArea();
            }
        );

        this.loadContentAndMemberSelectionArea();
    },

    // Load content area based on selected group
    loadContentAndMemberSelectionArea() {
        // Clear content area before loading new content
        this.contentArea.innerHTML = '';
        this.memberSelectionArea.innerHTML = '';

        if (!this.menuGroupSelectionComponent.groups) {
            new window.SpinnerComponent(this.contentArea, { text: `Loading ...`, size: 16 });
            new window.SpinnerComponent(this.memberSelectionArea, { text: `Loading ...`, size: 16 });
            return;
        }

        // Check if groups exist - if not show message and option to add group
        if (this.menuGroupSelectionComponent.groups.length === 0) {
            console.log('[Conversations Tool] No groups available - showing message and option to add group on the content area');
            // Create seed import component for groups
            new window.conversations.ManageSeedsImportComponent(
                this.contentArea,
                null, // No groupId since we're creating a new group
                window.conversations.SEED_TYPES.GROUP,
                (added) => {
                    // Callback when seeds are imported
                    console.log('[Conversations Tool] Group added:', added.groups[0].group_id);
                    this.menuGroupSelectionComponent.selectGroup(added.groups[0].group_id);

                }
            );
            return;
        }

        // If no group selected
        if (!this.menuGroupSelectionComponent.selectedGroupId) {
            console.log('[Conversations Tool] No group selected - showing instruction to select a group on the content area');
            window.conversations.utils.createReadOnlyText(this.contentArea, 'Please select a group to view members.', 'conversations-message-empty');
            return;
        }

        new window.SpinnerComponent(this.contentArea, { text: `Loading ...`, size: 16 });

        // Load members list component on the member selection area for the selected group
        console.log('[Conversations Tool] Groups exist and selected group is:', this.menuGroupSelectionComponent.selectedGroupId, ' - loading members list for the selected group on the content area');
        this.menuListMembersComponent = new window.conversations.MenuListMembersComponent(this.memberSelectionArea, this.menuGroupSelectionComponent.selectedGroupId,
            // onMemberSelect callback when member is selected from the MenuListMembersComponent - show member 
            // details in the content area on the right or if no member is selected show the 
            // import seeds component if there are no members or instruction to select member if there are members
            (member) => {
                this.contentArea.innerHTML = '';
                if (member) {
                    new window.conversations.MemberDetailsComponent(this.contentArea, this.menuGroupSelectionComponent.selectedGroupId, member,
                        // onMembersChanged callback when members are changed from the MemberDetailsComponent - refresh the 
                        // member in the list or reload the entire content and member selection area 
                        // if the member is null (probably was deleted)
                        (updatedMember) => {
                            console.log('[Conversations Tool] Members changed from MemberDetailsComponent - updatedMember:', updatedMember);
                            if (updatedMember) {
                                console.log('[Conversations Tool] Member was updated - refreshing member in the members list');
                                this.menuListMembersComponent.refreshMember(updatedMember);

                            } else {
                                console.log('[Conversations Tool] Member was deleted - reloading content and member selection area');
                                this.loadContentAndMemberSelectionArea();

                            }
                        }
                    );

                } else {
                    if (this.menuListMembersComponent.members && this.menuListMembersComponent.members.length > 0) {
                        console.log('[Conversations Tool] No member selected but members exist - showing instruction to select a member on the content area');
                        const wrapper = window.conversations.utils.createDivContainer(this.contentArea, 'conversations-page-wrapper');
                        window.conversations.utils.createReadOnlyText(wrapper, 'Please select a member to view details.', 'conversations-message-empty');

                    } else {
                        console.log('[Conversations Tool] No members exist - showing ManageSeedsImportComponent on the content area');
                        new window.conversations.ManageSeedsImportComponent(this.contentArea, this.menuGroupSelectionComponent.selectedGroupId, window.conversations.SEED_TYPES.MEMBERS,
                            // onAddedSeeds callback when seeds are imported from the ManageSeedsImportComponent - reload the members list for the selected group
                            (added) => {
                                if (added.members && added.members.length > 0) {
                                    console.log('[Conversations Tool] Seeds imported from ManageSeedsImportComponent - added:', added, ' - reloading members list for the selected group');
                                    this.loadContentAndMemberSelectionArea();
                                }
                            }
                        );
                    }
                }
            }
        );
    },

    destroy(container) {
        console.log('[Conversations Tool] Destroying conversations tool...');
    }
};
