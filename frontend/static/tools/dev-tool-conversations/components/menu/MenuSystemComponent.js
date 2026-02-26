(function () {
    class MenuSystemComponent {
        /**
         * @param {HTMLElement} container - The container to render into
         */
        constructor(container) {
            this.container = container;
            this.systemSettingsButton = null;
            this.toggleButton = null;
            this.queueState = null;
            this.refreshTimer = null;
            this.isApiAvailable = null; // null means unknown (not initialized yet)
            
            this._onQueueStateUpdate = this.onQueueStateUpdate.bind(this);
            this.queueStateListener = window.conversations.notificationHub.addEventListener('queue-state', this._onQueueStateUpdate);
            
            this.render();
        }

        async onQueueStateUpdate(event) {
            if (event.detail.type !== 'queue-state') return;
            console.log('[Conversations Tool] - MenuSystemComponentReceived queue state update notification:', event.detail.data);
            // Update local queue state with the new data
            this.queueState = event.detail.data; 
            this.queueState = await window.conversations.system_api.queueState(this.container);
            this.renderSystemContainer();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-menu-selection-wrapper');

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-manage-header');

            // Header - System
            window.conversations.utils.createReadOnlyText(headerDiv, 'System', 'conversations-menu-selection-header');

            // Content container
            const contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-group-selection-controls');

            this.systemContainer = window.conversations.utils.createDivContainer(contentContainer, 'conversations-menu-group-selection-container');

            // Add settings button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, 'conversations-buttons-container');
            this.settingsButton = new window.ButtonComponent(buttonContainer, {
                label: '🛠️',
                onClick: () => window.conversations.popups.openSystemSettings(),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '🛠️ System settings'
            });

            this.load();
        }

        async load() {
            // Do initial fetch to get queue state
            this.queueState = await window.conversations.system_api.queueState(null);
                            
            // Render system container based on availability
            this.renderSystemContainer();
        }

        renderSystemContainer() {
            // Clear system container
            this.systemContainer.innerHTML = '';
            
            // Create toggle button
            this.toggleButton = new window.ToggleButtonComponent(
                this.systemContainer,
                !this.queueState.paused,
                async (v) => {
                    if (v) {
                        await window.conversations.system_api.queueResume(this.container);
                        // await this.refreshQueueState();
                    } else {
                        await window.conversations.system_api.queuePause(this.container);
                        // await this.refreshQueueState();
                    }
                }, 
                'Active',
                'Paused',
                '140px', 
                '32px'
            );
        }

        destroy() {
            // Clean up timers when component is destroyed
            console.log('[Conversations Tool] - Destroying MenuSystemComponent and cleaning up resources...');
            window.conversations.notificationHub.removeEventListener('queue-state', this._onQueueStateUpdate);
        }

    }

    window.conversations = window.conversations || {};
    window.conversations.MenuSystemComponent = MenuSystemComponent;
})();
