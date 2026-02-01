(function () {
    /*
        ManageStatisticsComponent: TODO - implement group settings UI and logic
    */
    class ManageStatisticsComponent {
        constructor(container, groupId, optionId, manageOptions) {
            this.container = container;
            this.groupId = groupId;
            this.optionId = optionId;
            this.group = null;
            this.manageOptions = manageOptions;
            this.groupEditor = null;
            this.page = null;
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
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                `${this.group.group_name} Settings`
            );

            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');
            this.page.updateControlArea(controlDiv);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadContent() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();
            new window.conversations.charts.ChartStatusTimelineComponent(contentDiv);
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageStatisticsComponent = ManageStatisticsComponent;
})();
