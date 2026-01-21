(function () {
    /*
        ManageSystemComponent
    */
    class ManageSystemComponent {
        constructor(container, groupName, optionId, manageOptions) {
            this.container = container;
            this.groupName = groupName;
            this.optionId = optionId;
            this.group = null;
            this.manageOptions = manageOptions;
            this.groupEditor = null;
            this.page = null;
            this.queueState = null;
            this.timelineDiv = null;

            // IMPORTANT: make sure state is always an object (never null)
            this._statusChartState = null;

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
            new window.ButtonComponent(buttonsDiv, 'Button', null, window.ButtonComponent.TYPE_GHOST, 'Button');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadControl();
            this.loadContent();
        }

        async loadControl() {
            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            // Fetch queue state
            this.queueState = await window.conversations.system_api.fetchQueueState(controlDiv);

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
                    this.loadControl();
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

            const statusTimelineChart = new window.conversations.charts.ChartStatusTimelineComponent(contentDiv);

            // Update content area
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageSystemComponent = ManageSystemComponent;
})();
