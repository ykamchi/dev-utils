(function () {
    /*
        ConversationsViewComponent: displays conversations for a member in dev-tool-conversations
    */
    class ConversationViewComponent {
        constructor(container, conversationId, member) {
            this.container = container;
            this.conversationId = conversationId;
            this.member = member;

            // Version number to track refreshes and avoid unnecessary updates
            this._refreshVersion = 0;

            // A dummy element to attach the spinner to when refreshing the list without a specific entry in context
            this.nullElementForSpinner = null;

            // Notification listener for conversations updates - to refresh the list when changes occur
            this._onConversationsUpdate = this.onConversationsUpdate.bind(this);
            this.queueStateListener = window.conversations.notificationHub.addEventListener('conversations-update', this._onConversationsUpdate);

            // Initialize dynamic data variables
            this.conversation = null;

            // Dynamic UI elements
            this.menuDiv = null;
            this.menuList = null;

            this.page = null;
            this.render();
        }

        async onConversationsUpdate(event) {
            if (event.detail.type !== 'conversations-update') return;

            const changed = event.detail.data.conversations;

            const relevant = changed.some(
                c => c.conversation_id === this.conversationId
            );

            if (relevant) {
                console.log('[Conversations Tool] - Conversations update relevant to this conversation, refreshing view...');
                await this.refresh();
            }
        }

        render() {
            this.load();
        }

        async load() {
            const data = await window.conversations.apiConversations.conversationsList(this.container, null, null, null, this.conversationId);

            if (!data || data.length === 0) {
                return; // or handle not found
            }

            this.conversation = data[0];

            this.loadContent();
        }

        loadContent() {
            this.nullElementForSpinner = document.createElement('div');
            this.nullElementForSpinner.style.display = 'none'; // Hide the element as it's only used for attaching the spinner

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container,
                window.conversations.CONVERSATION_TYPES_ICONS[this.conversation.info.conversation_type],
                window.conversations.CONVERSATION_TYPES_STRING(this.conversation.info.conversation_type, false, true, true, false) +
                ' - ' +
                this.conversation.info.name +
                ` (${this.conversation.participants.map(p => p.member_name).join(', ')})`,
                {
                    Date: Utils.formatDateTime(this.conversation.created_at),
                    Type: this.conversation.info.name
                }
            );

            // Content area
            const contentDiv = window.conversations.utils.createDivContainer(null, 'conversation-container-vertical');

            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversation-container-horizontal-space-between-full');

            this.menuDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-layout-left', { flex: 0.2 });
            this.rightDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical', { flex: 0.8 });


            // Populate menu
            this.createMenuList();

            // Update the page content
            this.page.updateContentArea(contentDiv);

        }

        createMenuList() {
            const menuItems = [
                {
                    name: 'Conversation Details',
                    icon: '📝',
                    description: 'state, duration, message count ...',
                    populateFunc: this.populateDetailsTab.bind(this)

                },
                // {
                //     name: 'Instructions',
                //     icon: window.conversations.CONVERSATION_TYPES_ICONS[this.conversation.info.conversation_type],
                //     description: 'Conversation instruction details',
                //     populateFunc: this.populateInstructionsTab.bind(this)
                // },
                {
                    name: 'Roles',
                    icon: '📑',
                    description: 'Conversation roles and their details',
                    populateFunc: this.populateRolesTab.bind(this)
                },
                {
                    name: 'Participants',
                    icon: '👥',
                    description: 'Conversation participants',
                    populateFunc: this.populateParticipantsTab.bind(this)
                },
                {
                    name: 'Messages',
                    icon: '📣',
                    description: 'Conversation messages',
                    populateFunc: this.populateMessagesTab.bind(this)
                },
                {
                    name: 'Insights',
                    icon: '🕵🏻',
                    description: 'Members feedback, diagnostics ...',
                    populateFunc: this.populateInsightsTab.bind(this)
                },
            ];

            // Create the menu list
            this.menuList = new window.ListComponent(
                this.menuDiv,
                menuItems,
                (menuItem) => {
                    const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-card-wrapper');

                    // Icon 
                    window.conversations.utils.createReadOnlyText(wrapper, menuItem.icon, 'conversations-list-card-icon');

                    // Info
                    const info = window.conversations.utils.createDivContainer(wrapper, 'conversations-card-info');

                    // Name
                    window.conversations.utils.createReadOnlyText(info, menuItem.name, 'conversations-card-name');

                    // Description
                    window.conversations.utils.createReadOnlyText(info, menuItem.description, 'conversations-card-description');

                    return wrapper;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                async (selectedMenuItem) => {
                    this.menuList.storeLastSelected('conversation-view-menu-list-last-selection', item => item.name);
                    await selectedMenuItem[0].populateFunc();
                }
            );

            this.menuList.setLastSelected('conversation-view-menu-list-last-selection', item => item.name);
        }

        async populateDetailsTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';

            // Prepare details layout
            const wrapper = window.conversations.utils.createDivContainer(this.rightDiv, 'conversations-page-wrapper');
            const splitter = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-horizontal-space-between-full');
            const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });
            const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });

            // Conversation information
            const infoInfoDiv = this.createDetailsDiv(leftDiv, 'watching-information-sign');
            window.conversations.utils.createField(infoInfoDiv, 'Conversation ID:', this.conversation.conversation_id);
            const stateField = window.conversations.utils.createFieldDiv(infoInfoDiv, 'State:', { 'max-width': '120px' });
            window.conversations.utils.createReadOnlyText(stateField, this.conversation.state, 'conversations-badge-state-' + this.conversation.state, 'State');
            const typeField = window.conversations.utils.createFieldDiv(infoInfoDiv, 'Type:', { 'max-width': '120px' });
            window.conversations.utils.createReadOnlyText(typeField, window.conversations.CONVERSATION_TYPES_STRING(this.conversation.conversation_type, true, true, true, false), 'conversations-badge-generic');
            window.conversations.utils.createField(infoInfoDiv, 'Instructions:', this.conversation.info.name);

            // Time information
            const timeInfoDiv = this.createDetailsDiv(leftDiv, this.conversation.state === window.conversations.CONVERSATION_STATE_COMPLETED ? 'wait-completed' : 'wait-unpatiant');
            window.conversations.utils.createField(timeInfoDiv, 'Created At:', Utils.formatDateTime(this.conversation.created_at, true));
            window.conversations.utils.createField(timeInfoDiv, 'Last State At:', Utils.formatDateTime(this.conversation.state_timestamp, true));
            window.conversations.utils.createField(timeInfoDiv, 'Started At:', Utils.formatDateTime(this.conversation.started_at, true));
            window.conversations.utils.createField(timeInfoDiv, 'Completed At:', Utils.formatDateTime(this.conversation.completed_at, true));
            window.conversations.utils.createField(timeInfoDiv, 'Duration:', Utils.durationSecondsToHMS(this.conversation.duration_seconds));

            // Measurements
            const turnsInfoDiv = this.createDetailsDiv(rightDiv, 'measurements');
            const progressField = window.conversations.utils.createFieldDiv(turnsInfoDiv, 'Progress:', { 'min-width': '200px' });
            new window.ProgressBarComponent(progressField, { width: '100%', height: '12px', percentage: 100 * this.conversation.message_count / this.conversation.info.max_turns, label: '' });
            window.conversations.utils.createField(turnsInfoDiv, 'Message count:', this.conversation.message_count, false, { 'min-width': '200px' });
            window.conversations.utils.createField(turnsInfoDiv, 'Max turns:', this.conversation.info.max_turns, false, { 'min-width': '200px' });

            // System information
            const systemInfoDiv = this.createDetailsDiv(rightDiv, 'calculates');
            window.conversations.utils.createField(systemInfoDiv, 'LLM Provider:', this.conversation.llm_provider, false, { 'min-width': '200px' });
            window.conversations.utils.createField(systemInfoDiv, 'LLM Model:', this.conversation.llm_model, false, { 'min-width': '200px' });
            window.conversations.utils.createField(systemInfoDiv, 'Manual:', this.conversation.manual, false, { 'min-width': '200px' });
            window.conversations.utils.createField(systemInfoDiv, 'Debug:', this.conversation.debug, false, { 'min-width': '200px' });

        }

        // Helper function to create a details section with Convy reaction
        createDetailsDiv(container, reaction) {
            const infoDiv = window.conversations.utils.createDivContainer(container, 'conversations-card', { flex: '0.5', 'margin-bottom': '20px' });
            const infoSplitDiv = window.conversations.utils.createDivContainer(infoDiv, 'conversation-container-horizontal-space-between-full', { gap: '96px' });
            new window.conversations.ConvyComponent(infoSplitDiv, { reaction: reaction, width: 160, height: 160 });
            return window.conversations.utils.createDivContainer(infoSplitDiv, 'conversation-container-vertical');
        }

        async populateInstructionsTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';

            const wrapper = window.conversations.utils.createDivContainer(this.rightDiv, 'conversations-page-wrapper');
            window.conversations.utils.createReadOnlyText(wrapper, window.conversations.CONVERSATION_TYPES_STRING(this.conversation.info, true, true, true, false), 'conversations-badge-generic');
        }

        async populateRolesTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';

            const tabs = this.conversation.info.roles.map(role => ({
                name: role.role_name,
                populateFunc: (container) => {
                    // Prepare details layout
                    const wrapper = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
                    const splitter = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-horizontal-space-between-full');
                    const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });
                    const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });

                    window.conversations.utils.createField(leftDiv, 'Role Name:', role.role_name);
                    window.conversations.utils.createField(leftDiv, 'Description:', role.role_description);
                    window.conversations.utils.createField(leftDiv, 'System Prompt:', role.system_prompt);
                    window.conversations.utils.createField(leftDiv, 'Participants (min - max):', role.min + ' - ' + role.max);
                    new window.conversations.ConvyComponent(leftDiv, { reaction: 'thinking-up-left', width: 320, height: 320 });

                    const feedbackField = window.conversations.utils.createFieldDiv(rightDiv, 'Feedback Definitions:');
                    new window.ListComponent(feedbackField, role.feedback_def, (feedback_def) => {
                        const wrapper = window.conversations.utils.createDivContainer(rightDiv);
                        window.conversations.utils.createField(wrapper, 'Name:', feedback_def.name);
                        window.conversations.utils.createField(wrapper, 'Description:', feedback_def.description);
                        window.conversations.utils.createField(wrapper, 'Required:', feedback_def.required);
                        window.conversations.utils.createField(wrapper, 'Type:', feedback_def.type);
                        if (feedback_def.type === 'integer') {
                            window.conversations.utils.createField(wrapper, 'Min Value:', feedback_def.min);
                            window.conversations.utils.createField(wrapper, 'Max Value:', feedback_def.max);
                        } else if (feedback_def.type === 'string') {
                            window.conversations.utils.createField(wrapper, 'Optional Values:', feedback_def['optional-values'].join(', '));
                        }
                        return wrapper;
                    });

                }
            }));
            const storageKey = `conversations-conversation-view-roles-tabset`;
            new window.TabsetComponent(this.rightDiv, tabs, storageKey);

        }

        async populateParticipantsTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';

            const tabs = this.conversation.participants.map(participant => ({
                name: participant.member_name,
                populateFunc: (container) => {
                    const wrapper = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

                    const wrapperDetails = window.conversations.utils.createDivContainer(wrapper, '-');
                    const splitter = window.conversations.utils.createDivContainer(wrapperDetails, 'conversation-container-horizontal-space-between-full');
                    const leftDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });
                    const rightDiv = window.conversations.utils.createDivContainer(splitter, 'conversation-container-vertical', { flex: '0.5' });

                    window.conversations.utils.createField(leftDiv, 'Member ID:', participant.member_id);
                    window.conversations.utils.createField(leftDiv, 'Member Name:', participant.member_name);
                    window.conversations.utils.createField(leftDiv, 'Role:', participant.instruction_role);

                    const feedbackField = window.conversations.utils.createFieldDiv(rightDiv, 'Feedback:');
                    const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role).feedback_def;
                    new window.conversations.ConversationFeedbackInfoComponent(feedbackField, participant.feedback, feedback_def);

                    window.conversations.utils.createLabel(wrapper, 'Member Profile:');
                    const profileField = window.conversations.utils.createDivContainer(wrapper, 'conversation-field-container-vertical-full');
                    window.conversations.utils.createJsonDiv(profileField, participant.member_profile);


                }
            }));
            const storageKey = `conversations-conversation-view-participants-tabset`;
            new window.TabsetComponent(this.rightDiv, tabs, storageKey);

        }

        async populateMessagesTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';
            if (!this.messages) {
                this.messages = await window.conversations.apiConversations.conversationsMessages(this.rightDiv, this.conversation.conversation_id);
            }

            new window.ListComponent(this.rightDiv, this.messages, 
                (message) => {
                    const messageDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardConversationMessageComponent(messageDiv, message, this.conversation);
                    return messageDiv;
                },
                window.ListComponent.SELECTION_MODE_NONE,
                null,
                (item, query) => {
                    return item.message_text.toLowerCase().includes(query.toLowerCase()) || 
                    item.member_name.toLowerCase().includes(query.toLowerCase());
                },
                null,
                async () => {
                    this.messages = await window.conversations.apiConversations.conversationsMessages(this.rightDiv, this.conversation.conversation_id);
                }

            );

        }

        async populateInsightsTab() {
            // Clear previous content
            this.rightDiv.innerHTML = '';
            // Fetch messages from API if not already fetched
            if (!this.messages) {
                this.messages = await window.conversations.apiConversations.conversationsMessages(this.nullElementForSpinner, this.conversation.conversation_id);
            }

            new window.conversations.charts.ChartConversationFeedbackProgressComponent(this.rightDiv, this.conversation, this.messages);

        }

        async refresh() {
            // Menu is not populated yet, no need to refresh
            if (!this.menuList) return;

            const version = ++this._refreshVersion;

            const data = await window.conversations.apiConversations.conversationsList(this.nullElementForSpinner, null, null, null, this.conversationId);
            
            this.messages = await window.conversations.apiConversations.conversationsMessages(this.nullElementForSpinner, this.conversation.conversation_id);
            
            if (version !== this._refreshVersion) {
                return;
            }

            if (!data || data.length === 0) {
                return;
            }

            this.conversation = data[0];

            console.log(this.menuList.getSelectedItems());
            const selected = this.menuList.getSelectedItems();
            if (selected.length > 0) {
                await selected[0].populateFunc();
            }
        }

        destroy() {
            console.log('[Conversations Tool] - 💥 Destroying ConversationsViewComponent and cleaning up resources...');
            window.conversations.notificationHub.removeEventListener('conversations-update', this._onConversationsUpdate);
            if (this.page && this.page.destroy) {
                this.page.destroy();
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ConversationViewComponent = ConversationViewComponent;
})();
