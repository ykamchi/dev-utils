(function () {
    /*
        SystemViewComponent - System management with tabs
    */
    class SystemViewComponent {
        constructor(container) {
            this.container = container;
            this.wrapper = null;
            this.queueStatusComponent = null;
            this.queueListComponent = null;
            
            this.render();
        }

        render() {
            this.wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');
            this.load();
        }

        async load() {
            // Create tabset with three tabs
            new window.TabsetComponent(
                this.wrapper,
                [
                    {
                        name: '🚦 Queue Status',
                        populateFunc: (tabContentDiv) => {
                            this.queueStatusComponent =  new window.conversations.SystemQueueStatusComponent(tabContentDiv);
                        }
                    },
                    {
                        name: '📋 Queue Entries',
                        populateFunc: (tabContentDiv) => {
                            this.queueListComponent = new window.conversations.SystemQueueListComponent(tabContentDiv);
                        }
                    },
                    {
                        name: '📊 Statistics',
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.SystemStatisticsComponent(tabContentDiv);
                        }
                    }
                ],
                'conversations-system-view-tabs' // Storage key for persistent tab selection
            );
        }

        destroy() {
            console.log('Destroying SystemViewComponent and cleaning up resources...');
            if (this.queueStatusComponent && this.queueStatusComponent.destroy) {
                this.queueStatusComponent.destroy();
            }
            if (this.queueListComponent && this.queueListComponent.destroy) {
                this.queueListComponent.destroy();
            }   
        }
    }
     
    window.conversations = window.conversations || {};
    window.conversations.SystemViewComponent = SystemViewComponent;
})();
