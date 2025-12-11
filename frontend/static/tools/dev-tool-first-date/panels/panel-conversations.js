window.panel_conversations = {
    name: 'Conversations',

    icon: '💬',

    description: 'List of conversations and detail view',

    async onExpand() {
        console.log('[Conversations Panel] Expanded');
    },

    async onCollapse(collapsedStatusContainer) {
        console.log('[Conversations Panel] Collapsed');
    },

    expandModeButtons: [],

    collapseModeButtons: [],

    // Initialize the panel
    async init(container, headerStatusContainer) {
        this.container = container;
        this.headerStatus = headerStatusContainer;

        this.conversationsListElement = this.container.querySelector('#conversationsList');
        this.searchInput = this.container.querySelector('#conversationsSearch');

        this._onSearchInput = () => this.renderList();
        if (this.searchInput) this.searchInput.addEventListener('input', this._onSearchInput);

        // Load conversations
        this.loadConversations();
    },

    destroy() {
        if (this.searchInput) this.searchInput.removeEventListener('input', this._onSearchInput);
        if (this.container) this.container.innerHTML = '';
    },

    render() {
        return `
            <div class="dev-tool-first-date class1">
                <div class="first-date-body">
                    <div class="first-date-split-container">
                        <div class="first-date-left-panel">
                            <div class="search-container">
                                <span class="search-icon">🔍</span>
                                <input id="conversationsSearch" placeholder="Search conversations" />
                            </div>
                            <ul id="conversationsList" class="members-list"></ul>
                        </div>
                        <div class="first-date-right-panel">
                            <div id="conversationDetails" class="first-date-conversation-details"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Load conversations from backend
    async loadConversations() {
        // Fetch conversations
        const res = await fetch('/api/dev-tool-first-date/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: 'first-date', context: { type: 'first-date' } })
        });
        
        const data = await res.json();
        
        if (data && data.success && Array.isArray(data.conversations)) {
            // Sort conversations by created_at descending
            this.conversations = data.conversations.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });

            // Render the list
            this.renderList();

            // Restore last selected conversation if available, else select first
            const toolState = window.StorageService.getToolState('dev-tool-first-date', {});
            const lastSelectedId = toolState.lastSelectedConversationId;
            let conversationToSelect = null;
            if (lastSelectedId && this.conversations.some(c => String(c.conversation_id) === String(lastSelectedId))) {
                conversationToSelect = lastSelectedId;
            } else if (this.conversations.length > 0) {
                conversationToSelect = this.conversations[0].conversation_id;
            }
            if (conversationToSelect) {
                this.showConversation(conversationToSelect, { scroll: true });
            }

        } else {
            this.conversations = [];
            this.renderList();
        }
    },

    renderList() {
        if (!this.conversationsListElement) return;

        // Apply search filter
        const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const filtered = (this.conversations || []).filter(c => {
            if (!q) return true;
            // Use member_nick_name for search
            const members = (c.members || []).map(m => m.member_nick_name || '').join(' ').toLowerCase();
            const created = (c.created_at || '').toLowerCase();
            return members.includes(q) || created.includes(q);
        });

        this.conversationsListElement.innerHTML = '';
        for (const c of filtered) {
            const li = document.createElement('li');
            li.className = 'member-item';
            li.dataset.id = c.conversation_id;
            const title = (c.members || []).map(m => m.member_nick_name || '').join(' & ');
            // Build DOM using createElement
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar';
            avatarDiv.textContent = '💬';
            const infoDiv = document.createElement('div');
            infoDiv.className = 'member-info';
            const nameDiv = document.createElement('div');
            nameDiv.className = 'member-name';
            nameDiv.textContent = title;
            const metaDiv = document.createElement('div');
            metaDiv.className = 'member-meta';
            metaDiv.textContent = Utils.formatDateTime(c.created_at);
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(metaDiv);
            li.appendChild(avatarDiv);
            li.appendChild(infoDiv);
            li.addEventListener('click', () => this.showConversation(c.conversation_id));
            this.conversationsListElement.appendChild(li);
        }

        if (filtered.length === 0) {
            this.conversationsListElement.innerHTML = '<li class="empty">🔍 No conversation found</li>';
        }
    },

    async showConversation(id, opts = {}) {
        const conversation = (this.conversations || []).find(c => String(c.conversation_id) === String(id));
        if (!conversation) return;

        // Persist selection
        const toolState = window.StorageService.getToolState('dev-tool-first-date', {});
        window.StorageService.setToolState('dev-tool-first-date', {
            ...toolState,
            lastSelectedConversationId: conversation.conversation_id
        });

        // Update selection state in list and scroll if needed
        if (this.conversationsListElement) {
            const items = this.conversationsListElement.querySelectorAll('.member-item');
            items.forEach(item => {
                if (String(item.dataset.id) === String(id)) {
                    item.classList.add('selected');
                    if (opts.scroll) {
                        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        this.conversationDetailsElement = this.container.querySelector('#conversationDetails');

        // Instantiate the component, which now fetches its own data
        if (window.ConversationDetailsComponent) {
            new window.ConversationDetailsComponent(this.conversationDetailsElement, conversation);
        } else {
            this.conversationDetailsElement.innerHTML = '<p class="error">ConversationDetailsComponent not loaded.</p>';
        }
    },
};

