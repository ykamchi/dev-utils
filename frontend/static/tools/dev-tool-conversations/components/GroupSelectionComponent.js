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
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-group-selection-wrapper';
            
            // Header - Group
            const groupHeader = document.createElement('div');
            groupHeader.className = 'conversations-group-selection-header';
            groupHeader.textContent = 'Group';
            wrapper.appendChild(groupHeader);
            
            // Content container
            this.contentContainer = document.createElement('div');
            wrapper.appendChild(this.contentContainer);
            
            this.container.appendChild(wrapper);
            
            // Show loading spinner while fetching
            new window.SpinnerComponent(this.contentContainer, { text: 'Loading groups...', size: 16, textPosition: window.SpinnerComponent.TEXT_POSITION_RIGHT });
            
            // Fetch groups
            this.groupNames = await this.fetchGroupNames();
            this.selectedGroup = this.groupNames.length > 0 ? this.groupNames[0] : null;
            
            // Remove the spinner
            this.contentContainer.innerHTML = '';

            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'conversations-group-selection-controls';
            this.contentContainer.appendChild(controlsContainer);
            
            // Select dropdown
            const selectContainer = document.createElement('div');
            selectContainer.className = 'conversations-group-selection-select';
            controlsContainer.appendChild(selectContainer);
            
            const groupOptions = this.groupNames.map(g => ({ label: g, value: g }));
            new window.SelectComponent(
                selectContainer,
                groupOptions,
                (selectedGroup) => {
                    this.selectedGroup = selectedGroup;
                    this.onGroupChange(selectedGroup);
                },
                'Select Group ...',
                this.selectedGroup
            );
            
            // Option buttons (View/Manage)
            const optionButtonsContainer = document.createElement('div');
            controlsContainer.appendChild(optionButtonsContainer);
            
            new window.OptionButtonsComponent(
                optionButtonsContainer,
                [
                    { label: 'View', value: 'view' },
                    { label: 'Manage', value: 'manage' }
                ],
                {
                    selected: 'view',
                    onChange: (mode) => {
                        console.log('Group mode changed to:', mode);
                        if (this.onModeChange) {
                            this.onModeChange(mode);
                        }
                    }
                }
            );
            
            // Trigger onGroupChange callback with initial selection
            if (this.selectedGroup) {
                this.onGroupChange(this.selectedGroup);
            }
        }

        // Fetch group names from API
        async fetchGroupNames() {
            try {
                const resp = await fetch('/api/dev-tool-conversations/groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const data = await resp.json();
                if (data.success && Array.isArray(data.groups)) {
                    return data.groups;
                } else {
                    console.error('Failed to fetch groups:', data.error || 'Unknown error');
                    return [];
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
                return [];
            }
        }


        // Public method to get current selected group
        getSelectedGroup() {
            return this.selectedGroup;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.GroupSelectionComponent = GroupSelectionComponent;
})();
