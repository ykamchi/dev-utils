// MemberDetailsComponent.js
// Encapsulates the member details for reuse


class MemberDetailsComponent {
    constructor(container, member, members) {
        container.innerHTML = '';
        this.container = container;
        this.member = member;
        this.members = members || [];
        this.render();
    }

    async render() {
        // Create flex column wrapper
        const contentDiv = document.createElement('div');
        contentDiv.className = 'first-date-profile-content';
        

        // Create header using MemberHeaderComponent
        const headerDiv = document.createElement('div');
        headerDiv.className = 'first-date-profile-header-wrapper';
        new window.MemberHeaderComponent(headerDiv, this.member);
        contentDiv.appendChild(headerDiv);


        // Create tabset 
        const tabsetDiv = document.createElement('div');
        tabsetDiv.className = 'first-date-profile-tabset';
        contentDiv.appendChild(tabsetDiv);
        const tabs = [
            { name: '📝 Details', populateFunc: this.populateDetailsTab.bind(this) },
            { name: '👀 Viewed Profiles', populateFunc: this.populateViewedProfilesTab.bind(this) },
            { name: '💑 First Dates', populateFunc: this.populateFirstDatesTab.bind(this) }
        ];
        // Use a unique storageKey per member
        const storageKey = this.member ? `member-tabset` : '';
        new window.TabsetComponent(tabsetDiv, tabs, storageKey);
        
        // Create action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.id = 'first-date-profileActionsLeft';
        actionsDiv.className = 'first-date-profile-actions-left';

        const registerBtn = document.createElement('button');
        registerBtn.id = 'first-date-registerBtn';
        registerBtn.className = 'first-date-dating-button';
        registerBtn.textContent = 'Register Agent';
        registerBtn.addEventListener('click', () => this.toggleRegister());

        const findDatingBtn = document.createElement('button');
        findDatingBtn.id = 'first-date-startDatingBtn';
        findDatingBtn.className = 'first-date-dating-button secondary';
        findDatingBtn.textContent = 'Find dating';
        findDatingBtn.addEventListener('click', () => this.findDating());

        actionsDiv.appendChild(registerBtn);
        actionsDiv.appendChild(findDatingBtn);
        contentDiv.appendChild(actionsDiv);

        // Update register button state
        this.updateRegisterButton();
        // Clear and append
        this.container.innerHTML = '';
        this.container.appendChild(contentDiv);
        if (!this.member) {
            this.container.innerHTML += '<div class="first-date-profile empty"><p>No member selected.</p></div>';
            return;
        }
    }

    populateDetailsTab(c) {
        if (!this.member) {
            c.innerHTML = '<div class="first-date-profile empty"><p>No member selected.</p></div>';
            return;
        }
        const detailsTabHtml = [
            '<div class="profile-details-tab" style="padding:12px 0;">',
            '<div style="font-size:1.05em;margin-bottom:8px;"><strong>Full Profile Data:</strong></div>',
            '<pre style="background:#f6f6f6;padding:12px;border-radius:6px;white-space:pre-wrap;font-size:0.98em;line-height:1.5;max-height:340px;overflow:auto;">',
            JSON.stringify(this.member, null, 2),
            '</pre>',
            '</div>'
        ].join('');
        c.innerHTML = detailsTabHtml;
    }

    populateViewedProfilesTab(c) {
        let viewedProfilesData = [];
        let membersTagsDiv = null;
        let viewedProfilesError = '';

        // Fetch decisions for viewed profiles using async fetch
        fetch('/api/dev-tool-first-date/member_decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: this.member.id })
        }).then(res => res.json()).then(decisions => {
            if (decisions.length) {
                // First filter only 'view-profile' decisions and get latest per member
                const latestDecisions = {};
                for (const decision of decisions) {
                    if (decision.context.type === 'view-profile') {
                        const other = decision.members.find(mem => mem.member_id !== this.member.id);
                        if (!latestDecisions[other.member_nick_name] || new Date(decision.created_at) > new Date(latestDecisions[other.member_nick_name].created_at)) {
                            latestDecisions[other.member_nick_name] = { ...decision, nick: other.member_nick_name, rate: decision.feedback ? decision.feedback.rate : '' };
                        }
                    }
                }

                // Create list of viewed profiles
                membersTagsDiv = document.createElement('ul');
                membersTagsDiv.className = 'first-date-viewed-profiles-list';
                for (const nick in latestDecisions) {
                    const decision = latestDecisions[nick];
                    const li = document.createElement('li');
                    li.className = 'first-date-viewed-profile-item';
                    li.title = 'View decision details';
                    li.innerHTML = `
                        <div class="first-date-conversation-item">
                            <span class="first-date-conversation-dot" style="background:${window.getRateColor(decision.rate)};"></span>
                            <span class="first-date-conversation-nick">${decision.nick}</span>
                            <span class="first-date-conversation-rate">(${decision.rate})</span>
                        </div>
                        <div class="first-date-conversation-meta">${new Date(decision.created_at).toLocaleString()}</div>
                    `;
                    li.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await this.showDecisionDetailsPopup(decision, this.member.id);
                    });
                    membersTagsDiv.appendChild(li);
                    viewedProfilesData.push(decision);
                }
            } else {
                viewedProfilesError = '<p>No viewed profiles found.</p>';
            }
        })
        .catch(e => {
            viewedProfilesError = '<p>Error loading viewed profiles.</p>';
        })
        .finally(() => {
            c.innerHTML = '';
            if (membersTagsDiv) {
                c.appendChild(membersTagsDiv);
            } else {
                c.innerHTML = viewedProfilesError;
            }
        });
    }
    
    populateFirstDatesTab(c) {
        let firstDatesData = [];
        let firstDatesError = '';
        let firstDatesTagsDiv = null;
        
        // Fetch conversation for first dates using async fetch
        fetch('/api/dev-tool-first-date/member_conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: this.member.id })
        }).then(res => res.json()).then(conversations => {
            if (conversations.length) {
                firstDatesTagsDiv = document.createElement('ul');
                firstDatesTagsDiv.className = 'first-date-first-dates-list';
                for (const conversation of conversations) {
                    const other = conversation.members.find(mem => mem.member_id !== this.member.id);
                    const li = document.createElement('li');
                    li.className = 'first-date-first-dates-item';
                    li.title = 'View conversation details';
                    li.innerHTML = `
                        <div class="first-date-conversation-item">
                            <span class="first-date-conversation-dot" style="background:black;"></span>
                            <span class="first-date-conversation-nick">${other.member_nick_name}</span>
                        </div>
                        <div class="first-date-conversation-meta">
                            ${new Date(conversation.created_at).toLocaleString()}
                        </div>
                    `;
                    li.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await this.showConversationPopup(conversation, this.member.id);
                    });
                    firstDatesTagsDiv.appendChild(li);
                    firstDatesData.push(conversation);
                }
            } else {
                firstDatesError = '<p>No first dates found.</p>';
            }
        })
        .catch(e => {
            firstDatesError = '<p>Error loading first dates.</p>';
        })
        .finally(() => {
            c.innerHTML = '';
            if (firstDatesTagsDiv) {
                c.appendChild(firstDatesTagsDiv);
            } else {
                c.innerHTML = firstDatesError;
            }
        });
    }

    async findDating() {
        // Fetch decisions to filter out already-decided
        fetch('/api/dev-tool-first-date/member_decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: this.member.id })
        }).then(res => res.json()).then(decisions => {
            console.log('Decided IDs:', decisions);
            // Create a set of members that their profile was already viewed
            const decidedIds = new Set();

            for (const decision of decisions) {
                if (decision.context.type === 'view-profile') {
                    decision.members.forEach(mem => {
                        if (mem.member_id !== this.member.id) {
                            decidedIds.add(mem.member_id);
                        }
                    });
                }
            }

            // Find candidate members with a different gender than this.member
            // select only those not in decidedIds - to avoid re-viewing profiles
            let candidates = this.members.filter(m => m.gender != this.member.gender && m.id != this.member.id && !decidedIds.has(m.id));
            
            if (!candidates.length) {
                alert('No available members to start dating with.');
                return;
            }

            // Select random candidate
            const randomIdx = Math.floor(Math.random() * candidates.length);
            const chosen = candidates[randomIdx];

            // Start decision with chosen member
            fetch('/api/dev-tool-first-date/decision_start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    group_name: 'first-date',
                    participant_members_ids: [this.member.id, chosen.id],
                    context: { type: 'view-profile' }
                })
            }).then(result => {
                alert('Started a new decision with ' + chosen.name + '!');
                this.render();
            })
            .catch(() => {
                alert('Failed to start decision. See console for details.');
            });
        })
        .catch(() => {
            alert('Failed to start decision. See console for details.');
        });
    }

    async updateRegisterButton() {
        const registerBtn = this.container.querySelector('#first-date-registerBtn');
        const startDatingBtn = this.container.querySelector('#first-date-startDatingBtn');
        if (!registerBtn || !this.member) return;
        try {
            registerBtn.disabled = true;
            const res = await fetch('/api/dev-tool-first-date/registered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', member_nick_name: this.member.member_nick_name })
            });
            const data = await res.json();
            const registered = data && (data.registered === true || data.registered === 'true');
            this.currentRegistered = Boolean(registered);
            registerBtn.textContent = this.currentRegistered ? 'Unregister Agent' : 'Register Agent';
            registerBtn.classList.toggle('registered', this.currentRegistered);
            registerBtn.classList.toggle('not-registered', !this.currentRegistered);
            if (startDatingBtn) {
                startDatingBtn.style.display = this.currentRegistered ? 'inline-block' : 'none';
            }
        } catch (e) {
            registerBtn.textContent = 'Register Agent';
            registerBtn.classList.remove('registered');
            registerBtn.classList.add('not-registered');
            if (startDatingBtn) {
                startDatingBtn.style.display = 'none';
            }
        } finally {
            registerBtn.disabled = false;
        }
    }

    async toggleRegister() {
        const registerBtn = this.container.querySelector('#first-date-registerBtn');
        if (!registerBtn || !this.member) return;
        try {
            // const nick = this.nicknameFor(this.member);
            registerBtn.disabled = true;
            const endpoint = this.currentRegistered ? '/api/dev-tool-first-date/unregister' : '/api/dev-tool-first-date/register';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ group_name: 'first-date', member_nick_name: this.member.member_nick_name })
            });
            const data = await res.json();
            await this.updateRegisterButton();
        } catch (e) {
            alert('Failed to contact registration API. See console for details.');
        } finally {
            registerBtn.disabled = false;
        }
    }

    // Popup for decision details - view profile
    async showDecisionDetailsPopup(decision, memberId) {
        new window.PopupComponent({
            icon: '🗳️', title: 'Viewed Profile - Decision Details', width: 520, height: 720,
            content: (container) => { new window.DecisionDetailsComponent(container, decision, memberId, this.members); },
        }).show();
    }

    // Popup for conversation details - first date
    async showConversationPopup(conversation, memberId) {
        new window.PopupComponent({
            icon: '💬', title: 'First Date - Conversation Details', width: 1280, height: 960,
            content: (container) => { new window.ConversationDetailsComponent(container, conversation); },
        }).show();
    }
}

window.MemberDetailsComponent = MemberDetailsComponent;
