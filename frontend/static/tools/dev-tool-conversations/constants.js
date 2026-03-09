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

window.conversations.CONVERSATION_TYPES_STRING = function (type, icon = true, name = true, startWithCapital = true, plural = true) {
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
    [window.conversations.CONVERSATION_STATE_COMPLETED]: '✔ Completed',
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

window.conversations.LLM_PROVIDER_OPTIONS =
{
    [window.conversations.LLM_PROVIDER_OLLAMA]: {
        label: '𖠿 Ollama',
        autoRun: true,
        value: window.conversations.LLM_PROVIDER_OLLAMA,
        models: {
            'llama3.1:8b': {
                input_price: 0, // Cost per token in USD
                cached_input_price: 0, // Cached input cost per token in USD
                output_price: 0, // Cost per output token in USD
            },
            'llama3.2:latest': {
                input_price: 0, // Cost per token in USD
                cached_input_price: 0, // Cached input cost per token in USD
                output_price: 0, // Cost per output token in USD
            },
            'qwen3:8b': {
                input_price: 0, // Cost per token in USD
                cached_input_price: 0, // Cached input cost per token in USD
                output_price: 0, // Cost per output token in USD
            }
        },
        defaultModel: 'llama3.1:8b'
    },
    [window.conversations.LLM_PROVIDER_OPENAI]: {
        label: '֎ OpenAI',
        autoRun: false,
        value: window.conversations.LLM_PROVIDER_OPENAI,
        models: {
            'gpt-4.1-mini': {
                input_price: 0.00000030, // Cost per token in USD
                cached_input_price: 0.00000003, // Cached input cost per token in USD
                output_price: 0.00000120, // Cost per output token in USD
            },
            'gpt-5-mini': {
                input_price: 0.00000125, // Cost per token in USD
                cached_input_price: 0.000000125, // Cached input cost per token in USD
                output_price: 0.00000500, // Cost per output token in USD
            },
            'gpt-4.1': {
                input_price: 0.00000500, // Cost per token in USD
                cached_input_price: 0.00000050, // Cached input cost per token in USD
                output_price: 0.00001500, // Cost per output token in USD
            },
            'gpt-5.2': {
                input_price: 0.00000500, // Cost per token in USD
                cached_input_price: 0.00000050, // Cached input cost per token in USD
                output_price: 0.00001500, // Cost per output token in USD
            }
        },
        defaultModel: 'gpt-4.1-mini'
    }
}
/*

14 turns conversation cost estimation for different models (assuming 20 messages per turn, 100 tokens per message, and the following token pricing: gpt-4.1-mini: $0.0007/1K tokens, gpt-5-mini: $0.003/1K tokens, gpt-4.1: $0.014/1K tokens, gpt-5.2: $0.014/1K tokens):
| Conversations | 4.1-mini | 5-mini | 4.1    | 5.2    |
| ------------- | -------- | ------ | ------ | ------ |
| 100           | $0.70    | ~$3    | $14    | $14    |
| 1,000         | $7       | ~$30   | $140   | $140   |
| 10,000        | $70      | ~$300  | $1,400 | $1,400 |

8 turns conversation cost estimation for different models (assuming 20 messages per turn, 100 tokens per message, and the following token pricing: gpt-4.1-mini: $0.0007/1K tokens, gpt-5-mini: $0.003/1K tokens, gpt-4.1: $0.014/1K tokens, gpt-5.2: $0.014/1K tokens):
| Conversations | gpt-4.1-mini | gpt-5-mini | gpt-4.1 | gpt-5.2 |
| ------------- | ------------ | ---------- | ------- | ------- |
| 100           | $0.48        | ~$2.0      | ~$9.7   | ~$9.7   |
| 1,000         | $4.83        | ~$20       | ~$97    | ~$97    |
| 10,000        | $48.3        | ~$200      | ~$970   | ~$970   |



Full Cost Table (1000 conversations)
Model	8 turns	14 turns
gpt-4.1-mini	$4.83	$8.45
gpt-5-mini	~$20	~$35
gpt-4.1	~$97	~$169
gpt-5.2	~$97	~$169

*/
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
