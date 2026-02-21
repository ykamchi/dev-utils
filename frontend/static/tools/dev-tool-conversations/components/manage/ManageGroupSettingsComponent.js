(function () {
    /*
        ManageGroupSettingsComponent: TODO - implement group settings UI and logic
    */
    class ManageGroupSettingsComponent {
        constructor(container, groupId, onGroupNameChange = null, onGroupDelete = null) {
            this.container = container;
            this.groupId = groupId;
            this.onGroupNameChange = onGroupNameChange;
            this.onGroupDelete = onGroupDelete;

            this.group = null;

            this.wrapper = null;

            this.render();
        }

        render() {
            this.wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');
            this.load();
        }

        async load() {
            this.group = await window.conversations.apiGroups.groupsGet(null, this.groupId);

            // Create tabset with tabs
            new TabsetComponent(
                this.wrapper,
                [
                    {
                        name: '👥 Group Definition',
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageGroupEditComponent(tabContentDiv, this.group, this.onGroupNameChange, this.onGroupDelete);
                        },
                    },
                    {
                        name: `${window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_DECISION, true, true, true, true)} Instructions`,
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageInstructionsComponent(tabContentDiv, this.group, window.conversations.CONVERSATION_TYPES.AI_DECISION);
                        }
                    },
                    {
                        name: `${window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_CONVERSATION, true, true, true, true)} Instructions`,
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageInstructionsComponent(tabContentDiv, this.group, window.conversations.CONVERSATION_TYPES.AI_CONVERSATION);
                        }
                    }
                ],
                `conversations-manage-settings-tabs-${this.groupId}` // Storage key for persistent tab selection
            );
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupSettingsComponent = ManageGroupSettingsComponent;
})();
