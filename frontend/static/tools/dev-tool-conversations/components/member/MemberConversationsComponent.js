(function () {
    /*
        MemberConversationsComponent: displays conversations for a member in dev-tool-conversations
    */
    class MemberConversationsComponent {
        constructor(container, groupId, member, conversation_type) {
            this.container = container;
            this.groupId = groupId;
            this.member = member
            this.conversation_type = conversation_type;

            // Version number to track refreshes and avoid unnecessary updates
            this._refreshVersion = 0;

            // A dummy element to attach the spinner to when refreshing the list without a specific entry in context
            this.nullElementForSpinner = null;

            // Notification listener for conversations updates - to refresh the list when changes occur
            this._onConversationsUpdate = this.onConversationsUpdate.bind(this);
            this.queueStateListener = window.conversations.notificationHub.addEventListener('conversations-update', this._onConversationsUpdate);

            // Initialize dynamic data variables
            this.groupInstructions = null;
            this.group = null;
            this.conversationsData = null;
            this.showOnlyLastStorageKey = `conversations-show-only-last-${this.groupId}-${this.member.member_id}-${this.conversation_type}`;
            this.showOnlyLast = window.StorageService.getStorageJSON(this.showOnlyLastStorageKey, false);

            // Dynamic UI elements
            this.listContainer = null;
            this.list = null;

            this.page = null;
            this.render();
        }

        async onConversationsUpdate(event) {
            if (event.detail.type !== 'conversations-update') return;

            const changed = event.detail.data.conversations;

            const relevant = changed.some(c =>
                c.group_id === this.groupId &&
                c.conversation_type === this.conversation_type &&
                c.participants.some(p => p.member_id === this.member.member_id)
            );

            if (relevant) {
                console.log('[Conversations Tool] - Conversations update relevant to this member, refreshing list...');
                await this.refresh();
            }
        }

        render() {
            this.nullElementForSpinner = document.createElement('div');
            this.nullElementForSpinner.style.display = 'none'; // Hide the element as it's only used for attaching the spinner

            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container);

            //Create buttons area
            this.createButtonsArea();

            // Load content area with conversation list and filters
            this.createContentArea();

            this.load();
        }

        async load() {
            this.group = await window.conversations.apiGroups.groupsGet(this.container, this.groupId);

            // Fetch group instructions for the specific conversation type
            this.groupInstructions = await window.conversations.apiInstructions.instructionsList(this.container, this.groupId, this.conversation_type);

            // Initial refresh to populate the list immediately
            this.refresh();
        }

        createButtonsArea() {
            // Page buttons
            const buttonContainer = window.conversations.utils.createDivContainer(null, 'conversation-container-horizontal');

            // Create "Start new ..." button text
            let startNewConversationButtonText = window.conversations.CONVERSATION_TYPES_ICONS[this.conversation_type];
            startNewConversationButtonText += ' Start new ';
            startNewConversationButtonText += window.conversations.CONVERSATION_TYPES_STRING(this.conversation_type, false, true, false, false);

            new ToggleButtonComponent(
                buttonContainer,
                this.showOnlyLast,
                async (v) => {
                    if (v) {
                        this.showOnlyLast = true;
                    } else {
                        this.showOnlyLast = false;
                    }
                    window.StorageService.setStorageJSON(this.showOnlyLastStorageKey, this.showOnlyLast);
                    this.refresh();
                },
                'Last per type',
                'All',
                '140px',
                '34px'
            );

            new window.ButtonComponent(buttonContainer, {
                label: startNewConversationButtonText,
                onClick: () => {
                    window.conversations.popups.startConversation(
                        this.group,
                        this.member,
                        this.groupInstructions,
                        this.conversation_type
                    );
                },
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: startNewConversationButtonText
            });

            this.page.updateButtonsArea(buttonContainer);

        }

        createContentArea() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();

            // List container
            this.listContainer = window.conversations.utils.createDivContainer(contentDiv, 'conversation-container-vertical');

            // Update content area
            this.page.updateContentArea(contentDiv);
        }

        async createConversationsList() {
            // Clear previous content
            this.listContainer.innerHTML = '';

            this.list = new window.ListComponent(
                this.listContainer,
                this.conversationsData,
                (conversation) => {
                    const conversationDiv = window.conversations.utils.createDivContainer();
                    new window.conversations.CardMemberConversationComponent(conversationDiv, conversation, this.member, this.groupInstructions[conversation.instructions_key]);
                    return conversationDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                null,
                (item, query) => {
                    return item.participants.map(p => p.member_name).join(", ").toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Creation Date', func: (a, b) => new Date(a.created_at) - new Date(b.created_at), direction: -1 },
                    { label: 'Name', func: (a, b) => { return a.participants < b.participants ? -1 : 1; }, direction: 1 },
                    { label: 'Instruction Type', func: (a, b) => a.instructions_key < b.instructions_key ? -1 : 1, direction: 1 },
                ],
                async () => {
                    // Refresh callback
                    await this.refresh();
                }
            );
        }

        async refresh() {
            const version = ++this._refreshVersion;

            const data =
                await window.conversations.apiConversations.conversationsList(
                    this.nullElementForSpinner,
                    this.groupId,
                    this.member.member_id,
                    this.conversation_type,
                    null,
                    this.showOnlyLast
                );

            if (version !== this._refreshVersion) {
                return;
            }

            if (!_.isEqual(data, this.conversationsData)) {
                this.conversationsData = data;

                if (!this.list) {
                    await this.createConversationsList();
                } else {
                    this.list.updateItems(this.conversationsData);
                }
            }
        }

        destroy() {
            console.log('[Conversations Tool] - 💥 Destroying MemberConversationsComponent and cleaning up resources...');
            window.conversations.notificationHub.removeEventListener('conversations-update', this._onConversationsUpdate);
            if (this.page && this.page.destroy) {
                this.page.destroy();
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberConversationsComponent = MemberConversationsComponent;
})();
