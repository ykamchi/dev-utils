(function () {
    /*
        MenuListMembersComponent: left side to select members in dev-tool-conversations
    */
    class MenuListMembersComponent {
        constructor(container, groupId, onMemberSelect) {
            this.container = container;
            this.groupId = groupId;
            this.onMemberSelect = onMemberSelect;
            this.members = {};
            this.list = null;
        
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-menu-selection-wrapper');

            // Create header
            const headerDiv = window.conversations.utils.createDivContainer(wrapper, 'conversations-menu-manage-header');

            // Header - Group
            window.conversations.utils.createReadOnlyText(headerDiv, 'Members', 'conversations-menu-selection-header');

            // Content container
            const contentContainer = window.conversations.utils.createDivContainer(wrapper, 'conversation-field-container-vertical-full');

            // Members list container
            this.memberSelectionContainer = window.conversations.utils.createDivContainer(contentContainer, 'conversations-menu-list-items');

            // Add and Delete and settings group button
            const buttonContainer = window.conversations.utils.createDivContainer(headerDiv, 'conversations-buttons-container');
            this.addButton = new window.ButtonComponent(buttonContainer, {
                label: '+',
                onClick: () => window.conversations.popups.addMember(this.groupId, () => this.loadContent()),
                type: window.ButtonComponent.TYPE_GHOST,
                tooltip: '+ Add members'
            });

            this.loadContent();
        }

        // Load members for the selected group
        async loadContent() {
            // Clear previous content
            this.memberSelectionContainer.innerHTML = '';

            this.members = await window.conversations.apiMembers.membersList(this.memberSelectionContainer, this.groupId);

            if (!this.members || Object.keys(this.members).length === 0) {
                window.conversations.utils.createReadOnlyText(this.memberSelectionContainer, 'No members available. Please add a member.', 'conversations-message-empty');
                this.onMemberSelect(null);
                this.list = null;
                
                return;
            }

            // Create ListComponent with filtered members
            // const items = Object.entries(this.members).map(m => ({ id: m.name, member: m }));
            this.list = new window.ListComponent(
                this.memberSelectionContainer,
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
                        this.list.storeLastSelected('members-list-last-selection-' + this.groupId, item => item.member_name);
                        
                    } else {
                        this.onMemberSelect(null);
                        
                    }
                },
                (item, query) => {
                    return item.member_name.toLowerCase().includes(query.toLowerCase());
                },
                [
                    { label: 'Name', func: (a, b) => { return a.member_name < b.member_name ? -1 : 1; } , direction: 1 },
                    { label: 'Location', func: (a, b) => a.member_profile.location < b.member_profile.location ? -1 : 1, direction: 1 },
                    { label: 'Age', func: (a, b) => a.member_profile.age < b.member_profile.age ? -1 : 1, direction: 1 },
                ] 
            );

            // Restore last selection, or select first item
            this.list.setLastSelected('members-list-last-selection-' + this.groupId, item => item.member_name);
            // this.onMemberSelect(this.list.getSelectedItems()[0] || null);
        }

        async refreshMember(member) {
            console.log('[MenuListMembersComponent] Refreshing member:', member);
            // Update the specific member in the list without reloading from API
            if (member && this.list) {
                // Use the list's updateItem method to update only this member
                this.list.updateItem(member, (item) => item.member_id === member.member_id);
            }
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MenuListMembersComponent = MenuListMembersComponent;
})();