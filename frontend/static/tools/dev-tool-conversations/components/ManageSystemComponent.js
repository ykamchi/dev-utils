(function () {
    /*
        ManageSystemComponent
    */
    class ManageSystemComponent {
        constructor(container, groupName, optionId, manageOptions) {
            this.container = container;
            this.groupName = groupName;
            this.optionId = optionId;
            this.manageOptions = manageOptions;
            this.page = null;
            this.queueState = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(
                this.container,
                this.manageOptions[this.optionId].icon,
                this.manageOptions[this.optionId].name,
                `${this.groupName} Settings Settings Settings Settings Settings `
            );

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            // new window.ButtonComponent(buttonsDiv, 'Button', null, window.ButtonComponent.TYPE_GHOST, 'Button');
            this.page.updateButtonsArea(buttonsDiv);

            this.load();
        }

        async load() {
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
                    console.log('toggle:', v);
                    if (v) {
                        await window.conversations.system_api.queueResume(this.container);
                    } else {
                        await window.conversations.system_api.queuePause(this.container);
                    }
                    this.load();
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
            const runningDiv = window.conversations.utils.createDivContainer(systemQueueStatusDiv,  'conversation-field-container-vertical');
            window.conversations.utils.createLabel(runningDiv, 'Running:');
            window.conversations.utils.createReadOnlyText(runningDiv, this.queueState.running);


            // Paused
            const pausedDiv = window.conversations.utils.createDivContainer(systemQueueStatusDiv,  'conversation-field-container-vertical');
            window.conversations.utils.createLabel(pausedDiv, 'Paused:');
            window.conversations.utils.createReadOnlyText(pausedDiv, this.queueState.paused);

            // Max Concurrent
            const maxConcurrentDiv = window.conversations.utils.createDivContainer(systemQueueStatusDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(maxConcurrentDiv, 'Max Concurrent:');
            window.conversations.utils.createReadOnlyText(maxConcurrentDiv, this.queueState.max_concurrent);

            // Available Slots
            const availableSlotsDiv = window.conversations.utils.createDivContainer(systemQueueStatusDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(availableSlotsDiv, 'Available Slots:');
            window.conversations.utils.createReadOnlyText(availableSlotsDiv, this.queueState.available_slots);
            
            // Update content area
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageSystemComponent = ManageSystemComponent;
})();
