(function () {
    /*
        SystemStatisticsComponent - System-wide statistics
    */
    class SystemStatisticsComponent {
        constructor(container) {
            this.container = container;
            this.page = null;
            this.render();
        }

        render() {
            // Load and display the content
            this.load();
        }

        async load() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(
                this.container,
                '📊',
                'Statistics',
                'System'
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
    window.conversations.SystemStatisticsComponent = SystemStatisticsComponent;
})();
