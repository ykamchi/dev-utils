// Panel: Members - list/profile panel (renamed from panel-first-date.js)
// Exposes window.panel_members so the panel name matches its purpose and filename.
window.panel_members = {
    name: 'Members',
    
    icon: '👥',
    
    description: 'Browse and register agents for the first-date event',

    async onExpand() {
        console.log('[Members Panel] Expanded');
    },

    async onCollapse(statusDiv) {
        console.log('[Members Panel] Collapsed');
    },

    collapseModeButtons: [],

    expandModeButtons: [],

    // Initialize the panel content and behavior
    init(container, headerStatusContainer) {
        console.log('[panel_members] init');
        this.container = container;
        this.headerStatus = headerStatusContainer;

        // Query selectors scoped to the panel container
        this.memberListElement = this.container.querySelector('#membersList');
        this.searchInput = this.container.querySelector('#searchInput');
        this.profileCard = this.container.querySelector('#profileCard');
        this.profilePlaceholder = this.container.querySelector('#profilePlaceholder');
        this.currentMember = null;

        // Bind methods so we can remove listeners later
        this._onSearchInput = () => this.renderList();

        if (this.searchInput) this.searchInput.addEventListener('input', this._onSearchInput);

        // load members
        this.loadMembers();
    },

    destroy() {
        if (this.searchInput) this.searchInput.removeEventListener('input', this._onSearchInput);
        if (this.container) this.container.innerHTML = '';
    },

    render() {
        return `
        <div class="dev-tool-first-date">
            <div class="first-date-body">
                <div class="first-date-split-container">
                    <div class="first-date-left-panel">
                        <div class="search-container">
                            <span class="search-icon">🔍</span>
                            <input id="searchInput" placeholder="Search by name or location" />
                        </div>
                    <ul id="membersList" class="first-date-members-list"></ul>
                    </div>
                    <div class="first-date-right-panel">
                        <div id="first-date-memberDetails" class="first-date-member-details"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    // Load members from backend 
    async loadMembers() {
        try {
            const res = await fetch('/api/dev-tool-first-date/members');
            const data = await res.json();
            if (data.success) {
                this.members = data.members;
                this.renderList();
                // Restore last selected member if available, else select first
                const toolState = window.StorageService.getToolState('dev-tool-first-date', {});
                const lastSelectedId = toolState.lastSelectedMemberId;
                let memberToSelect = null;
                if (lastSelectedId && this.members[lastSelectedId]) {
                    memberToSelect = lastSelectedId;
                } else if (this.members.length > 0) {
                    memberToSelect = this.members[0].id;
                }
                if (memberToSelect) {
                    this.showProfile(memberToSelect, { scroll: true });
                }
            } else {
                if (this.memberListElement) this.memberListElement.innerHTML = '<li class="error">Failed to load members</li>';
            }
        } catch (e) {
            if (this.memberListElement) this.memberListElement.innerHTML = '<li class="error">Error loading members</li>';
        }
    },

    renderList() {
        if (!this.memberListElement) return;

        // Apply search filter
        const q = this.searchInput ? this.searchInput.value.trim().toLowerCase() : '';
        // Filter the members map to a new filtered map
        const filtered = {};
        for (const [id, m] of Object.entries(this.members || {})) {
            if (!q || (m.name && m.name.toLowerCase().includes(q)) || (m.location && m.location.toLowerCase().includes(q))) {
                filtered[id] = m;
            }
        }
        this.memberListElement.innerHTML = '';
        for (const [k, m] of Object.entries(filtered)) {
            const li = document.createElement('li');
            li.className = 'member-item';
            li.dataset.id = k;

            // Avatar
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar';
            avatarDiv.textContent = '👤';

            // Info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'member-info';

            // Name (bold)
            const nameDiv = document.createElement('div');
            nameDiv.className = 'member-name';
            nameDiv.style.fontWeight = 'bold';
            nameDiv.textContent = m.name;

            // Meta (location, age)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'member-meta';
            metaDiv.textContent = `${m.location} • ${m.age}`;

            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(metaDiv);

            li.appendChild(avatarDiv);
            li.appendChild(infoDiv);
            li.addEventListener('click', () => this.showProfile(k));
            this.memberListElement.appendChild(li);
        }

        if (Object.keys(filtered).length === 0) {
            this.memberListElement.innerHTML = '<li class="empty">No members found</li>';
        }
    },

    async showProfile(selected_member_id, opts = {}) {
        // const member = (this.members || []).find(m => m.id === id || String(m.id) === String(id));
        const member = this.members[selected_member_id];
        if (!member) return;

        this.currentMember = member;

        // Persist selection
        const toolState = window.StorageService.getToolState('dev-tool-first-date', {});
        window.StorageService.setToolState('dev-tool-first-date', {
            ...toolState,
            lastSelectedMemberId: selected_member_id
        });

        // Update selection state in list and scroll if needed
        if (this.memberListElement) {
            const items = this.memberListElement.querySelectorAll('.member-item');
            items.forEach(item => {
                if (String(item.dataset.id) === String(selected_member_id)) {
                    item.classList.add('selected');
                    if (opts.scroll) {
                        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    }
                } else {
                    item.classList.remove('selected');
                }
            });
        }

        this.memberDetailsElement = this.container.querySelector('#first-date-memberDetails');
        new window.MemberDetailsComponent(this.memberDetailsElement, selected_member_id, this.members);
    },

};
