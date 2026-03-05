(function () {
    /*
        SystemQueueListComponent - Displays queue entries with filters
    */
    class SystemQueueListComponent {
        constructor(container) {
            this.container = container;
            
            // A dummy element to attach the spinner to when refreshing the list without a specific entry in context
            this.nullElementForSpinner = null;
            
            // Notification listener for conversations updates - to refresh the list when changes occur
            this._onConversationsUpdate = this.onConversationsUpdate.bind(this);
            this.queueStateListener = window.conversations.notificationHub.addEventListener('conversations-update', this._onConversationsUpdate);

            // Notification listener for queue state updates - to refresh the queue state when changes occur
            this._onQueueStateUpdate = this.onQueueStateUpdate.bind(this);
            this.queueStateListener = window.conversations.notificationHub.addEventListener('queue-state', this._onQueueStateUpdate);
            
            // Initialize dynamic data variables
            this.queueData = null; 
            this.queueState = null;
            this.filters = { state: [], conversation_type: [], llm_provider: [],  llm_model: [], group_id: [] };

            // Dynamic UI elements
            this.listContainer = null;
            this.list = null;

            this.page = null;
            this.render();
        }

        async onConversationsUpdate(event) {
            this.refresh()
        }
        
        async onQueueStateUpdate(event) {
            if (event.detail.type !== 'queue-state') return;
            // Update local queue state with the new data
            this.queueState = event.detail.data; 
            console.log('[Conversations Tool] - SystemQueueListComponent Received queue state update notification:', event.detail.data);
            this.queueState = await window.conversations.system_api.queueState(this.container);
            this.createButtonsArea();
        }

        render() {
            this.nullElementForSpinner = document.createElement('div');
            this.nullElementForSpinner.style.display = 'none'; // Hide the element as it's only used for attaching the spinner

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container, '📋', 'Queue Entries', 'System');

            // Load content area with queue list and filters
            this.createContentArea();

            this.load();
        }

        async load() {
            // Fetch queue state
            this.queueState = await window.conversations.system_api.queueState();

            //Create buttons area
            this.createButtonsArea();

            // Initial refresh to populate the list immediately
            this.refresh(); 
        }

        async createButtonsArea() {
            // Page buttons
            const buttonContainer = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');

            // Queue state toggle
            new window.ToggleButtonComponent(
                buttonContainer,
                !this.queueState.paused,
                async (v) => {
                    if (v) {
                        await window.conversations.system_api.queueResume(this.container);
                    } else {
                        await window.conversations.system_api.queuePause(this.container);
                    }
                    await this.createButtonsArea();
                },
                'Active',
                'Paused',
                '140px',
                '32px'
            );

            // Update control area
            this.page.updateButtonsArea(buttonContainer);
        }

        async createContentArea() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(contentDiv, 'conversations-page-wrapper');
            
            // Queue Entries Section
            const queueEntriesDiv = window.conversations.utils.createDivContainer(wrapper, 'conversation-field-container-vertical-full');
            
            // Horizontal split: filters on left, list on right
            const horizontalSplit = window.conversations.utils.createDivContainer(queueEntriesDiv, 'conversation-container-horizontal-space-between-full');
            
            // Left side - filters
            const filtersContainer = window.conversations.utils.createDivContainer(horizontalSplit, 'conversation-container-vertical', { flex: 0.2 });
            this.renderFilters(filtersContainer);
            
            // Right side - list
            this.listContainer = window.conversations.utils.createDivContainer(horizontalSplit, 'conversation-container-vertical', { flex: 0.8 });

            // Update content area
            this.page.updateContentArea(contentDiv);
        }

        async createQueueList(queueData) {
            // Clear previous content
            this.listContainer.innerHTML = ''; 

            this.list = new window.ListComponent(
                this.listContainer,
                queueData,
                (entry) => {
                    const entryContainer = window.conversations.utils.createDivContainer(null);
                        new window.conversations.CardQueueEntryComponent(entryContainer, entry, async (conversation_id) => {
                            await this.refresh(); // Refresh the list after an action is taken on an entry
                        });
                    return entryContainer;
                },
                window.ListComponent.SELECTION_MODE_NONE,
                null,
                (item, query) => {
                    // Text filter - search in conversation_type, status, llm_provider, and error_message
                    const searchText = query.toLowerCase();
                    return (
                        (item.info.conversation_type && item.info.conversation_type.toLowerCase().includes(searchText)) ||
                        (item.state && item.state.toLowerCase().includes(searchText)) ||
                        (item.llm_provider && item.llm_provider.toLowerCase().includes(searchText)) ||
                        (item.error_message && item.error_message.toLowerCase().includes(searchText))
                    );
                },
                [
                    { label: 'Created', func: (a, b) => new Date(a.created_at) - new Date(b.created_at), direction: -1 },
                    { label: 'State', func: (a, b) => (a.state || '') < (b.state || '') ? -1 : 1, direction: 1 },
                    { label: 'Type', func: (a, b) => (a.info.conversation_type || '') < (b.info.conversation_type || '') ? -1 : 1, direction: 1 },
                    { label: 'Provider', func: (a, b) => (a.llm_provider || '') < (b.llm_provider || '') ? -1 : 1, direction: 1 }
                ],
                async () => {
                    // Refresh callback
                    await this.createQueueList();
                }
            );
        }

        renderFilters(container) {
            // State filter
            const statusDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(statusDiv, 'State:');
            new window.OptionButtonsComponent(statusDiv, {
                options: window.conversations.CONVERSATION_STATE_OPTIONS,
                selected: this.filters.state,
                onChange: async (selected) => {
                    this.filters.state = selected;
                    await this.list.updateItems(this.filterQueueData());
                },
                multiSelect: true,
                viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
            });
            
            // Conversation Type filter
            const conversationTypeDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(conversationTypeDiv, 'Conversation Type:');
            new window.OptionButtonsComponent(conversationTypeDiv, {
                options: window.conversations.CONVERSATION_TYPES_OPTIONS,
                selected: this.filters.conversation_type,
                onChange: async (selected) => {
                    this.filters.conversation_type = selected;
                    await this.list.updateItems(this.filterQueueData());
                },
                multiSelect: true,
                viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
            });
            
            // LLM Provider filter
            const llmProviderDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(llmProviderDiv, 'LLM Provider:');
            new window.OptionButtonsComponent(llmProviderDiv, {
                options: Object.values(window.conversations.LLM_PROVIDER_OPTIONS).map(opt => ({ label: opt.label, value: opt.value })),
                selected: this.filters.llm_provider,
                onChange: async (selected) => {
                    this.filters.llm_provider = selected;
                    await this.list.updateItems(this.filterQueueData());
                },
                multiSelect: true,
                viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
            });

            // LLM Model filter
            const llmModelDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(llmModelDiv, 'LLM Model:');
            new window.OptionButtonsComponent(llmModelDiv, {
                options: Object.values(window.conversations.LLM_PROVIDER_OPTIONS).flatMap(opt => opt.models.map(model => ({ label: model, value: model }))),
                selected: this.filters.llm_model,
                onChange: async (selected) => {
                    this.filters.llm_model = selected;
                    await this.list.updateItems(this.filterQueueData());
                },
                multiSelect: true,
                viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
            });
        }

        async refresh() {
            // Fetch latest queue entries
            const newQueueData = await window.conversations.apiConversations.conversationsList(this.nullElementForSpinner);

            // Check if items have changed by some other method - if so, we need to update the entire list data source
            if (!this.queueData || !_.isEqual(newQueueData, this.queueData)) {
                this.queueData = newQueueData;
                if (!this.list) {
                    await this.createQueueList(this.filterQueueData());
                    return;
                }
                // Update the list with new data
                this.list.updateItems(this.filterQueueData());
            }
        }

        filterQueueData() {
            let queueData = _.cloneDeep(this.queueData); // Clone the data to avoid mutating original
            if (this.filters.conversation_type.length > 0) {
                queueData = queueData.filter(entry => this.filters.conversation_type.includes(entry.info.conversation_type));
            }
            if (this.filters.state.length > 0) {
                queueData = queueData.filter(entry => this.filters.state.includes(entry.state));
            }
            if (this.filters.llm_provider.length > 0) {
                queueData = queueData.filter(entry => this.filters.llm_provider.includes(entry.llm_provider));
            }
            if (this.filters.llm_model.length > 0) {
                queueData = queueData.filter(entry => this.filters.llm_model.includes(entry.llm_model));
            }
            return queueData;
        }
        destroy() {
            console.log('Destroying SystemQueueListComponent and cleaning up resources');
            window.conversations.notificationHub.removeEventListener('conversations-update', this._onConversationsUpdate);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.SystemQueueListComponent = SystemQueueListComponent;
})();
