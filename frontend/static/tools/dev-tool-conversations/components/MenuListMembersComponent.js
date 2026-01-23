(function () {
    /*
        MenuListMembersComponent: left side to select members in dev-tool-conversations
    */
    class MenuListMembersComponent {
        constructor(container, onMemberSelect) {
            this.container = container;
            this.onMemberSelect = onMemberSelect;
            this.members = {};
            this.list = null;
            this.selectedGroup = null;
            this.render();
        }

        render() {
            // Create wrapper for filtering and list
            const wrapper = window.conversations.utils.createDivContainer(this.container);

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-manage-header');

            // Members header
            window.conversations.utils.createReadOnlyText(headerDiv, 'Members', 'conversations-menu-selection-header');

            // Members list container
            this.membersListItems = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-list-items');
        }

        // Load members for the selected group
        async load(selectedGroup) {
            this.selectedGroup = selectedGroup;
            this.members = await window.conversations.api.fetchGroupMembers(this.membersListItems, selectedGroup);
           
            // Create ListComponent with filtered members
            const items = Object.entries(this.members).map(([id, m]) => ({ id, member: m }));
            this.list = new window.ListComponent(
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
                        this.list.storeLastSelected('members-list-last-selection-' + this.selectedGroup, item => item.id);
                    } else {
                        console.log('No member selected');
                        this.onMemberSelect(null, this.members);
                    }
                },
                (item, query) => {
                    const name = item.member.name || '';
                    return name.toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Name', func: (a, b) => { return a.member.name < b.member.name ? -1 : 1; } , direction: 1 },
                    { label: 'Location', func: (a, b) => a.member.location < b.member.location ? -1 : 1, direction: 1 },
                    { label: 'Age', func: (a, b) => a.member.age < b.member.age ? -1 : 1, direction: 1 },
                ] 
            );

            // Restore last selection, or select first item
            this.list.setLastSelected('members-list-last-selection-' + this.selectedGroup, item => item.id);

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuListMembersComponent = MenuListMembersComponent;
})();