(function () {
    /*
        ManageGroupSettingsComponent: TODO - implement group settings UI and logic
    */
    class ManageGroupSettingsComponent {
        constructor(container, groupId, onGroupNameChange = null, onMembersChanged = null) {
            this.container = container;
            this.groupId = groupId;
            this.onGroupNameChange = onGroupNameChange;
            this.onMembersChanged = onMembersChanged;

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

            // Create tabset with two tabs
            new TabsetComponent(
                this.wrapper,
                [

                    {
                        name: '🌐 System',
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageSystemComponent(tabContentDiv, this.groupId);
                        }
                    },
                    {
                        name: '👥 Group Definition',
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageGroupEditComponent(tabContentDiv, this.group, this.onGroupNameChange);
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
                    },
                    {
                        name: '📊 Statistics',
                        populateFunc: (tabContentDiv) => {
                            new window.conversations.ManageStatisticsComponent(tabContentDiv, this.groupId);
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
