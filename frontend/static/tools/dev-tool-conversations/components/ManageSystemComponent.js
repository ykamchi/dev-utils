(function () {
    /*
        ManageSystemComponent
    */
    class ManageSystemComponent {
        constructor(container, groupId, optionId, manageOptions) {
            this.container = container;
            this.groupId = groupId;
            this.optionId = optionId;
            this.manageOptions = manageOptions;
            this.page = null;
            this.group = null;
            this.queueState = null;
            this.render();
        }

        render() {
            // Load and display the content
            this.load();
        }

        // Get the group available instructions and render them in tabs according to the conversation types
        async load() {
            this.group = await window.conversations.apiGroups.groupsGet(this.container, this.groupId);
            // Create the main page component
            this.page = new window.conversations.PageComponent(
                this.container,
                this.manageOptions[this.optionId].icon,
                this.manageOptions[this.optionId].name,
                `${this.group.group_name} Settings Settings Settings Settings Settings `
            );

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            // new window.ButtonComponent(buttonsDiv, 'Button', null, window.ButtonComponent.TYPE_GHOST, 'Button');
            this.page.updateButtonsArea(buttonsDiv);

        //     this.loadContent();
        // }

        // async loadContent() {
            // Fetch queue state
            this.queueState = await window.conversations.system_api.fetchQueueState();
            this.loadControl();
            this.loadContent();

        }

        async loadControl() {
            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            // Queue state toggle
            new window.conversations.utils.createLabel(controlDiv, 'Queue State:');
            new ToggleButtonComponent(
                controlDiv,
                !this.queueState.paused,
                async (v) => {
                    if (v) {
                        await window.conversations.system_api.queueResume(this.container);
                    } else {
                        await window.conversations.system_api.queuePause(this.container);
                    }
                    this.loadContent();
                },
                'Active',
                'Paused',
                '140px',
                '34px'
            );

            // Update control area
            this.page.updateControlArea(controlDiv);
        }

        async loadContent() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversations-page-wrapper');
            
            const systemQueueStatusDiv = window.conversations.utils.createDivContainer(wrapper);

            // Running
            window.conversations.utils.createField(systemQueueStatusDiv, 'Running', this.queueState.running, true);

            // Paused
            window.conversations.utils.createField(systemQueueStatusDiv, 'Paused', this.queueState.paused, true);

            // Max Concurrent
            window.conversations.utils.createField(systemQueueStatusDiv, 'Max Concurrent', this.queueState.max_concurrent, true);

            // Available Slots
            window.conversations.utils.createField(systemQueueStatusDiv, 'Available Slots', this.queueState.available_slots, true);
            
            // Update content area
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageSystemComponent = ManageSystemComponent;
})();
