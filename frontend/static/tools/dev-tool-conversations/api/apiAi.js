/*
    AI API client for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.apiAi = window.conversations.apiAi || {};

window.conversations.apiAi.autocomplete = async function (spinnerContainer, fullText, cursorPosition, leftFragment, rightFragment, context) {
    // No spinner for AI autocomplete (background operation, should be silent)
    
    try {
        const resp = await fetch('/api/dev-tool-conversations/ai_autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_text: fullText,
                cursor_position: cursorPosition,
                left_fragment: leftFragment,
                right_fragment: rightFragment,
                context: context
            })
        });

        const result = await resp.json();
        
        if (result.success && result.data) {
            console.log('[AI Autocomplete API] Response:', result.data);
            return result.data;
        } else {
            throw new Error(result.error || 'Failed to get autocomplete suggestion');
        }

    } catch (e) {
        console.error('Error fetching AI autocomplete:', e);
        // Don't show alert for autocomplete - it's a background operation
        return null;
    }
};
