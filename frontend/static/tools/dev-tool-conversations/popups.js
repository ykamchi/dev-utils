/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.popups = window.conversations.popups || {};

window.conversations.popups.addGroup = async function (onAdded = null, onClose = null) {
    const popup = new window.PopupComponent({
        icon: '👥',
        title: 'Add New Group',
        width: 1200,
        height: 720,
        content: (container) => {
            const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

            // Create seed import component for groups
            new window.conversations.SeedImportComponent(
                wrapperDiv,
                null, // No groupId since we're creating a new group
                window.conversations.SEED_TYPES.GROUP,
                (added) => {
                    // Callback when seeds are imported
                    popup.hide();
                    if (onAdded) onAdded(added);
                }
            );
        },
        onClose: () => onClose && onClose()
    });
    popup.show();
}

window.conversations.popups.addMember = async function (groupId, onClose = null) {
    const popup = new window.PopupComponent({
        icon: '✏️',
        title: 'Import Members',
        width: 1200,
        height: 720,
        content: (container) => {
            const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

            // Create seed import component for members
            new window.conversations.SeedImportComponent(wrapperDiv, groupId, window.conversations.SEED_TYPES.MEMBERS);
        },
        onClose: () => onClose && onClose()
    });
    popup.show();
}

window.conversations.popups.addInstruction = async function (groupId, conversation_type, onClose = null) {
    const popup = new window.PopupComponent({
        icon: window.conversations.CONVERSATION_TYPES_ICONS[conversation_type],
        title: `Import ${window.conversations.CONVERSATION_TYPES_STRING(conversation_type, false, true, true, false)} Instruction`,
        width: 1200,
        height: 720,
        content: (container) => {
            const wrapperDiv = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

            if (conversation_type === window.conversations.CONVERSATION_TYPES.AI_CONVERSATION) {
                // Create seed import component for conversation instructions
                new window.conversations.SeedImportComponent(wrapperDiv, groupId, window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS);

            } else if (conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
                // Create seed import component for decision instructions
                new window.conversations.SeedImportComponent(wrapperDiv, groupId, window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS);

            } else {
                // Create seed import component for all instructions
                new window.conversations.SeedImportComponent(wrapperDiv, groupId, window.conversations.SEED_TYPES.INSTRUCTIONS_ALL);
            }

        },
        onClose: () => onClose && onClose()
    });
    popup.show();
}


window.conversations.popups.openGroupSettings = async function (groupId, onGroupNameChange = null, onGroupDelete = null) {
    const popup = new window.PopupComponent({
        icon: '⚙️',
        title: 'Group Settings',
        width: 1920,
        height: 1080,
        content: (container) => {
            new window.conversations.ManageGroupSettingsComponent(
                container,
                groupId,
                onGroupNameChange,
                onGroupDelete
            );
        }
    });
    popup.show();
}

window.conversations.popups.openConversationView = async function (conversationId, conversationType, member) {
    new window.PopupComponent({ 
        icon: window.conversations.CONVERSATION_TYPES_ICONS[conversationType],
        title: 'Conversation Details',
        content: (container) => {
            new window.conversations.ConversationViewComponent(container, conversationId, member);
        },
        closable: true,
        width: '1920px',
        height: '1080px'
    }).show();
}

window.conversations.popups.openSystemSettings = async function () {
    let systemViewComponent = null;
    
    const popup = new window.PopupComponent({
        icon: '🛠️',
        title: 'System Settings',
        width: 1920,
        height: 1080,
        content: (container) => {
            systemViewComponent = new window.conversations.SystemViewComponent(container);
        },
        onClose: () => {
            // Clean up the component when popup closes
            if (systemViewComponent && systemViewComponent.destroy) {
                systemViewComponent.destroy();
            }
        }
    });
    popup.show();
}

window.conversations.popups.startConversation = async function (group, member, groupInstructions, conversation_type, onConversationStarted = null) {
    const popup = new window.PopupComponent({
        icon: window.conversations.CONVERSATION_TYPES_ICONS[conversation_type],
        title: 'Start new ' + window.conversations.CONVERSATION_TYPES_STRING(conversation_type, false, true, false, false),
        content: (container) => {
            new window.conversations.MemberConversationStartComponent(
                container, 
                group, 
                member, 
                conversation_type, 
                popup,
                onConversationStarted
            );
        },
        closable: true,
        width: '1920px',
        height: '1080px'
    });
    popup.show();
}

