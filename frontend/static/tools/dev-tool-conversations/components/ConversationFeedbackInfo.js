(function() {
    'use strict';
    class ConversationFeedbackInfoComponent {
        constructor(container, feedback, instructions, onlyImportant = false, vertical = false) {
            this.container = container;
            this.feedback = feedback;
            this.instructions = instructions;
            this.onlyImportant = onlyImportant;
            this.vertical = vertical;
            this.render();
        }

        render() {
            const wrapperDiv = window.conversations.utils.createDivContainer(this.container, this.vertical ? 'conversation-container-vertical-wrap' : 'conversation-container-horizontal');
            
            if (!this.feedback || Object.keys(this.feedback).length === 0) {
                window.conversations.utils.createSpan(wrapperDiv, 'No feedback available yet');
                return;
            }

            // Get the feedback definitions and important flags from instructions
            const feedback_def = this.instructions?.feedback_def;
            const feedbackImportant = this.instructions?.info?.meta?.feedbackImportant || {};
            
            // Iterate over feedback entries and create fields
            for (const [key, value] of Object.entries(this.feedback)) {
                // Check if we should display this feedback field
                if (!this.onlyImportant || (feedbackImportant && feedbackImportant[key])) {
                    const feedbackDef = feedback_def[key];
                    
                    // Skip if no definition found - this is an error case
                    if (!feedbackDef) {
                        console.warn(`No feedback definition found for key: ${key}`);
                        continue;
                    }

                    // Create feedback field according to its type
                    const feedbackField = window.conversations.utils.createDivContainer(wrapperDiv, 'conversation-field-container-vertical', feedbackDef.description);
                    window.conversations.utils.createLabel(feedbackField, key);
                    if (feedbackDef.type === 'integer') {
                        new window.RateComponent(feedbackField, feedbackDef.min, feedbackDef.max, value, '100px', '18px', true);
                    } else {
                        window.conversations.utils.createReadOnlyText(feedbackField, value, 'conversations-field-value');
                    }
                }
            }
        }
    }

    // Ensure the namespace exists
    window.conversations = window.conversations || {};
    window.conversations.ConversationFeedbackInfoComponent = ConversationFeedbackInfoComponent;
})();