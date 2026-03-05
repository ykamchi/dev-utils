/*
    Constants for dev-tool-conversations
*/

// Conversation types used with group_instruction_info API
window.conversations = window.conversations || {};
window.conversations.CONVERSATION_TYPES = {
    AI_DECISION: 'ai_decision',
    AI_CONVERSATION: 'ai_conversation',
}

window.conversations.CONVERSATION_TYPES_ICONS = {
    [window.conversations.CONVERSATION_TYPES.AI_DECISION]: '⚖️',
    [window.conversations.CONVERSATION_TYPES.AI_CONVERSATION]: '💬',
}

window.conversations.CONVERSATION_TYPES_NAMES = {
    [window.conversations.CONVERSATION_TYPES.AI_DECISION]: 'decision',
    [window.conversations.CONVERSATION_TYPES.AI_CONVERSATION]: 'conversation',
}

window.conversations.CONVERSATION_TYPES_STRING = function(type, icon = true, name = true, startWithCapital = true, plural = true) {
    let result = '';
    if (icon) {
        result += window.conversations.CONVERSATION_TYPES_ICONS[type] + ' ';
    }
    if (name) {
        let typeName = window.conversations.CONVERSATION_TYPES_NAMES[type] || 'unknown';
        if (startWithCapital) {
            typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
        }
        if (plural) {
            typeName += 's';
        }
        result += typeName;
    }
    return result.trim();
}

window.conversations.CONVERSATION_TYPES_OPTIONS = [
    { label: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_CONVERSATION), value: window.conversations.CONVERSATION_TYPES.AI_CONVERSATION },
    { label: window.conversations.CONVERSATION_TYPES_STRING(window.conversations.CONVERSATION_TYPES.AI_DECISION), value: window.conversations.CONVERSATION_TYPES.AI_DECISION }
]

window.conversations.CONVERSATION_PRIORITY_OPTIONS = [
    { label: 'Low', value: -1 },
    { label: 'Standard', value: 0 },
    { label: 'Important', value: 1 }
]

// Seed types for SeedImportComponent
window.conversations.SEED_TYPES = {
    GROUP: 'group',
    MEMBERS: 'members',
    INSTRUCTIONS_CONVERSATIONS: 'instructions_conversations',
    INSTRUCTIONS_DECISIONS: 'instructions_decisions',
    INSTRUCTIONS_ALL: 'instructions_all',
    ROLES: 'roles'
}

window.conversations.CONVERSATION_STATE_FAILED = 'failed';
window.conversations.CONVERSATION_STATE_COMPLETED = 'completed';
window.conversations.CONVERSATION_STATE_RUNNING = 'running';
window.conversations.CONVERSATION_STATE_STOPPED = 'stopped';
window.conversations.CONVERSATION_STATE_PENDING = 'pending';
window.conversations.CONVERSATION_STATE_CREATED = 'created';
window.conversations.CONVERSATION_STATE_ICONS = {
    [window.conversations.CONVERSATION_STATE_COMPLETED]: '✔',
    [window.conversations.CONVERSATION_STATE_FAILED]: '✖',
    [window.conversations.CONVERSATION_STATE_RUNNING]: '🏃‍➡️',
    [window.conversations.CONVERSATION_STATE_STOPPED]: '✋',
    [window.conversations.CONVERSATION_STATE_PENDING]: '⏳',
    [window.conversations.CONVERSATION_STATE_CREATED]: '🆕'
}

window.conversations.CONVERSATION_STATE_LABELS = {
    [window.conversations.CONVERSATION_STATE_COMPLETED]: ' Completed',
    [window.conversations.CONVERSATION_STATE_FAILED]: '✖ Failed',
    [window.conversations.CONVERSATION_STATE_RUNNING]: '🏃‍➡️ Running',
    [window.conversations.CONVERSATION_STATE_STOPPED]: '✋ Stopped',
    [window.conversations.CONVERSATION_STATE_PENDING]: '⏳ Pending',
    [window.conversations.CONVERSATION_STATE_CREATED]: '🆕 Created'
}

window.conversations.CONVERSATION_STATE_OPTIONS = [
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_STOPPED], value: window.conversations.CONVERSATION_STATE_STOPPED },
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_PENDING], value: window.conversations.CONVERSATION_STATE_PENDING },
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_RUNNING], value: window.conversations.CONVERSATION_STATE_RUNNING },
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_COMPLETED], value: window.conversations.CONVERSATION_STATE_COMPLETED },
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_FAILED], value: window.conversations.CONVERSATION_STATE_FAILED },
    { label: window.conversations.CONVERSATION_STATE_LABELS[window.conversations.CONVERSATION_STATE_CREATED], value: window.conversations.CONVERSATION_STATE_CREATED }
];  

window.conversations.LLM_PROVIDER_OLLAMA = 'ollama';
window.conversations.LLM_PROVIDER_OPENAI = 'openai';

window.conversations.LLM_PROVIDER_AUTO = [window.conversations.LLM_PROVIDER_OLLAMA]

window.conversations.LLM_PROVIDER_OPTIONS =
[
    { label: '𖠿 Ollama', value: window.conversations.LLM_PROVIDER_OLLAMA },
    { label: '֎ OpenAI', value: window.conversations.LLM_PROVIDER_OPENAI }
]
// Default instructions template for conversations
window.conversations.DEFAULT_INSTRUCTIONS = `
This is a test conversation.

MANDATORY CONSTRAINTS:

- Emotional sharing is important.
- You must be realistic.

You should:
- Respond with inappropriate responses.
- Notice whether the emotional tone feels manageable.

You must NOT:
- Over-function emotionally.
- Escalate intimacy due to vulnerability alone.

Ratings RULES:
- Emotional intensity alone must NOT increase match.
- Discomfort or imbalance should reduce or neutralize interest.
`;

// Default feedback definition for conversations
window.conversations.DEFAULT_FEEDBACK_DEF = {
    rate: {
        description: 'rate how much would you like the other members (value 1-10)',
        type: 'integer',
        min: 1,
        max: 10,
        required: true,
    },
};

// Default info definition for conversations
window.conversations.DEFAULT_INFO = {
    name: 'Default Instructions',
    description: 'Default instructions automatically generated by the system.',
}
