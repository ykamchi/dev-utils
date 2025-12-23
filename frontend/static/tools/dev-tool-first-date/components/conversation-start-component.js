// ConversationStartComponent.js
// Renders a popup with a grid of options for starting a conversation

class ConversationStartComponent {
    constructor(container, memberIds) {
        this.container = container;
        this.memberIds = memberIds;
        this.container.innerHTML = '';
        this.container.classList.add('conversation-start-popup');
        this.render();
    }

    async render() {
        // Show loading
        this.container.innerHTML = '<div class="conversation-start-loading">Loading options...</div>';
        try {
            const resp = await fetch('/api/dev-tool-first-date/group_instruction_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', conversation_type: 'ai_conversation' })
            });
            const options = await resp.json();
            this.renderGrid(options);
        } catch (e) {
            this.container.innerHTML = '<div class="conversation-start-error">Failed to load options.</div>';
        }
    }

    renderGrid(options) {
        this.container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'conversation-start-grid';
        if (Array.isArray(options) && options.length) {
            options.forEach((opt, idx) => {
                const cell = document.createElement('div');
                cell.className = 'conversation-start-cell conversation-start-cell-action';
                cell.title = opt.description || '';


                // Add name above the SVG image
                if (opt.name) {
                    const nameDiv = document.createElement('div');
                    nameDiv.textContent = opt.name;
                    nameDiv.className = 'conversation-start-name';
                    cell.appendChild(nameDiv);
                }

                // Use opt.type to reference the SVG image
                if (opt.type) {
                    const img = document.createElement('img');
                    img.src = `static/tools/dev-tool-first-date/images/${opt.type}.svg`;
                    img.alt = opt.label || opt.name || opt.type;
                    img.className = 'conversation-start-img';
                    cell.appendChild(img);
                }

                // Add description under the image
                if (opt.description) {
                    const desc = document.createElement('div');
                    desc.textContent = opt.description;
                    desc.className = 'conversation-start-desc';
                    cell.appendChild(desc);
                }


                cell.addEventListener('click', () => {
                    this.conversationStart(this.memberIds, opt.type);
                    if (this.container.closest('.popup-component')) {
                        const popup = this.container.closest('.popup-component');
                        if (popup && popup.hide) popup.hide();
                    }
                });
                grid.appendChild(cell);
            });
        } else {
            grid.innerHTML = '<div class="conversation-start-error">No options available.</div>';
        }
        this.container.appendChild(grid);
    }

    // Helper for starting a conversation
    async conversationStart(memberIds, contextType) {
        if (!Array.isArray(memberIds) || !memberIds.length) {
            alert('No members specified for conversation.');
            return;
        }
        try {
            const payload = {
                group_name: 'first-date',
                participant_members_ids: memberIds,
                max_messages: 14,
                context: { type: contextType }
            };
            await fetch('/api/dev-tool-first-date/conversation_start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (e) {
            alert('Failed to start conversation. See console for details.');
        }
    }
}

window.ConversationStartComponent = ConversationStartComponent;
