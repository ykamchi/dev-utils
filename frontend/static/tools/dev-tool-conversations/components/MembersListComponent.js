(function () {
    /*
        MembersListComponent: left side to select members in dev-tool-conversations
    */
    class MembersListComponent {
        constructor(container, onMemberSelect) {
            this.container = container;
            this.onMemberSelect = onMemberSelect;
            this.members = {};
            this.filteredMembers = {};
            this.searchInput = null;
            this.render();
        }

        // Render the main structure of the left side
        render() {
            this.container.innerHTML = '';

            // Create wrapper for filtering and list
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-members-list';

            // Members header
            const membersHeader = document.createElement('div');
            membersHeader.className = 'conversations-members-list-header';
            membersHeader.textContent = 'Members';
            wrapper.appendChild(membersHeader);

            // Search member input
            this.searchInput = document.createElement('input');
            this.searchInput.className = 'conversations-members-search';
            this.searchInput.type = 'text';
            this.searchInput.placeholder = 'Search members...';
            this.searchInput.addEventListener('input', e => {
                this.renderMembersList(e.target.value);
            });
            wrapper.appendChild(this.searchInput);

            // Members list container
            this.membersListItems = document.createElement('div');
            this.membersListItems.className = 'conversations-members-list-items';
            wrapper.appendChild(this.membersListItems);
            this.container.appendChild(wrapper);

            // Show initial loading state
            new window.SpinnerComponent(this.membersListItems, { text: 'Waiting for group selection...' });
        }

        // Load members for the selected group
        async load(selectedGroup) {
            // Show loading spinner
            new window.SpinnerComponent(this.membersListItems, { text: 'Loading members...' });

            // TODO: Remove this debug delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const resp = await fetch('/api/dev-tool-conversations/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ group_name: selectedGroup })
                });
                const data = await resp.json();
                if (data.success && data.members && typeof data.members === 'object') {
                    this.members = data.members;
                    this.renderMembersList(this.searchInput.value || '');

                } else {
                    this.members = {};
                    this.renderMembersList('');
                }
            } catch (e) {
                this.members = [];
                this.renderMembersList('');
            }
        }

        // Filter members based on search query
        renderMembersList(query) {
            query = (query || '').toLowerCase();
            const filtered = {};
            Object.entries(this.members || {}).forEach(([id, m]) => {
                const name = m.member_nick_name || m.name || '';
                const location = m.location || '';
                if (name.toLowerCase().includes(query) || location.toLowerCase().includes(query)) {
                    filtered[id] = m;
                }
            });
            this.filteredMembers = filtered;

            this.membersListItems.innerHTML = '';
            const items = Object.entries(this.filteredMembers).map(([id, m]) => ({ id, member: m }));
            new window.ListComponent(
                this.membersListItems,
                items,
                (item) => {
                    const memberDiv = document.createElement('div');
                    new window.conversations.MemberCardComponent(memberDiv, item.member);
                    return memberDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onMemberSelect(selectedItems[0].id, this.members);
                    }
                }
            );
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MembersListComponent = MembersListComponent;
})();