(function () {
    /*
        MemberConversationDetailsComponent: displays details for a conversation in dev-tool-conversations
        Usage: new window.conversations.MemberConversationDetailsComponent(container, conversation, groupInstructions)
    */
    class MemberConversationDetailsComponent {
        constructor(container, conversation, memberId, membersMap, groupInstructions) {
            this.container = container;
            this.conversation = conversation;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.groupInstructions = groupInstructions;
            this.feedbackDefMap = this.groupInstructions[this.conversation.context.type]?.feedback_def;
            this.page = null;
            this.contentDiv = null;
            this.render();
        }

        render() {

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, 
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversation.info.conversation_type],
                window.conversations.CONVERSATION_TYPES_STRING(this.conversation.info.conversation_type, false, true, true, false) + 
                ' - ' + 
                this.conversation.info.name +
                ` (${this.conversation.names})`,
                {
                    'Viewing member': this.membersMap[this.memberId].name,
                    Date: Utils.formatDateTime(this.conversation.created_at),
                    Type: this.conversation.info.name
                }
            );

            // Page control
            this.page.updateControlArea(null);

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            this.page.updateButtonsArea(buttonsDiv);

            // Page content
            this.contentDiv = window.conversations.utils.createDivContainer();

            const wrapperDiv = window.conversations.utils.createDivContainer(this.contentDiv, 'conversation-container-vertical');

            const instructionDescriptionLine = window.conversations.utils.createDivContainer(wrapperDiv, 'conversation-field-container-vertical');

            // Instruction description
            const instructionDescriptionDiv = window.conversations.utils.createDivContainer(instructionDescriptionLine);
            window.conversations.utils.createLabel(instructionDescriptionDiv, 'Instruction description:');
            window.conversations.utils.createReadOnlyText(instructionDescriptionDiv, this.conversation.info.description, 'conversations-field-value');

            this.page.updateContentArea(this.contentDiv);

            // Queue info container
            const statusDiv = window.conversations.utils.createDivContainer(wrapperDiv, 'conversation-container-horizontal');

            //total duration
            const durationDiv = window.conversations.utils.createDivContainer(statusDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(durationDiv, 'Total duration:');
            window.conversations.utils.createReadOnlyText(durationDiv, Utils.durationSecondsToHMS(this.conversation.status?.duration_seconds), 'conversations-badge-generic', 'Duration');

            //message count
            const messageCountDiv = window.conversations.utils.createDivContainer(statusDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(messageCountDiv, 'Message count:');
            window.conversations.utils.createReadOnlyText(messageCountDiv, this.conversation.status?.message_count?.toString() || '0', 'conversations-badge-generic', 'Message Count');


            // Queue info container
            const queueInfoDiv = window.conversations.utils.createDivContainer(wrapperDiv, 'conversation-container-horizontal');

            // Queue status
            const queueStatusDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(queueStatusDiv, 'Queue status:');
            window.conversations.utils.createReadOnlyText(queueStatusDiv, this.conversation.queue_info.status, 'conversations-badge-state-' + this.conversation.queue_info.status);

            // Queued at
            const queuedAtDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(queuedAtDiv, 'Queued at:');
            const queuedAtText = this.conversation.queue_info.queued_at ? Utils.formatDateTime(this.conversation.queue_info.queued_at) : 'N/A';
            window.conversations.utils.createReadOnlyText(queuedAtDiv, queuedAtText, 'conversations-field-value');

            if (this.conversation.queue_info.position) {
                // Position in queue
                const positionDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(positionDiv, 'Position in queue:');
                window.conversations.utils.createReadOnlyText(positionDiv, this.conversation.queue_info.position.toString(), 'conversations-field-value');
            }

            if (this.conversation.queue_info.started_at) {
                // Started at
                const startedAtDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(startedAtDiv, 'Started at:');
                const startedAtText = Utils.formatDateTime(this.conversation.queue_info.started_at);
                window.conversations.utils.createReadOnlyText(startedAtDiv, startedAtText, 'conversations-field-value');
            }

            if (this.conversation.queue_info.completed_at) {
                // Completed at
                const completedAtDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(completedAtDiv, 'Completed at:');
                const completedAtText = Utils.formatDateTime(this.conversation.queue_info.completed_at);
                window.conversations.utils.createReadOnlyText(completedAtDiv, completedAtText, 'conversations-field-value');
            }

            if  (this.conversation.queue_info.error_message) {
                // Error message
                const errorMessageDiv = window.conversations.utils.createDivContainer(queueInfoDiv, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(errorMessageDiv, 'Error message:');
                window.conversations.utils.createReadOnlyText(errorMessageDiv, this.conversation.queue_info.error_message, 'conversations-field-value');
            }   


            this.tabsDiv = window.conversations.utils.createDivContainer(wrapperDiv);

            // Tabs container
            const tabs = [
                { name: 'Feedback', populateFunc: (container) => this.populateFeedbackTab(container) },
                { name: 'Messages', populateFunc: (container) => this.populateMessagesTab(container) },
                { name: 'Diagnostics', populateFunc: (container) => { window.conversations.utils.createReadOnlyText(container, 'Diagnostics content not implemented yet'); } }
            ];
            const storageKey = this.member ? `conversations-member-tabset` : '';
            new window.TabsetComponent(this.tabsDiv, tabs, storageKey);

        }

        async populateMessagesTab(container) {
            const messages = await window.conversations.api.fetchConversationMessages(container, this.conversation.conversation_id);

            new window.ListComponent(container, messages, (message) => {
                const messageDiv = window.conversations.utils.createDivContainer();
                new window.conversations.CardConversationMessageComponent(messageDiv, message, this.groupInstructions[this.conversation.context.type]);
                return messageDiv;
            });

        }

        populateFeedbackTab(container) {

            // Feedback info
            new window.conversations.ConversationFeedbackInfoComponent(container, this.conversation.feedback, this.groupInstructions[this.conversation.context.type], false, true);

            // Decision response for AI_DECISION conversations
            if (this.conversation.info.conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
                const decisionResponseDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(decisionResponseDiv, 'Decision Response:');
                window.conversations.utils.createReadOnlyText(decisionResponseDiv, this.conversation.response);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationDetailsComponent = MemberConversationDetailsComponent;
})();
