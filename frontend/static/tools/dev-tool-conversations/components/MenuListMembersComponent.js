(function () {
    /*
        MenuListMembersComponent: left side to select members in dev-tool-conversations
    */
    class MenuListMembersComponent {
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
            const wrapper = window.conversations.utils.createDivContainer(this.container, null, 'conversations-instruction-scrollable-group');

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, null, 'conversations-group-manage-header');

            // Members header
            window.conversations.utils.createReadOnlyText(headerDiv, 'conversations-selection-header', 'Members', 'conversations-selection-header');

            // Search container
            const searchContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-members-search-container', 'conversations-members-search-container');

            // Search icon
            window.conversations.utils.createReadOnlyText(searchContainer, null, '🔍', '-');

            // Search member input
            this.searchInput = window.conversations.utils.createTextInput(searchContainer, 'conversations-members-search-input', '', 'Search members...', (value) => {this.renderMembersList(value);});

            // Members list container
            this.membersListItems = window.conversations.utils.createDivContainer(wrapper, 'conversations-members-list-items', 'conversations-members-list-items');
        }

        // Load members for the selected group
        async load(selectedGroup) {
            this.members = await window.conversations.api.fetchGroupMembers(this.membersListItems, selectedGroup);
            this.renderMembersList(this.searchInput.value);
        }

        // Filter members based on search query and render the list
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

            // Clear existing list
            this.membersListItems.innerHTML = '';

            // Create ListComponent with filtered members
            const items = Object.entries(this.filteredMembers).map(([id, m]) => ({ id, member: m }));
            const list = new window.ListComponent(
                this.membersListItems,
                items,
                (item) => {
                    const memberDiv = document.createElement('div');
                    new window.conversations.CardMemberComponent(memberDiv, item.member);
                    return memberDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onMemberSelect(selectedItems[0].id, this.members);
                    }
                }
            );

            // Automatically select the first member if available
            if (items.length > 0) {
                list.handleSelect(0);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuListMembersComponent = MenuListMembersComponent;
})();