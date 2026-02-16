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
            new window.conversations.ManageSeedsImportComponent(
                wrapperDiv,
                null, // No groupId since we're creating a new group
                [window.conversations.SEED_TYPES.GROUP],
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
            new window.conversations.ManageSeedsImportComponent(wrapperDiv, groupId, [window.conversations.SEED_TYPES.MEMBERS]);
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
                new window.conversations.ManageSeedsImportComponent(wrapperDiv, groupId, [window.conversations.SEED_TYPES.INSTRUCTIONS_CONVERSATIONS]);

            } else if (conversation_type === window.conversations.CONVERSATION_TYPES.AI_DECISION) {
                // Create seed import component for decision instructions
                new window.conversations.ManageSeedsImportComponent(wrapperDiv, groupId, [window.conversations.SEED_TYPES.INSTRUCTIONS_DECISIONS]);

            } else {
                // Create seed import component for all instructions
                new window.conversations.ManageSeedsImportComponent(wrapperDiv, groupId, [window.conversations.SEED_TYPES.INSTRUCTIONS_ALL]);
            }

        },
        onClose: () => onClose && onClose()
    });
    popup.show();
}
