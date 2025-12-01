// Panel: Conversations - split list/details panel (left: conversations-list, right: conversationDetails)
// Minimal implementation: split layout only, both sides empty for now.
window.panel_conversations = {
    name: 'Conversations',
    icon: '💬',
    description: 'List of conversations and detail view',

    // Initialize the panel
    init(container, headerStatusContainer) {
        console.log('[panel_conversations] init');
        this.container = container;
        this.headerStatus = headerStatusContainer;

        // elements will be found after render is inserted into DOM
        this.listEl = null;
        this.searchInput = null;
        this.detailsEl = null;
        this.conversations = [];
        this.currentConversation = null;
        this.speechState = {
            messages: [],
            currentIndex: 0,
            isPlaying: false,
            startTime: 0,
            utterance: null
        };

        this._onSearchInput = () => this.renderList();

        // Attempt to bind after a short delay in case render isn't inserted immediately
        setTimeout(() => {
            if (!this.container) return;
            this.listEl = this.container.querySelector('#conversationsList');
            this.searchInput = this.container.querySelector('#conversationsSearch');
            this.detailsEl = this.container.querySelector('#conversationDetails');

            if (this.searchInput) this.searchInput.addEventListener('input', this._onSearchInput);

            // Load conversations
            this.loadConversations();
        }, 0);
    },

    destroy() {
        console.log('[panel_conversations] destroy');
        if (this.searchInput) this.searchInput.removeEventListener('input', this._onSearchInput);
        if (this.container) this.container.innerHTML = '';
        window.speechSynthesis.cancel();
    },

    // Buttons for collapsed/expanded modes
    collapseModeButtons: [
        {
            callback: function() { this.loadConversations(); },
            title: 'Refresh Conversations',
            icon: '🔄'
        }
    ],
    expandModeButtons: [],

    async onExpand() {
        if (this.headerStatus) this.headerStatus.textContent = '';
    },

    async onCollapse(collapsedStatusContainer) {
        // Update collapsed status with count
        this.collapsedStatusContainer = collapsedStatusContainer;
        const count = (this.conversations && this.conversations.length) || 0;
        if (collapsedStatusContainer) {
            collapsedStatusContainer.textContent = `💬 ${count}`;
            collapsedStatusContainer.title = `${count} conversations`;
        }
    },

    render() {
        return `
        <div class="dev-tool-first-date">
            <div class="tool-body">
                <div class="split-container">
                    <div class="left-panel">
                        <div class="search-container">
                            <span class="search-icon">🔍</span>
                            <input id="conversationsSearch" placeholder="Search conversations" />
                        </div>
                        <ul id="conversationsList" class="members-list"></ul>
                    </div>

                    <div class="right-panel">
                        <div id="conversationDetails" class="conversation-details empty">
                            <p>Select a conversation to view details.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // Load conversations from backend
    async loadConversations() {
        try {
            const res = await fetch('/api/dev-tool-first-date/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date' })
            });
            const data = await res.json();
            if (data && data.success && Array.isArray(data.conversations)) {
                this.conversations = data.conversations;
                this.renderList();
                // update collapsed status if present
                if (this.collapsedStatusContainer) {
                    this.collapsedStatusContainer.textContent = `💬 ${this.conversations.length}`;
                    this.collapsedStatusContainer.title = `${this.conversations.length} conversations`;
                }
            } else {
                // If upstream returned an unexpected payload, fall back to a small
                // client-side placeholder dataset so the UI shows cards for
                // development/demo purposes. This does NOT change server logic.
                console.warn('Unexpected conversations response (using placeholder sample data)', data);
                this.conversations = [
                    { conversation_id: 'sample-1', created_at: 'offline', members: ['Ben', 'Chloe'] },
                    { conversation_id: 'sample-2', created_at: 'offline', members: ['Sarah', 'Alex'] },
                    { conversation_id: 'sample-3', created_at: 'offline', members: ['Ben', 'David'] }
                ];
                this.renderList();
                if (this.listEl) this.listEl.insertAdjacentHTML('beforeend', '<li class="note">(showing sample data — backend returned unexpected payload)</li>');
            }
        } catch (e) {
            // Network/upstream error — show client-side placeholder data so the
            // panel renders cards while offline.
            console.error('Error fetching conversations (using placeholder data):', e);
            this.conversations = [
                { conversation_id: 'sample-1', created_at: 'offline', members: ['Ben', 'Chloe'] },
                { conversation_id: 'sample-2', created_at: 'offline', members: ['Sarah', 'Alex'] },
                { conversation_id: 'sample-3', created_at: 'offline', members: ['Ben', 'David'] }
            ];
            this.renderList();
            if (this.listEl) this.listEl.insertAdjacentHTML('beforeend', '<li class="note">(showing sample data — failed to contact backend)</li>');
        }
    },

    renderList() {
        if (!this.listEl) return;
        const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const filtered = (this.conversations || []).filter(c => {
            if (!q) return true;
            const members = (c.members || []).join(' ').toLowerCase();
            const created = (c.created_at || '').toLowerCase();
            return members.includes(q) || created.includes(q);
        });

        this.listEl.innerHTML = '';
        for (const c of filtered) {
            const li = document.createElement('li');
            li.className = 'member-item';
            li.dataset.id = c.conversation_id;
            const title = (c.members || []).join(' & ');
            
            let time = c.created_at || '';
            if (time && time !== 'offline') {
                try {
                    const d = new Date(time);
                    if (!isNaN(d.getTime())) {
                        const pad = (n) => n.toString().padStart(2, '0');
                        time = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
                    }
                } catch (e) {
                    // keep original if parse fails
                }
            }

            // Use the same markup/classes as members list items so styling is shared
            // Include an avatar and a member-info wrapper so the visual card styling
            // (avatar + info column) matches the members list.
            li.innerHTML = `
                <div class="avatar">💬</div>
                <div class="member-info">
                    <div class="member-name">${title}</div>
                    <div class="member-meta">${time}</div>
                </div>
            `;
            li.addEventListener('click', () => this.showConversation(c.conversation_id));
            this.listEl.appendChild(li);
        }

        if (filtered.length === 0) {
            this.listEl.innerHTML = '<li class="empty">No conversations</li>';
        }
    },

    async showConversation(id) {
        // Stop any ongoing speech when switching conversations
        window.speechSynthesis.cancel();
        this.speechState.isPlaying = false;
        this.speechState.currentIndex = 0;
        this.speechState.messages = [];

        const conv = (this.conversations || []).find(c => String(c.conversation_id) === String(id));
        if (!conv) return;
        this.currentConversation = conv;

        // Update selection state in list
        if (this.listEl) {
            const items = this.listEl.querySelectorAll('.member-item');
            items.forEach(item => {
                if (String(item.dataset.id) === String(id)) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        if (!this.detailsEl) this.detailsEl = this.container.querySelector('#conversationDetails');
        if (!this.detailsEl) return;

        // populate details
        this.detailsEl.classList.remove('empty');
        this.detailsEl.innerHTML = '';
        
        const header = document.createElement('div');
        header.className = 'conv-details-header';
        
        const membersList = (conv.members || []).map(m => `<span class="member-tag">${m}</span>`).join('');
        
        header.innerHTML = `
            <div class="conv-header-top">
                <div class="conv-avatar-large">💬</div>
                <div class="conv-info-main">
                    <h3>Conversation #${conv.conversation_id}</h3>
                    <div class="conv-meta-row">
                        <span class="date">${new Date(conv.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div class="conv-controls" style="margin-left: auto; display: flex; gap: 12px; font-size: 1.5rem; cursor: pointer;">
                    <span id="btnPrev" title="Previous">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M12 5v14l-7-7zm9-1v16h-2V4z"/>
                        </svg>
                    </span>
                    <span id="btnPlay" title="Play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </span>
                    <span id="btnPause" title="Pause" style="display:none;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M6 6h4v12H6zm8 0h4v12h-4z"/>
                        </svg>
                    </span>
                    <span id="btnNext" title="Next">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em">
                            <path d="M12 5v14l7-7zm-9 0v14h2V5z"/>
                        </svg>
                    </span>
                </div>
            </div>
            <div class="conv-members-area">
                <span class="label">Participants:</span>
                <div class="members-tags">${membersList}</div>
            </div>
        `;
        this.detailsEl.appendChild(header);

        // Bind control events
        const btnPrev = header.querySelector('#btnPrev');
        const btnPlay = header.querySelector('#btnPlay');
        const btnPause = header.querySelector('#btnPause');
        const btnNext = header.querySelector('#btnNext');

        btnPlay.addEventListener('click', () => this.playConversation());
        btnPause.addEventListener('click', () => this.pauseConversation());
        btnNext.addEventListener('click', () => this.nextMessage());
        btnPrev.addEventListener('click', () => this.prevMessage());

        // placeholder for messages/content
        const body = document.createElement('div');
        body.className = 'conv-body';
        body.innerHTML = '<p>Loading messages...</p>';
        this.detailsEl.appendChild(body);

        try {
            const res = await fetch('/api/dev-tool-first-date/conversation_messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: conv.conversation_id })
            });
            const data = await res.json();
            
            if (data.success && Array.isArray(data.messages)) {
                this.speechState.messages = data.messages;
                this.renderMessages(body, data.messages);
            } else {
                body.innerHTML = '<p class="error">Failed to load messages.</p>';
            }
        } catch (e) {
            console.error('Error loading messages:', e);
            body.innerHTML = '<p class="error">Error loading messages.</p>';
        }
    },

    playConversation() {
        const btnPlay = this.detailsEl.querySelector('#btnPlay');
        const btnPause = this.detailsEl.querySelector('#btnPause');

        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            this.speechState.isPlaying = true;
            btnPlay.style.display = 'none';
            btnPause.style.display = 'inline';
            return;
        }

        if (this.speechState.isPlaying) return; // Already playing

        this.speechState.isPlaying = true;
        btnPlay.style.display = 'none';
        btnPause.style.display = 'inline';
        
        this.speakMessage(this.speechState.currentIndex);
    },

    pauseConversation() {
        const btnPlay = this.detailsEl.querySelector('#btnPlay');
        const btnPause = this.detailsEl.querySelector('#btnPause');
        
        window.speechSynthesis.pause();
        this.speechState.isPlaying = false;
        btnPlay.style.display = 'inline';
        btnPause.style.display = 'none';
    },

    nextMessage() {
        window.speechSynthesis.cancel();
        if (this.speechState.currentIndex < this.speechState.messages.length - 1) {
            this.speechState.currentIndex++;
            this.playConversation(); // Ensure UI is in play state and start speaking
            // If it was already playing, playConversation handles resume/start logic.
            // But since we cancelled, we need to force start.
            if (!window.speechSynthesis.speaking) {
                 this.speakMessage(this.speechState.currentIndex);
            }
        } else {
            // End of conversation
            this.speechState.isPlaying = false;
            this.detailsEl.querySelector('#btnPlay').style.display = 'inline';
            this.detailsEl.querySelector('#btnPause').style.display = 'none';
        }
    },

    prevMessage() {
        const elapsed = Date.now() - this.speechState.startTime;
        window.speechSynthesis.cancel();

        if (elapsed < 3000 && this.speechState.currentIndex > 0) {
            this.speechState.currentIndex--;
        }
        // If elapsed >= 3000, we stay on current index (restart message)
        
        this.playConversation();
        if (!window.speechSynthesis.speaking) {
             this.speakMessage(this.speechState.currentIndex);
        }
    },

    speakMessage(index) {
        if (index < 0 || index >= this.speechState.messages.length) {
            this.speechState.isPlaying = false;
            const btnPlay = this.detailsEl.querySelector('#btnPlay');
            const btnPause = this.detailsEl.querySelector('#btnPause');
            if (btnPlay) btnPlay.style.display = 'inline';
            if (btnPause) btnPause.style.display = 'none';
            return;
        }

        const msg = this.speechState.messages[index];
        const text = `${msg.member_nick_name} says: ${msg.message_text}`;
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Voice selection heuristic
        const voices = window.speechSynthesis.getVoices();
        const name = msg.member_nick_name.toLowerCase();
        // Simple heuristic for demo purposes
        const isFemale = ['chloe', 'sarah', 'jessica', 'emily'].some(n => name.includes(n));
        const isMale = ['ben', 'alex', 'david', 'mike'].some(n => name.includes(n));
        
        let voice = null;
        if (isFemale) {
            voice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha'));
        } else if (isMale) {
            voice = voices.find(v => v.name.includes('Male') || v.name.includes('Google UK English Male') || v.name.includes('Daniel'));
        }
        
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
            this.speechState.startTime = Date.now();
            this.highlightMessage(index);
        };

        utterance.onend = () => {
            if (this.speechState.isPlaying) {
                this.speechState.currentIndex++;
                if (this.speechState.currentIndex < this.speechState.messages.length) {
                    this.speakMessage(this.speechState.currentIndex);
                } else {
                    this.speechState.isPlaying = false;
                    const btnPlay = this.detailsEl.querySelector('#btnPlay');
                    const btnPause = this.detailsEl.querySelector('#btnPause');
                    if (btnPlay) btnPlay.style.display = 'inline';
                    if (btnPause) btnPause.style.display = 'none';
                    this.highlightMessage(-1); // clear highlight
                }
            }
        };

        utterance.onerror = (e) => {
            console.error('Speech error', e);
            this.speechState.isPlaying = false;
        };

        this.speechState.utterance = utterance;
        window.speechSynthesis.speak(utterance);
    },

    highlightMessage(index) {
        const listItems = this.detailsEl.querySelectorAll('.conv-body li');
        listItems.forEach((li, i) => {
            if (i === index) {
                li.style.border = '2px solid var(--color-primary-accent)';
                li.style.background = 'var(--color-highlight)';
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                li.style.border = '1px solid var(--color-border-light)';
                li.style.background = 'var(--color-card-background)';
            }
        });
    },

    renderMessages(container, messages) {
        if (!messages || messages.length === 0) {
            container.innerHTML = '<p>No messages yet.</p>';
            return;
        }
        
        container.innerHTML = '';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        
        messages.forEach(msg => {
            const li = document.createElement('li');
            li.style.marginBottom = '12px';
            li.style.padding = '8px';
            li.style.background = 'var(--color-card-background)';
            li.style.borderRadius = '6px';
            li.style.border = '1px solid var(--color-border-light)';
            
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:var(--color-text-secondary);">
                    <span style="font-weight:600; color:var(--color-text-primary);">${msg.member_nick_name}</span>
                    <span>${new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <div style="white-space: pre-wrap;">${msg.message_text}</div>
            `;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    }
};
