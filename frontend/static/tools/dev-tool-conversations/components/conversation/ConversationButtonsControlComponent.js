(function() {
    /*
        ConversationButtonsControlComponent is responsible for rendering the control buttons for a conversation based on its state.
        It shows different buttons for different states:
        - Failed: shows "Retry" button to rerun the conversation
        - Running/Pending: shows "Stop" button to stop the conversation
        - Stopped: shows "Run" button to trigger the conversation
    */
    class ConversationButtonsControlComponent {
        constructor(container, conversation) {
            this.container = container;
            this.conversation = conversation;

            this.render();
        }

        render() {
            const buttonsContainer = window.conversations.utils.createDivContainer(this.container, 'conversations-buttons-container');

            // Failed state - show rerun button
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_FAILED) {
                const rerunButton = new window.ButtonComponent(buttonsContainer, {
                    label: '♻ Retry',
                    onClick: async () => {
                        rerunButton.setDisabled(true);
                        await window.conversations.system_api.queueConversationsResume(this.container, this.conversation.conversation_id);
                        // Trigger callback to refresh list
                        if (this.onAction) {
                            await this.onAction(this.conversation.conversation_id);
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: 'Re-run conversation'
                });
            }
            
            // Running state - show stop button
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_RUNNING || this.conversation.state === window.conversations.CONVERSATION_STATE_PENDING) {
                const stopButton = new window.ButtonComponent(buttonsContainer, {
                    label: '✋ Stop',
                    onClick: async () => {
                        stopButton.setDisabled(true);
                        await window.conversations.system_api.queueConversationsStop(this.container, this.conversation.conversation_id);
                        // Trigger callback to refresh list
                        if (this.onAction) {
                            await this.onAction(this.conversation.conversation_id);
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: 'Stop conversation'
                });
            }
            
            const llmProviderLabel = window.conversations.LLM_PROVIDER_OPTIONS.find(option => option.value === this.conversation.llm_provider).label;

            // Running state - show stop button
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_PENDING && !window.conversations.LLM_PROVIDER_AUTO.includes(this.conversation.llm_provider)) {
                const stopButton = new window.ButtonComponent(buttonsContainer, {
                    label: '🏃‍➡️ Allow ' + llmProviderLabel,
                    onClick: async () => {
                        stopButton.setDisabled(true);
                        await window.conversations.system_api.queueConversationsResume(this.container, this.conversation.conversation_id);
                        // Trigger callback to refresh list
                        if (this.onAction) {
                            await this.onAction(this.conversation.conversation_id);
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: 'Stop conversation'
                });
            }

            // Stopped state - show run button or allow running based on LLM provider
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_STOPPED) {
                const triggerButton = new window.ButtonComponent(buttonsContainer, {
                    label: window.conversations.LLM_PROVIDER_AUTO.includes(this.conversation.llm_provider) ? '🏃‍➡️ Run' : '🏃‍➡️ Allow running - ' + llmProviderLabel,
                    onClick: async () => {
                        triggerButton.setDisabled(true);
                        await window.conversations.system_api.queueConversationsResume(this.container, this.conversation.conversation_id);
                        // new window.AlertComponent('Success', 'Conversation triggered successfully.');
                        // Trigger callback to refresh list
                        if (this.onAction) {
                            await this.onAction(this.conversation.conversation_id);
                        }
                    },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: 'Trigger conversation'
                });
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ConversationButtonsControlComponent = ConversationButtonsControlComponent;
})();