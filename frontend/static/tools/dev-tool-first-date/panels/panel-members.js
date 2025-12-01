// Panel: Members - list/profile panel (renamed from panel-first-date.js)
// Exposes window.panel_members so the panel name matches its purpose and filename.
window.panel_members = {
    name: 'Members',
    icon: '👥',
    description: 'Browse and register agents for the first-date event',

    // Initialize the panel content and behavior
    init(container, headerStatusContainer) {
        console.log('[panel_members] init');
        this.container = container;
        this.headerStatus = headerStatusContainer;

        // Query selectors scoped to the panel container
        this.listEl = this.container.querySelector('#membersList');
        this.searchInput = this.container.querySelector('#searchInput');
        this.profileCard = this.container.querySelector('#profileCard');
        this.profilePlaceholder = this.container.querySelector('#profilePlaceholder');
    this.registerBtn = this.container.querySelector('#registerBtn');
    this.startDatingBtn = this.container.querySelector('#startDatingBtn');
        this.currentMember = null;

        // Bind methods so we can remove listeners later
        this._onSearchInput = () => this.renderList();
        this._onRegister = () => this.toggleRegister();
        this._onStartDating = () => this.startDating();
    this._onStartConversation = () => this.conversationStart();

    if (this.searchInput) this.searchInput.addEventListener('input', this._onSearchInput);
    if (this.registerBtn) this.registerBtn.addEventListener('click', this._onRegister);
    if (this.startDatingBtn) this.startDatingBtn.addEventListener('click', this._onStartDating);

        // load members
        this.loadMembers();
    },

    destroy() {
        console.log('[panel_members] destroy');
        if (this.searchInput) this.searchInput.removeEventListener('input', this._onSearchInput);
        if (this.registerBtn) this.registerBtn.removeEventListener('click', this._onRegister);
        if (this.startDatingBtn) this.startDatingBtn.removeEventListener('click', this._onStartDating);
    // startConversation is now triggered from the header expandModeButtons, so there is
    // no DOM button to remove the listener from.

        // Clear container content (PanelsService removes scripts separately)
        if (this.container) this.container.innerHTML = '';
    },

    // Buttons shown when the panel is collapsed (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.conversationStart(); },
            title: 'Start Conversation',
            icon: '💬'
        }
    ],
    // Add header (expanded) button that shows as an emoji icon in the panel header.
    // PanelsService will render the icon-only button and use `title` as the tooltip.
    expandModeButtons: [
        {
            callback: function() { this.conversationStart(); },
            title: 'Start Conversation',
            icon: '💬'
        }
    ],

    onExpand() {
        // Optionally update header status
        if (this.headerStatus) this.headerStatus.textContent = '';
    },

    onCollapse(statusDiv) {
        // When collapsed, show a compact status in the secondary toolbar
        if (statusDiv) {
            statusDiv.textContent = 'Members';
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
                            <input id="searchInput" placeholder="Search by name or location" />
                        </div>
                        <ul id="membersList" class="members-list"></ul>
                    </div>

                    <div class="right-panel">
                        <div id="profilePlaceholder" class="profile empty">
                            <p>Select a member from the list to view their profile.</p>
                        </div>
                        <div id="profileCard" class="profile" style="display:none;">
                            <div id="profileActionsLeft" class="profile-actions-left">
                                <button id="registerBtn" class="dating-button">Register Agent</button>
                                <button id="startDatingBtn" class="dating-button secondary">Start dating</button>
                            </div>
                            <div class="profile-header">
                                <h2 id="pName"></h2>
                                <div id="pMeta" class="meta"></div>
                            </div>
                            <div class="profile-body">
                                <div class="profile-left">
                                    <div class="avatar">👤</div>
                                </div>
                                <div class="profile-right">
                                    <p id="pBio" class="bio"></p>
                                    <ul class="details">
                                        <li><strong>Age:</strong> <span id="pAge"></span></li>
                                        <li><strong>Location:</strong> <span id="pLocation"></span></li>
                                        <li><strong>Height:</strong> <span id="pHeight"></span> in</li>
                                        <li><strong>Eyes:</strong> <span id="pEyes"></span></li>
                                        <li><strong>Hair:</strong> <span id="pHair"></span></li>
                                        <li><strong>Occupation:</strong> <span id="pOcc"></span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // --- The behavior below is adapted from the original script.js ---
    async loadMembers() {
        try {
            const res = await fetch('/api/dev-tool-first-date/members');
            const data = await res.json();
            if (data.success && Array.isArray(data.members)) {
                this.members = data.members;
                this.renderList();
            } else {
                if (this.listEl) this.listEl.innerHTML = '<li class="error">Failed to load members</li>';
            }
        } catch (e) {
                console.error('Error fetching members:', e);
                if (this.listEl) this.listEl.innerHTML = '<li class="error">Error loading members</li>';
        }
    },

    renderList() {
        if (!this.listEl) return;
        const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const filtered = (this.members || []).filter(m => {
            if (!q) return true;
            return (m.name && m.name.toLowerCase().includes(q)) || (m.location && m.location.toLowerCase().includes(q));
        });

        this.listEl.innerHTML = '';
        for (const m of filtered) {
            const li = document.createElement('li');
            li.className = 'member-item';
            li.dataset.id = m.id;
            const liHtml = '<div class="member-name">' + m.name + '</div>' + '<div class="member-meta">' + m.location + ' • ' + m.age + '</div>';
            li.innerHTML = liHtml;
            li.addEventListener('click', () => this.showProfile(m.id));
            this.listEl.appendChild(li);
        }

        if (filtered.length === 0) {
            this.listEl.innerHTML = '<li class="empty">No members found</li>';
        }
    },

    showProfile(id) {
        const member = (this.members || []).find(m => m.id === id || String(m.id) === String(id));
        if (!member) return;

        this.currentMember = member;

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

        // Populate profile fields
        this.container.querySelector('#pName').textContent = member.name;
        this.container.querySelector('#pMeta').textContent = member.gender + ' • ' + member.age + ' years';
        this.container.querySelector('#pAge').textContent = member.age;
        this.container.querySelector('#pLocation').textContent = member.location;
        this.container.querySelector('#pHeight').textContent = member.height_in_inches;
        this.container.querySelector('#pEyes').textContent = member.eye_color;
        this.container.querySelector('#pHair').textContent = member.hair_color;
        this.container.querySelector('#pOcc').textContent = member.occupation;
        this.container.querySelector('#pBio').textContent = member.bio;

        if (this.profilePlaceholder) this.profilePlaceholder.style.display = 'none';
        if (this.profileCard) this.profileCard.style.display = 'block';

        // Update register button text based on external API
        if (this.registerBtn) {
            this.registerBtn.textContent = 'Checking...';
            this.registerBtn.disabled = true;
            this.registerBtn.classList.remove('registered', 'not-registered');
        }
        if (this.startDatingBtn) this.startDatingBtn.style.display = 'none';
        this.updateRegisterButton();
    },

    nicknameFor(member) {
        if (!member) return '';
        return String(member.name).trim();
    },

    async updateRegisterButton() {
        if (!this.registerBtn || !this.currentMember) return;
        try {
            const nick = this.nicknameFor(this.currentMember);
            this.registerBtn.disabled = true;
            const res = await fetch('/api/dev-tool-first-date/registered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', member_nick_name: nick })
            });
            const data = await res.json();
            console.debug('proxy /registered response:', data);
            const registered = data && (data.registered === true || data.registered === 'true');
            this.currentRegistered = Boolean(registered);
            this.registerBtn.textContent = this.currentRegistered ? 'Unregister Agent' : 'Register Agent';
            this.registerBtn.classList.toggle('registered', this.currentRegistered);
            this.registerBtn.classList.toggle('not-registered', !this.currentRegistered);
            if (this.startDatingBtn) {
                this.startDatingBtn.style.display = this.currentRegistered ? 'inline-block' : 'none';
            }
        } catch (e) {
            console.error('Error checking registration status:', e);
            this.registerBtn.textContent = 'Register Agent';
            if (this.registerBtn) {
                this.registerBtn.classList.remove('registered');
                this.registerBtn.classList.add('not-registered');
            }
            if (this.startDatingBtn) {
                this.startDatingBtn.style.display = 'none';
            }
        } finally {
            if (this.registerBtn) this.registerBtn.disabled = false;
        }
    },

    async toggleRegister() {
        if (!this.registerBtn || !this.currentMember) return;
        try {
            const nick = this.nicknameFor(this.currentMember);
            this.registerBtn.disabled = true;
            const endpoint = this.currentRegistered ? '/api/dev-tool-first-date/unregister' : '/api/dev-tool-first-date/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', member_nick_name: nick })
            });
            const data = await res.json();
            console.debug('proxy toggle response:', data, 'endpoint:', endpoint);
            await this.updateRegisterButton();
            console.log('Toggled registration for ' + nick + ' (endpoint: ' + endpoint + '). Refreshed state:', this.currentRegistered);
        } catch (e) {
            console.error('Error toggling registration:', e);
            alert('Failed to contact registration API. See console for details.');
        } finally {
            if (this.registerBtn) this.registerBtn.disabled = false;
        }
    },

    startDating() {
        if (!this.currentMember) return;
        console.log('Start dating clicked for', this.currentMember.id, this.currentMember.name);
    },

    async conversationStart() {
        // Starts a conversation via the tool API. Upstream chooses participants.
        try {
            const payload = {
                group_name: 'first-date',
                max_agents: 2,
                max_messages: 8,
            };
            if (this.startConversationBtn) this.startConversationBtn.disabled = true;
            const res = await fetch('/api/dev-tool-first-date/conversation_start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            console.error('Error starting conversation:', e);
            alert('Failed to start conversation. See console for details.');
        } finally {
            if (this.startConversationBtn) this.startConversationBtn.disabled = false;
        }
    }
};
