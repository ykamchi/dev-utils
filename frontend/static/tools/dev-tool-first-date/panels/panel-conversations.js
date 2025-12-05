// Panel: Conversations - split list/details panel (left: conversations-list, right: conversationDetails)
// Minimal implementation: split layout only, both sides empty for now.
window.panel_conversations = {
    name: 'Conversations',
    icon: '💬',
    description: 'List of conversations and detail view',

    // Initialize the panel
    async init(container, headerStatusContainer) {
        console.log('[panel_conversations] init');
        this.container = container;
        this.headerStatus = headerStatusContainer;

        // elements will be found after render is inserted into DOM
        this.listEl = null;
        this.searchInput = null;
        this.detailsEl = null;
        this.conversations = [];
        this.currentConversation = null;
        this.charts = {}; // Store chart instances for cleanup
        this.memberProfiles = {}; // Cache for member profiles by nick_name
        this.speechState = {
            messages: [],
            currentIndex: 0,
            isPlaying: false,
            startTime: 0,
            utterance: null
        };

        this._onSearchInput = () => this.renderList();

        // Load Chart.js library
        try {
            await this.loadChartJS();
        } catch (error) {
            console.error('[panel_conversations] Failed to load Chart.js:', error);
        }

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
        
        // Destroy all Chart.js instances
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
        
        if (this.container) this.container.innerHTML = '';
        window.speechSynthesis.cancel();
    },

    /**
     * Load Chart.js library if not already loaded
     */
    loadChartJS() {
        return new Promise((resolve, reject) => {
            // Check if Chart.js is already loaded
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }

            // Load Chart.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => {
                console.log('[panel_conversations] Chart.js loaded successfully');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
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
                        <div id="conversationDetails" class="conversation-details">
                            <div class="tab-buttons">
                                <button class="tab-button active" data-tab="details" onclick="window.panel_conversations.switchTab('details')">ℹ️ Details</button>
                                <button class="tab-button" data-tab="messages" onclick="window.panel_conversations.switchTab('messages')">💬 Messages</button>
                                <button class="tab-button" data-tab="feedback-members" onclick="window.panel_conversations.switchTab('feedback-members')">👤 By Members</button>
                                <button class="tab-button" data-tab="feedback-metrics" onclick="window.panel_conversations.switchTab('feedback-metrics')">📊 By Metrics</button>
                            </div>
                            <div class="tab-content">
                                <div id="details-tab" class="tab-pane active">
                                    <p class="empty-state">Select a conversation to view details.</p>
                                </div>
                                <div id="messages-tab" class="tab-pane">
                                    <p class="empty-state">Select a conversation to view messages.</p>
                                </div>
                                <div id="feedback-members-tab" class="tab-pane">
                                    <p class="empty-state">Select a conversation to view feedback by members.</p>
                                </div>
                                <div id="feedback-metrics-tab" class="tab-pane">
                                    <p class="empty-state">Select a conversation to view feedback by metrics.</p>
                                </div>
                            </div>
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
                // Sort conversations by created_at descending (latest first)
                this.conversations = data.conversations.sort((a, b) => {
                    const dateA = new Date(a.created_at || 0);
                    const dateB = new Date(b.created_at || 0);
                    return dateB - dateA; // descending order
                });
                this.renderList();
                
                // Auto-select the first conversation if any exist
                if (this.conversations.length > 0) {
                    const firstConvId = this.conversations[0].conversation_id;
                    this.showConversation(firstConvId);
                }
                
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
                if (this.conversations.length > 0) {
                    this.showConversation(this.conversations[0].conversation_id);
                }
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
            if (this.conversations.length > 0) {
                this.showConversation(this.conversations[0].conversation_id);
            }
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
            this.listEl.innerHTML = '<li class="empty">🔍 No conversation found</li>';
        }
    },

    // Fetch and cache member profile by nick_name
    async getMemberProfile(nickName) {
        // Return cached profile if available
        if (this.memberProfiles[nickName]) {
            return this.memberProfiles[nickName];
        }

        try {
            const res = await fetch('/api/dev-tool-first-date/members');
            const data = await res.json();
            
            if (data.success && Array.isArray(data.members)) {
                // Find member by name (case-insensitive)
                const profile = data.members.find(m => 
                    m.name && m.name.toLowerCase() === nickName.toLowerCase()
                );
                
                if (profile) {
                    this.memberProfiles[nickName] = profile;
                    return profile;
                }
                
                console.warn(`Profile not found for ${nickName}`);
            }
        } catch (e) {
            console.error(`Failed to fetch profile for ${nickName}:`, e);
        }
        
        return null;
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

        // Build the conversation header (static, outside tabs)
        const headerHTML = `
            <div class="conv-details-header">
                <div class="conv-header-top">
                    <div class="conv-avatar-large">💬</div>
                    <div class="conv-info-main">
                        <h3>Conversation #${conv.conversation_id}</h3>
                        <div class="conv-meta-row">
                            <span class="date">${new Date(conv.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const controlsHTML = `
            <div class="player-controls-header">
                <span class="player-label">🎧 Player</span>
                <div class="player-buttons">
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
        `;

        // Rebuild the entire details element with header + tabs structure
        this.detailsEl.innerHTML = `
            ${headerHTML}
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="details" onclick="window.panel_conversations.switchTab('details')">ℹ️ Details</button>
                <button class="tab-button" data-tab="messages" onclick="window.panel_conversations.switchTab('messages')">💬 Messages</button>
                <button class="tab-button" data-tab="feedback-members" onclick="window.panel_conversations.switchTab('feedback-members')">👤 By Members</button>
                <button class="tab-button" data-tab="feedback-metrics" onclick="window.panel_conversations.switchTab('feedback-metrics')">📊 By Metrics</button>
            </div>
            <div class="tab-content">
                <div id="details-tab" class="tab-pane active">
                    <div class="conv-details-content"><p>Loading details...</p></div>
                </div>
                <div id="messages-tab" class="tab-pane">
                    ${controlsHTML}
                    <div class="conv-body"><p>Loading messages...</p></div>
                </div>
                <div id="feedback-members-tab" class="tab-pane">
                    <p class="empty-state">Loading feedback by members...</p>
                </div>
                <div id="feedback-metrics-tab" class="tab-pane">
                    <p class="empty-state">Loading feedback by metrics...</p>
                </div>
            </div>
        `;

        // Bind control events
        const btnPrev = this.detailsEl.querySelector('#btnPrev');
        const btnPlay = this.detailsEl.querySelector('#btnPlay');
        const btnPause = this.detailsEl.querySelector('#btnPause');
        const btnNext = this.detailsEl.querySelector('#btnNext');

        btnPlay.addEventListener('click', () => this.playConversation());
        btnPause.addEventListener('click', () => this.pauseConversation());
        btnNext.addEventListener('click', () => this.nextMessage());
        btnPrev.addEventListener('click', () => this.prevMessage());

        // Load and render messages
        try {
            const res = await fetch('/api/dev-tool-first-date/conversation_messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversation_id: conv.conversation_id })
            });
            const data = await res.json();
            
            if (data.success && Array.isArray(data.messages)) {
                this.speechState.messages = data.messages;
                
                // Populate details tab first
                this.populateDetailsTab(conv, data.messages);
                
                // Populate messages tab
                const messagesTab = this.container.querySelector('#messages-tab');
                const body = messagesTab?.querySelector('.conv-body');
                if (body) {
                    this.renderMessages(body, data.messages);
                }
                
                // Automatically populate feedback tabs
                this.populateFeedbackTabs();
            } else {
                const messagesTab = this.container.querySelector('#messages-tab');
                const body = messagesTab?.querySelector('.conv-body');
                if (body) body.innerHTML = '<p class="error">Failed to load messages.</p>';
            }
        } catch (e) {
            console.error('Error loading messages:', e);
            const messagesTab = this.container.querySelector('#messages-tab');
            const body = messagesTab?.querySelector('.conv-body');
            if (body) body.innerHTML = '<p class="error">Error loading messages.</p>';
        }
    },

    populateDetailsTab(conv, messages) {
        const detailsTab = this.container.querySelector('#details-tab .conv-details-content');
        if (!detailsTab) return;

        // Calculate message counts per member
        const memberCounts = {};
        messages.forEach(msg => {
            const member = msg.member_nick_name;
            memberCounts[member] = (memberCounts[member] || 0) + 1;
        });

        // Calculate conversation duration
        let duration = 'N/A';
        if (messages.length > 0) {
            const firstMsg = new Date(messages[0].created_at);
            const lastMsg = new Date(messages[messages.length - 1].created_at);
            const diffMs = lastMsg - firstMsg;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            
            if (diffHours > 0) {
                duration = `${diffHours}h ${remainingMins}m`;
            } else {
                duration = `${diffMins}m`;
            }
        }

        // Build member tags with message counts
        const memberTags = (conv.members || []).map(member => {
            const count = memberCounts[member] || 0;
            return `<span class="member-tag-detail">${member} <span class="message-count">(${count})</span></span>`;
        }).join('');

        const detailsHTML = `
            <div class="details-section">
                <h3>📋 Overview</h3>
                <div class="detail-item">
                    <span class="detail-label">Conversation ID:</span>
                    <span class="detail-value">#${conv.conversation_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${new Date(conv.created_at).toLocaleString()}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Messages:</span>
                    <span class="detail-value">${messages.length}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${duration}</span>
                </div>
            </div>

            <div class="details-section">
                <h3>👥 Participants</h3>
                <div class="members-tags-detail">
                    ${memberTags}
                </div>
            </div>
        `;

        detailsTab.innerHTML = detailsHTML;
    },

    playConversation() {
        const btnPlay = this.detailsEl?.querySelector('#btnPlay');
        const btnPause = this.detailsEl?.querySelector('#btnPause');
        
        if (!btnPlay || !btnPause) return;

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
        const btnPlay = this.detailsEl?.querySelector('#btnPlay');
        const btnPause = this.detailsEl?.querySelector('#btnPause');
        
        if (!btnPlay || !btnPause) return;
        
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
            const btnPlay = this.detailsEl?.querySelector('#btnPlay');
            const btnPause = this.detailsEl?.querySelector('#btnPause');
            if (btnPlay) btnPlay.style.display = 'inline';
            if (btnPause) btnPause.style.display = 'none';
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

    async speakMessage(index) {
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
        
        // Get member profile to determine voice based on gender
        const profile = await this.getMemberProfile(msg.member_nick_name);
        console.log(`[speakMessage] Member: ${msg.member_nick_name}, Profile:`, profile);
        console.log(`[speakMessage] Gender field:`, profile?.gender);
        
        const voices = window.speechSynthesis.getVoices();
        console.log(`[speakMessage] Available voices:`, voices.map(v => `${v.name} (${v.lang})`));
        
        let voice = null;
        
        // Try gender-based selection if profile exists
        if (profile && profile.gender) {
            const gender = profile.gender.toLowerCase();
            console.log(`[speakMessage] Gender (lowercase): "${gender}"`);
            
            if (gender.includes('woman') || gender.includes('female')) {
                // Use Google US English voice for females (neutral/female sounding)
                voice = voices.find(v => v.name === 'Google US English' && v.lang === 'en-US');
                if (!voice) {
                    // Fallback to UK Female
                    voice = voices.find(v => v.name === 'Google UK English Female' && v.lang === 'en-GB');
                }
                console.log(`[speakMessage] Selected female voice:`, voice?.name || 'none found');
            } else if (gender.includes('man') || gender.includes('male')) {
                // Use Google UK English Male voice
                voice = voices.find(v => v.name === 'Google UK English Male' && v.lang === 'en-GB');
                console.log(`[speakMessage] Selected male voice:`, voice?.name || 'none found');
            }
        }
        
        // Use default voice if no gender-based voice found
        if (!voice && voices.length > 0) {
            voice = voices[0]; // Use first available voice as default
            console.log(`[speakMessage] Using default voice: ${voice.name}`);
        }
        
        if (voice) {
            utterance.voice = voice;
            console.log(`[speakMessage] Final voice set to: ${voice.name}`);
        }

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
                <div style="white-space: pre-wrap; margin-top: 8px;">${msg.message_text}</div>
            `;
            ul.appendChild(li);
        });
        container.appendChild(ul);
    },

    populateFeedbackTabs() {
        console.log('[populateFeedbackTabs] Populating feedback tabs...');
        
        const feedbackData = this.parseFeedbackData();
        
        if (!feedbackData || (feedbackData.members.length === 0 && feedbackData.keys.length === 0)) {
            const membersTab = this.container.querySelector('#feedback-members-tab');
            const metricsTab = this.container.querySelector('#feedback-metrics-tab');
            
            if (membersTab) membersTab.innerHTML = '<div style="padding: 20px; text-align: center;">No numeric feedback data available</div>';
            if (metricsTab) metricsTab.innerHTML = '<div style="padding: 20px; text-align: center;">No numeric feedback data available</div>';
            return;
        }

        console.log('[populateFeedbackTabs] Feedback data:', feedbackData);

        // Populate By Members tab
        this.populateFeedbackByMembers(feedbackData);
        
        // Populate By Metrics tab
        this.populateFeedbackByMetrics(feedbackData);
    },

    populateFeedbackByMembers(feedbackData) {
        const membersTab = this.container.querySelector('#feedback-members-tab');
        if (!membersTab) {
            console.error('[populateFeedbackByMembers] Could not find feedback-members tab');
            return;
        }

        // Build HTML structure without charts
        let html = '<div style="display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 20px; gap: 20px;">';
        
        // Per-member graphs
        if (feedbackData.members.length > 0) {
            feedbackData.members.forEach(member => {
                const canvasId = `graph-member-${member.replace(/\s+/g, '-')}`;
                html += `
                    <div style="flex-shrink: 0; margin-bottom: 20px;">
                        <h4 class="graph-title">📉 ${member}</h4>
                        <div style="position: relative; height: 300px; width: 100%;">
                            <canvas id="${canvasId}"></canvas>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        membersTab.innerHTML = html;
        
        // Now draw the charts after DOM is ready
        setTimeout(() => {
            console.log('[populateFeedbackByMembers] Drawing member charts...');
            
            feedbackData.members.forEach(member => {
                const canvasId = `graph-member-${member.replace(/\s+/g, '-')}`;
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    console.warn(`[populateFeedbackByMembers] Canvas not found: ${canvasId}`);
                    return;
                }
                
                const data = feedbackData.points
                    .filter(p => p.member === member)
                    .map(p => ({ key: p.key, value: p.value, time: p.time }));
                
                console.log(`[populateFeedbackByMembers] Drawing member chart for ${member}:`, data);
                this.drawLineGraph(canvas, data, feedbackData.keys, 'key');
            });
        }, 100);
    },

    populateFeedbackByMetrics(feedbackData) {
        const metricsTab = this.container.querySelector('#feedback-metrics-tab');
        if (!metricsTab) {
            console.error('[populateFeedbackByMetrics] Could not find feedback-metrics tab');
            return;
        }

        // Build HTML structure without charts
        let html = '<div style="display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 20px; gap: 20px;">';
        
        // Per-metric graphs
        if (feedbackData.keys.length > 0) {
            feedbackData.keys.forEach(key => {
                const canvasId = `graph-key-${key.replace(/\s+/g, '-')}`;
                html += `
                    <div style="flex-shrink: 0; margin-bottom: 20px;">
                        <h4 class="graph-title">📉 ${key}</h4>
                        <div style="position: relative; height: 300px; width: 100%;">
                            <canvas id="${canvasId}"></canvas>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        metricsTab.innerHTML = html;
        
        // Now draw the charts after DOM is ready
        setTimeout(() => {
            console.log('[populateFeedbackByMetrics] Drawing metric charts...');
            
            feedbackData.keys.forEach(key => {
                const canvasId = `graph-key-${key.replace(/\s+/g, '-')}`;
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    console.warn(`[populateFeedbackByMetrics] Canvas not found: ${canvasId}`);
                    return;
                }
                
                const data = feedbackData.points
                    .filter(p => p.key === key)
                    .map(p => ({ member: p.member, value: p.value, time: p.time }));
                
                console.log(`[populateFeedbackByMetrics] Drawing key chart for ${key}:`, data);
                this.drawLineGraph(canvas, data, feedbackData.members, 'member');
            });
        }, 100);
    },

    switchTab(tabName) {
        // Update tab buttons
        const tabButtons = this.container.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panes
        const tabPanes = this.container.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            if (pane.id === `${tabName}-tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        this.currentTab = tabName;
    },

    parseFeedbackData() {
        console.log('[parseFeedbackData] Starting to parse feedback from messages...');
        const data = {
            members: [],
            keys: [],
            points: [] // { member, key, value, time }
        };

        if (!this.speechState.messages) {
            console.log('[parseFeedbackData] No messages in speechState');
            return data;
        }

        console.log(`[parseFeedbackData] Processing ${this.speechState.messages.length} messages`);

        this.speechState.messages.forEach((msg, idx) => {
            console.log(`[parseFeedbackData] Message ${idx}:`, msg);
            
            if (!msg.feedback) {
                console.log(`[parseFeedbackData] Message ${idx} has no feedback field or it's null`);
                return;
            }

            let feedbackObj = msg.feedback;
            console.log(`[parseFeedbackData] Message ${idx} feedback type:`, typeof feedbackObj, feedbackObj);

            // If feedback is a string, try to parse it
            if (typeof feedbackObj === 'string') {
                try {
                    feedbackObj = JSON.parse(feedbackObj);
                    console.log(`[parseFeedbackData] Parsed feedback string to object:`, feedbackObj);
                } catch (e) {
                    console.log(`[parseFeedbackData] Failed to parse feedback string:`, e);
                    return;
                }
            }

            if (typeof feedbackObj !== 'object' || feedbackObj === null) {
                console.log(`[parseFeedbackData] Feedback is not an object after parsing:`, feedbackObj);
                return;
            }

            // Backend returns 'member_nick_name', not 'name'
            const member = msg.member_nick_name || msg.name || 'Unknown';
            const time = new Date(msg.created_at || msg.timestamp || Date.now());

            console.log(`[parseFeedbackData] Message fields:`, {
                member_nick_name: msg.member_nick_name,
                name: msg.name,
                created_at: msg.created_at,
                timestamp: msg.timestamp,
                resolved_member: member,
                resolved_time: time
            });
            console.log(`[parseFeedbackData] Processing feedback for member ${member}:`, feedbackObj);

            // Extract numeric key-value pairs
            Object.entries(feedbackObj).forEach(([key, value]) => {
                console.log(`[parseFeedbackData] Checking key "${key}" with value:`, value, typeof value);
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    console.log(`[parseFeedbackData] Adding numeric point: member=${member}, key=${key}, value=${numValue}`);
                    
                    if (!data.members.includes(member)) {
                        data.members.push(member);
                    }
                    if (!data.keys.includes(key)) {
                        data.keys.push(key);
                    }
                    data.points.push({ member, key, value: numValue, time });
                } else {
                    console.log(`[parseFeedbackData] Value "${value}" is not numeric, skipping`);
                }
            });
        });

        console.log('[parseFeedbackData] Final parsed data:', data);
        return data;
    },

    renderStatisticsContent(feedbackData) {
        let html = '<div style="display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 20px; gap: 20px;">';
        
        // Per-member graphs
        if (feedbackData.members.length > 0) {
            html += '<div style="flex-shrink: 0;"><h3 style="margin: 0 0 15px 0;">Per Member</h3></div>';
            feedbackData.members.forEach(member => {
                html += this.createMemberGraph(member, feedbackData);
            });
        }
        
        // Per-metric graphs
        if (feedbackData.keys.length > 0) {
            html += '<div style="flex-shrink: 0; margin-top: 20px;"><h3 style="margin: 0 0 15px 0;">Per Metric</h3></div>';
            feedbackData.keys.forEach(key => {
                html += this.createKeyGraph(key, feedbackData);
            });
        }
        
        html += '</div>';
        return html;
    },

    createMemberGraph(member, feedbackData) {
        const canvasId = `graph-member-${member.replace(/\s+/g, '-')}`;
        const html = `
            <div style="flex-shrink: 0; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-weight: 600;">${member}</h4>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
        
        // Draw after DOM is ready
        setTimeout(() => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const data = feedbackData.points
                .filter(p => p.member === member)
                .map(p => ({ key: p.key, value: p.value, time: p.time }));
            
            this.drawLineGraph(canvas, data, feedbackData.keys, 'key');
        }, 10);
        
        return html;
    },

    createKeyGraph(key, feedbackData) {
        const canvasId = `graph-key-${key.replace(/\s+/g, '-')}`;
        const html = `
            <div style="flex-shrink: 0; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-weight: 600;">${key}</h4>
                <div style="position: relative; height: 300px; width: 100%;">
                    <canvas id="${canvasId}"></canvas>
                </div>
            </div>
        `;
        
        // Draw after DOM is ready
        setTimeout(() => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            
            const data = feedbackData.points
                .filter(p => p.key === key)
                .map(p => ({ member: p.member, value: p.value, time: p.time }));
            
            this.drawLineGraph(canvas, data, feedbackData.members, 'member');
        }, 10);
        
        return html;
    },

    drawLineGraph(canvas, data, categories, categoryField) {
        const canvasId = canvas.id;
        
        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        if (data.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-accent').trim();
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Group data by category and sort by time
        const seriesData = {};
        categories.forEach(cat => {
            seriesData[cat] = data
                .filter(d => d[categoryField] === cat)
                .sort((a, b) => a.time - b.time);
        });

        // Get all unique time points sorted, and create sequential labels
        const allTimes = [...new Set(data.map(d => d.time.getTime()))].sort((a, b) => a - b);
        const labels = allTimes.map((_, index) => `#${index + 1}`); // Message #1, #2, #3, etc.

        // Color palette using theme colors
        const colors = [
            getComputedStyle(document.documentElement).getPropertyValue('--color-highlight').trim(),
            getComputedStyle(document.documentElement).getPropertyValue('--color-primary-accent').trim(),
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#84cc16'
        ];

        // Prepare datasets for Chart.js
        const datasets = categories.map((cat, idx) => {
            const points = seriesData[cat];
            if (points.length === 0) return null;

            // Create data array aligned with labels (time-ordered positions)
            const dataArray = allTimes.map(timestamp => {
                const point = points.find(p => p.time.getTime() === timestamp);
                return point ? point.value : null;
            });

            return {
                label: cat,
                data: dataArray,
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length] + '33', // Add transparency
                borderWidth: 2.5,
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: colors[idx % colors.length],
                pointBorderColor: colors[idx % colors.length],
                pointBorderWidth: 2,
                spanGaps: true // Connect lines even if some points are null
            };
        }).filter(ds => ds !== null);

        // Create Chart.js chart
        const ctx = canvas.getContext('2d');
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            padding: 10,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-card-background').trim(),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-border-light').trim(),
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                return `Message ${context[0].label}`;
                            },
                            label: function(context) {
                                if (context.parsed.y === null) return null;
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Message Sequence',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-border-light').trim(),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-accent').trim(),
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Value',
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-border-light').trim(),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary-accent').trim(),
                            font: {
                                size: 11,
                                weight: '500'
                            },
                            callback: function(value) {
                                return value.toFixed(1);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
};

