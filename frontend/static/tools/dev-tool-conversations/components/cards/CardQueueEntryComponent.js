(function () {
    /*
        CardQueueEntryComponent: Displays a single queue entry card
    */
    class CardQueueEntryComponent {
        constructor(container, conversation, onAction) {
            this.container = container;
            this.conversation = conversation;
            this.onAction = onAction; // Callback when an action is performed
            this.render();
        }

        render() {
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');
            
            // Icon based on state
            const statusIcon = window.conversations.CONVERSATION_STATE_ICONS[this.conversation.state] || '❓';
            window.conversations.utils.createReadOnlyText(wrapper, statusIcon, 'conversations-list-card-icon');
            
            // Info
            const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');
            
            // Name (conversation type + status)
            const nameText = `${window.conversations.CONVERSATION_TYPES_STRING(this.conversation.info.conversation_type, true, true, true, false) || 'N/A'} - ${this.conversation.state}`;
            window.conversations.utils.createReadOnlyText(info, nameText, 'conversations-card-name');
            
            // Description (group, provider, created at)
            const descriptionParts = [];
            if (this.conversation.conversation_id) {
                descriptionParts.push(`ID: ${this.conversation.conversation_id}`);
            }
            if (this.conversation.group_id) {
                descriptionParts.push(`Group: ${this.conversation.group_id}`);
            }
            if (this.conversation.llm_provider) {
                descriptionParts.push(this.conversation.llm_provider);
            }
            if (this.conversation.created_at) {
                descriptionParts.push(new Date(this.conversation.created_at).toLocaleString());
            }
            
            if (descriptionParts.length > 0) {
                window.conversations.utils.createReadOnlyText(info, descriptionParts.join(' • '), 'conversations-card-description');
            }
            
            // Show error message if exists
            if (this.conversation.error_message) {
                window.conversations.utils.createReadOnlyText(info, `Error: ${this.conversation.error_message}`, 'conversations-card-description');
            }
            
            // Add action buttons based on state
            this.addActionButtons(wrapper);
        }

        addActionButtons(wrapper) {
            const buttonsContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');
            // Failed state - show rerun button
            if (this.conversation.state === 'failed') {
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
            
            // Stopped state - show run button
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_STOPPED) {
                const triggerButton = new window.ButtonComponent(buttonsContainer, {
                    label: '🏃‍➡️ Run',
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


            // Failed state - show run button
            if (this.conversation.state === window.conversations.CONVERSATION_STATE_FAILED) {
                const triggerButton = new window.ButtonComponent(buttonsContainer, {
                    label: '🏃‍➡️ Run',
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

            window.conversations.utils.createReadOnlyText(buttonsContainer, this.conversation.status, 'conversations-card-actions-label');

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.CardQueueEntryComponent = CardQueueEntryComponent;
})();
