(function () {
    /*
        GroupSelectionComponent: Reusable group selection dropdown for dev-tool-conversations
    */
    class GroupSelectionComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         * @param {function} onGroupChange - Callback when group selection changes (receives groupName)
         * @param {function} onModeChange - Optional callback when mode changes (receives mode: 'view' or 'manage')
         */
        constructor(container, onGroupChange, onModeChange = null) {
            this.container = container;
            this.onGroupChange = onGroupChange;
            this.onModeChange = onModeChange;
            this.groupNames = [];
            this.selectedGroup = null;
            this.render();
        }

        async render() {
            this.container.innerHTML = '';
            
            // Create wrapper with header
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-group-selection-wrapper');
            
            // Header - Group
            window.conversations.utils.createReadOnlyText(wrapper, 'conversations-selection-header', 'Group', 'conversations-selection-header');
            
            // Content container
            this.contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-group-selection-content');
                        
            // Show loading spinner while fetching
            new window.SpinnerComponent(this.contentContainer, { text: 'Loading groups...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
            
            // Fetch groups
            this.groupNames = await window.conversations.api.fetchGroupNames();
            this.selectedGroup = this.groupNames.length > 0 ? this.groupNames[0] : null;
            
            // Remove the spinner
            this.contentContainer.innerHTML = '';

            // Controls container for select group and mode buttons
            const controlsContainer = window.conversations.utils.createDivContainer(this.contentContainer, 'conversations-group-selection-controls', 'conversations-group-selection-controls');
            
            // Select group dropdown 
            new window.SelectComponent(
                controlsContainer,
                this.groupNames.map(g => ({ label: g, value: g })),
                (selectedGroup) => {
                    this.selectedGroup = selectedGroup;
                    this.onGroupChange(selectedGroup);
                },
                'Select Group ...',
                this.selectedGroup
            );
            
            // Option buttons (View/Manage)
            const options = [ { label: 'View', value: 'view' }, { label: 'Manage', value: 'manage' } ];
            new window.OptionButtonsComponent(
                controlsContainer, 
                options, 
                'view', 
                this.onModeChange.bind(this),
                'conversations-group-selection-mode'
            );
            
            // Trigger onGroupChange callback with initial selection
            if (this.selectedGroup) {
                this.onGroupChange(this.selectedGroup);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.GroupSelectionComponent = GroupSelectionComponent;
})();
