(function () {
    /*
        MemberConversationDetailsComponent: displays details for a conversation in dev-tool-conversations
        Usage: new window.conversations.MemberConversationDetailsComponent(container, conversation, groupInstructions)
    */
    class MemberConversationDetailsComponent {
        constructor(container, conversation, member, instructions) {
            this.container = container;
            this.conversation = conversation;
            this.member = member;
            this.instructions = instructions;
            // this.feedbackDefMap = this.instructions[this.conversation.context.type].feedback_def;
            this.page = null;
            this.contentDiv = null;
            this.chartInstance = null;
            this.messages = null;
            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container,
                window.conversations.CONVERSATION_TYPES_ICONS[this.instructions.info.conversation_type],
                window.conversations.CONVERSATION_TYPES_STRING(this.instructions.info.conversation_type, false, true, true, false) +
                ' - ' +
                this.instructions.info.name +
                ` (${this.conversation.participants})`,
                {
                    'Viewing member': this.member.name,
                    Date: Utils.formatDateTime(this.conversation.created_at),
                    Type: this.instructions.info.name
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
            window.conversations.utils.createField(instructionDescriptionLine, 'Instruction description:', this.instructions.info.description);

            this.page.updateContentArea(this.contentDiv);

            // Tabs Div
            this.tabsDiv = window.conversations.utils.createDivContainer(wrapperDiv);

            // Tabs container
            const tabs = [ { name: 'Feedback', populateFunc: async (container) => this.populateFeedbackTab(container) } ];
            if (this.instructions.info.conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
                tabs.push({ name: 'Messages', populateFunc: async (container) => this.populateMessagesTab(container) });
                tabs.push({ name: 'Diagnostics', populateFunc: async (container) => this.populateFeedbackProgressTab(container) });                        
            } else {
                tabs.push({ name: 'Response', populateFunc: async (container) => this.populateResponseTab(container) });
            }

            tabs.push({ name: 'State', populateFunc: async (container) => this.populateStateTab(container) });

            const storageKey = this.member ? `conversations-member-tabset` : '';
            new window.TabsetComponent(this.tabsDiv, tabs, storageKey);

        }

        async populateStateTab(container) {
            // Queue info container
            const statusDiv = window.conversations.utils.createDivContainer(container, 'conversation-container-horizontal');

            //total duration
            window.conversations.utils.createField(statusDiv, 'Total duration:', Utils.durationSecondsToHMS(this.conversation.status?.duration_seconds));

            //message count
            window.conversations.utils.createField(statusDiv, 'Message count:', this.conversation.status?.message_count?.toString() || '0');

            // Queue info container
            const queueInfoDiv = window.conversations.utils.createDivContainer(container, 'conversation-container-horizontal');

            // Queue status
            window.conversations.utils.createBadge(queueInfoDiv, 'Queue status:', this.conversation.queue_info.status, 'state-' + this.conversation.queue_info.status);

            // Queued at
            if (this.conversation.queue_info.queued_at) {
                window.conversations.utils.createField(queueInfoDiv, 'Queued at:', Utils.formatDateTime(this.conversation.queue_info.queued_at));
            }

            if (this.conversation.queue_info.position) {
                // Position in queue
                window.conversations.utils.createField(queueInfoDiv, 'Position in queue:', this.conversation.queue_info.position.toString());
            }

            if (this.conversation.queue_info.started_at) {
                // Started at
                window.conversations.utils.createField(queueInfoDiv, 'Started at:', Utils.formatDateTime(this.conversation.queue_info.started_at));
            }

            if (this.conversation.queue_info.completed_at) {
                // Completed at
                window.conversations.utils.createField(queueInfoDiv, 'Completed at:', Utils.formatDateTime(this.conversation.queue_info.completed_at));
            }

            if (this.conversation.queue_info.error_message) {
                // Error message
                window.conversations.utils.createField(queueInfoDiv, 'Error message:', this.conversation.queue_info.error_message);
            }


        }

        async populateMessagesTab(container) {
            // Fetch messages from API if not already fetched
            if(!this.messages) {
                this.messages = await window.conversations.apiConversations.conversationsMessages(container, this.conversation.conversation_id);
            }
            
            new window.ListComponent(container, this.messages, (message) => {
                const messageDiv = window.conversations.utils.createDivContainer();
                new window.conversations.CardConversationMessageComponent(messageDiv, message, this.instructions);
                return messageDiv;
            });

        }

        async populateResponseTab(container) {
            window.conversations.utils.createField(container, 'Decision Response:', this.conversation.response, true);
        }

        async populateFeedbackTab(container) {
            // Feedback info
            new window.conversations.ConversationFeedbackInfoComponent(container, this.conversation.feedback, this.instructions);
        }

        async populateFeedbackProgressTab(container) {
            // Fetch messages from API if not already fetched
            if(!this.messages) {
                this.messages = await window.conversations.apiConversations.conversationsMessages(container, this.conversation.conversation_id);
            }

            new window.conversations.charts.ChartConversationFeedbackProgressComponent(container, this.instructions.feedback_def, this.messages);
        }

        destroy() {
            if (this.chartInstance && typeof this.chartInstance.destroy === 'function') {
                try { this.chartInstance.destroy(); } catch (e) { }
            }
            this.chartInstance = null;
        }

    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationDetailsComponent = MemberConversationDetailsComponent;
})();
