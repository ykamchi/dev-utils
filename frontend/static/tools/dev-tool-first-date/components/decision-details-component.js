// DecisionDetailsComponent.js
// Renders the details for a decision in a popup

class DecisionDetailsComponent {
    constructor(container, decision, memberId) {
        this.container = container;
        this.decision = decision;
        this.currentMember = this.decision.members.find(m => m.member_id === memberId);
        this.otherMember = this.decision.members.find(m => m.member_id !== memberId);
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="first-date-decision-popup" style="display:flex;flex-direction:column;">
                <div><strong>Decision ID:</strong> ${this.decision.decision_id}</div>
                <div><strong>Context Type:</strong> ${this.decision.context.type}</div>
                <div><strong>Date:</strong> ${this.decision.created_at}</div>
                <div><strong>Rating Member:</strong> ${this.currentMember.member_nick_name}</div>
                <div><strong>Rated Member:</strong> ${this.otherMember.member_nick_name}</div>
                <div><strong>Members:</strong> ${this.currentMember.member_nick_name} (${this.currentMember.member_id}), ${this.otherMember.member_nick_name} (${this.otherMember.member_id})</div>
                <div style="margin-top:8px;">
                    <strong>Feedback:</strong>
                    <ul style="margin:4px 0 0 0;">
                        <li>Rate: <span style="color:${window.getRateColor(this.decision.feedback.rate)};font-weight:bold;">${this.decision.feedback.rate}</span></li>
                        <li>Rate (reverse): <span style="color:${window.getRateColor(this.decision.feedback['rate-reverse'])};font-weight:bold;">${this.decision.feedback['rate-reverse']}</span></li>
                    </ul>
                </div>
                <div style="margin-top:12px;display:flex;flex-direction:column;flex: 1;overflow:auto;">
                    <strong>Response:</strong>
                    <div style="background:#f6f6f6;padding:8px;border-radius:4px;white-space:pre-line;overflow:auto;">
                        ${this.decision.response}
                    </div>
                </div>
                <div style="margin-top:18px; display: flex; justify-content: center; gap: 12px;">
                    <button id="firstDateBtn" class="dating-button secondary">💑 First date</button>
                    <button id="newDecisionBtn" class="dating-button secondary">🗳️ New decision</button>
                </div>
            </div>
        `;
        setTimeout(() => {
            const firstDateBtn = this.container.querySelector('#firstDateBtn');
            if (firstDateBtn) {
                firstDateBtn.addEventListener('click', () => {
                    this.conversationStart([this.currentMember.member_id, this.otherMember.member_id]);
                    if (this.container.closest('.popup-component')) {
                        // Try to close the popup if possible
                        const popup = this.container.closest('.popup-component');
                        if (popup && popup.hide) popup.hide();
                    }
                });
            }
            const newDecisionBtn = this.container.querySelector('#newDecisionBtn');
            if (newDecisionBtn) {
                newDecisionBtn.addEventListener('click', () => {
                    this.startNewDecision([this.currentMember.member_id, this.otherMember.member_id]);
                });
            }
        }, 0);

    }

    // Helper for starting a conversation
    async conversationStart(memberIds) {
        if (!Array.isArray(memberIds) || !memberIds.length) {
            alert('No members specified for conversation.');
            return;
        }
        try {
            const payload = {
                group_name: 'first-date',
                participant_members_ids: memberIds,
                max_messages: 14,
                context: { type: 'first-date' }
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

    // Helper for starting a new decision
    async startNewDecision(memberIds) {
        if (!Array.isArray(memberIds) || memberIds.length !== 2) {
            alert('Need exactly two members for a decision.');
            return;
        }
        try {
            const payload = {
                group_name: 'first-date',
                participant_members_ids: memberIds,
                context: { type: 'view-profile' }
            };
            await fetch('/api/dev-tool-first-date/decision_start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            alert('New decision started between members.');
        } catch (e) {
            alert('Failed to start new decision. See console for details.');
        }
    }
}

window.DecisionDetailsComponent = DecisionDetailsComponent;
