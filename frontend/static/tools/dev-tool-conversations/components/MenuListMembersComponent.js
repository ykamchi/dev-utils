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
            this.members = await window.conversations.apiMembers.membersList(this.membersListItems, selectedGroup);
            // Create ListComponent with filtered members
            // const items = Object.entries(this.members).map(m => ({ id: m.name, member: m }));
            this.list = new window.ListComponent(
                this.membersListItems,
                this.members,
                (item) => {
                    const memberDiv = document.createElement('div');
                    new window.conversations.CardMemberComponent(memberDiv, item);
                    return memberDiv;
                },
                window.ListComponent.SELECTION_MODE_SINGLE,
                (selectedItems) => {
                    if (selectedItems.length > 0) {
                        this.onMemberSelect(selectedItems[0]);
                        this.list.storeLastSelected('members-list-last-selection-' + this.selectedGroup, item => item.name);
                    } else {
                        this.onMemberSelect(null, this.members);
                    }
                },
                (item, query) => {
                    return item.name.toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Name', func: (a, b) => { return a.name < b.name ? -1 : 1; } , direction: 1 },
                    { label: 'Location', func: (a, b) => a.location < b.location ? -1 : 1, direction: 1 },
                    { label: 'Age', func: (a, b) => a.age < b.age ? -1 : 1, direction: 1 },
                ] 
            );

            // Restore last selection, or select first item
            this.list.setLastSelected('members-list-last-selection-' + this.selectedGroup, item => item.name);

        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuListMembersComponent = MenuListMembersComponent;
})();