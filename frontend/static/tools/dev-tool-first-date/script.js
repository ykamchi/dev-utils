window.tool_script = window.tool_script || {};
window.tool_script_first_date = {
    container: null,
    members: [],

    async init(container) {
        this.container = container;
        this.listEl = this.container.querySelector('#membersList');
        this.searchInput = this.container.querySelector('#searchInput');
        this.profileCard = this.container.querySelector('#profileCard');
        this.profilePlaceholder = this.container.querySelector('#profilePlaceholder');
        this.registerBtn = this.container.querySelector('#registerBtn');
        this.startDatingBtn = this.container.querySelector('#startDatingBtn');
    this.startConversationBtn = this.container.querySelector('#startConversationBtn');
        this.currentMember = null;

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderList());
        }

        if (this.registerBtn) this.registerBtn.addEventListener('click', () => this.toggleRegister());
        if (this.startDatingBtn) this.startDatingBtn.addEventListener('click', () => this.startDating());
    if (this.startConversationBtn) this.startConversationBtn.addEventListener('click', () => this.conversationStart());

        await this.loadMembers();
    },

    destroy() {
        if (this.searchInput) this.searchInput.removeEventListener('input', () => this.renderList());
        if (this.registerBtn) this.registerBtn.removeEventListener('click', () => this.toggleRegister());
        if (this.startDatingBtn) this.startDatingBtn.removeEventListener('click', () => this.startDating());
        if (this.startConversationBtn) this.startConversationBtn.removeEventListener('click', () => this.conversationStart());
    },

    async loadMembers() {
        try {
            const res = await fetch('/api/dev-tool-first-date/members');
            const data = await res.json();
            if (data.success && Array.isArray(data.members)) {
                this.members = data.members;
                this.renderList();
            } else {
                this.listEl.innerHTML = '<li class="error">Failed to load members</li>';
            }
        } catch (e) {
            console.error('Error fetching members:', e);
            if (this.listEl) this.listEl.innerHTML = '<li class="error">Error loading members</li>';
        }
    },

    renderList() {
        if (!this.listEl) return;
        const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        const filtered = this.members.filter(m => {
            if (!q) return true;
            return (m.name && m.name.toLowerCase().includes(q)) ||
                   (m.location && m.location.toLowerCase().includes(q));
        });

        this.listEl.innerHTML = '';
        for (const m of filtered) {
            const li = document.createElement('li');
            li.className = 'member-item';
            li.dataset.id = m.id;
            li.innerHTML = `<div class="member-name">${m.name}</div><div class="member-meta">${m.location} • ${m.age}</div>`;
            li.addEventListener('click', () => this.showProfile(m.id));
            this.listEl.appendChild(li);
        }

        if (filtered.length === 0) {
            this.listEl.innerHTML = '<li class="empty">No members found</li>';
        }
    },

    showProfile(id) {
        const member = this.members.find(m => m.id === id || String(m.id) === String(id));
        if (!member) return;

        this.currentMember = member;

        // Populate profile fields
        this.container.querySelector('#pName').textContent = member.name;
        this.container.querySelector('#pMeta').textContent = `${member.gender} • ${member.age} years`;
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
            // clear any previous state classes while checking
            this.registerBtn.classList.remove('registered', 'not-registered');
        }
        // hide start dating until we know the registration state
        if (this.startDatingBtn) {
            this.startDatingBtn.style.display = 'none';
        }
        this.updateRegisterButton();
    },

    // Build nickname for registration API
    // Use the original member name (trimmed) so we preserve case and spacing
    // — the upstream service is case-sensitive and expects the original name.
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
            // Normalize registered value: accept boolean true or string 'true'
            const registered = data && (data.registered === true || data.registered === 'true');
            this.currentRegistered = Boolean(registered);
            this.registerBtn.textContent = this.currentRegistered ? 'Unregister Agent' : 'Register Agent';
            // toggle classes for visual state
            this.registerBtn.classList.toggle('registered', this.currentRegistered);
            this.registerBtn.classList.toggle('not-registered', !this.currentRegistered);
            // show or hide the Start Dating button depending on registration state
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

            // Choose endpoint based on current registration state
            // Use the actual register/unregister endpoints (not the /registered check endpoint)
            const endpoint = this.currentRegistered ? '/api/dev-tool-first-date/unregister' : '/api/dev-tool-first-date/register';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', member_nick_name: nick })
            });

            const data = await res.json();
            console.debug('proxy toggle response:', data, 'endpoint:', endpoint);

            // After performing the action, refresh the registration state from the canonical /registered endpoint
            await this.updateRegisterButton();
            console.log(`Toggled registration for ${nick} (endpoint: ${endpoint}). Refreshed state:`, this.currentRegistered);
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
        // Starts a conversation via the tool API. The upstream service will
        // choose participants; no member must be selected in the UI first.
        try {
            // The upstream service will decide which members participate and
            // return `selected_members` and `member_profile` in its response.
            // Send only the minimal request body the backend now expects.
            const payload = {
                group_name: 'first-date',
                max_agents: 2,
                max_messages: 8,
            };
            this.startConversationBtn.disabled = true;
            const res = await fetch('/api/dev-tool-first-date/conversation_start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            console.debug('conversation_start response:', data);
            // Upstream should return `selected_members` and `member_profile` in `data`.
            alert('Conversation started (or requested). See console for response.');
        } catch (e) {
            console.error('Error starting conversation:', e);
            alert('Failed to start conversation. See console for details.');
        } finally {
            if (this.startConversationBtn) this.startConversationBtn.disabled = false;
        }
    },
};

// Expose as the generic tool_script expected by the loader
window.tool_script = window.tool_script_first_date;
