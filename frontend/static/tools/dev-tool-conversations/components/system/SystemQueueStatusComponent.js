(function () {
    /*
        SystemQueueStatusComponent - Displays queue state and toggle control
    */
    class SystemQueueStatusComponent {
        constructor(container) {
            this.container = container;
            this.page = null;
            this.queueState = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, '🚦', 'Queue Status', 'System');

            // Load and display the content
            this.load();
        }

        async load() {
            // Fetch queue state
            this.queueState = await window.conversations.system_api.queueState();
            
            //Create buttons area with
            this.createButtonsArea();

            // Load content area with queue state details
            this.loadContentArea();
        }

        async createButtonsArea() {
            // Page control
            const buttonContainer = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');

            // Queue state toggle
            new window.ToggleButtonComponent(
                buttonContainer,
                !this.queueState.paused,
                async (v) => {
                    if (v) {
                        await window.conversations.system_api.queueResume(this.container);
                    } else {
                        await window.conversations.system_api.queuePause(this.container);
                    }
                    await this.createButtonsArea();
                },
                'Active',
                'Paused',
                '140px',
                '32px'
            );

            // Update control area
            this.page.updateButtonsArea(buttonContainer);
        }

        async loadContentArea() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversation-field-container-vertical');
            
            const systemQueueStatusDiv = window.conversations.utils.createDivContainer(wrapper);

            // Active
            window.conversations.utils.createField(systemQueueStatusDiv, 'Active', !this.queueState.active, true);

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
    window.conversations.SystemQueueStatusComponent = SystemQueueStatusComponent;
})();
