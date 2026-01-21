(function () {
    /*
        ManageStatisticsComponent: TODO - implement group settings UI and logic
    */
    class ManageStatisticsComponent {
        constructor(container, groupName, optionId, manageOptions) {
            this.container = container;
            this.groupName = groupName;
            this.optionId = optionId;
            this.group = null;
            this.manageOptions = manageOptions;
            this.groupEditor = null;
            this.page = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, this.manageOptions[this.optionId].icon, this.manageOptions[this.optionId].name,
                `${this.groupName} Settings`
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
            window.conversations.utils.createLabel(contentDiv, 'Manage statistics', 'conversations-page-section-header');
            this.page.updateContentArea(contentDiv);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageStatisticsComponent = ManageStatisticsComponent;
})();
