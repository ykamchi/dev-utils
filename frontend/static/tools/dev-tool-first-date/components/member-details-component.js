// MemberDetailsComponent.js
// Encapsulates the member details for reuse


class MemberDetailsComponent {
    constructor(container, selected_member_id, members) {
        container.innerHTML = '';
        this.container = container;
        this.selected_member_id = selected_member_id;
        this.member = members[selected_member_id];
        this.members = members;
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

    // Register Agent button removed

        // Add View Profile button
        const viewProfileBtn = document.createElement('button');
        viewProfileBtn.id = 'first-date-viewProfileBtn';
        viewProfileBtn.className = 'dating-button secondary';
        viewProfileBtn.textContent = 'View Profile';
        viewProfileBtn.addEventListener('click', () => this.showViewProfilePopup());

        const findDatingBtn = document.createElement('button');
        findDatingBtn.id = 'first-date-startDatingBtn';
        findDatingBtn.className = 'dating-button secondary';
        findDatingBtn.textContent = 'Find dating';
        findDatingBtn.addEventListener('click', () => this.findDating());

        actionsDiv.appendChild(viewProfileBtn);
        actionsDiv.appendChild(findDatingBtn);
        contentDiv.appendChild(actionsDiv);

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
            body: JSON.stringify({ member_id: this.selected_member_id })
        }).then(res => res.json()).then(decisions => {
            if (decisions.length) {
                // First filter only CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE decisions and get latest per member
                const latestDecisions = {};
                for (const decision of decisions) {
                    if (decision.context.type === CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE) {
                        const other = decision.members.find(mem => String(mem.member_id) !== String(this.selected_member_id));
                        if (!latestDecisions[other.member_nick_name] || new Date(decision.created_at) > new Date(latestDecisions[other.member_nick_name].created_at)) {
                            latestDecisions[other.member_nick_name] = {
                                ...decision,
                                nick: other.member_nick_name,
                                rate: decision.feedback ? decision.feedback.rate : '',
                                confidence_level: decision.feedback ? decision.feedback.confidence_level : ''
                            };
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
                            <span class="first-date-conversation-rate" style="color:${window.getRateColor(decision.rate)};">(${decision.rate})</span>
                            <span class="first-date-conversation-confidence" style="color:${getConfidenceColor(decision.confidence_level)};">confidence: ${decision.confidence_level}</span>
                        </div>
                        <div class="first-date-conversation-meta">${new Date(decision.created_at).toLocaleString()}</div>
                    `;
                    li.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        await this.showDecisionDetailsPopup(decision, this.selected_member_id);
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
        let sortBy = 'date';
        let onlyLast = false;
        const currentMemberId = this.member ? this.member.id : null;
        const self = this;

        // Create filter/sort bar container
        const filterBar = document.createElement('div');
        filterBar.className = 'first-date-filter-bar';

        // Checkbox for only last date per member
        const onlyLastLabel = document.createElement('label');
        onlyLastLabel.className = 'first-date-only-last-label';

        const onlyLastCheckbox = document.createElement('input');
        onlyLastCheckbox.type = 'checkbox';
        onlyLastCheckbox.checked = onlyLast;
        onlyLastCheckbox.style.margin = '0';
        onlyLastCheckbox.addEventListener('change', function () {
            onlyLast = onlyLastCheckbox.checked;
            fetchAndRender();
        });
        onlyLastLabel.appendChild(onlyLastCheckbox);
        onlyLastLabel.appendChild(document.createTextNode('Show only last date per member'));
        filterBar.appendChild(onlyLastLabel);

        // Sort option buttons with label
        const sortLabel = document.createElement('span');
        sortLabel.textContent = 'Sort by:';
        sortLabel.style.marginRight = '4px';
        sortLabel.style.fontSize = '1em';
        sortLabel.style.fontWeight = 'normal';
        const sortContainer = document.createElement('div');
        sortContainer.style.display = 'flex';
        sortContainer.style.alignItems = 'center';
        sortContainer.style.gap = '8px';
        const sortOptions = [
            { label: 'Date', value: 'date' },
            { label: 'Match', value: 'match' },
            { label: 'Name', value: 'name' }
        ];
        let optionButtons = new window.OptionButtonsComponent(sortContainer, sortOptions, sortBy, (val) => {
                sortBy = val;
                renderList();
            }
        );
        const sortBar = document.createElement('div');
        sortBar.style.display = 'flex';
        sortBar.style.alignItems = 'center';
        sortBar.appendChild(sortLabel);
        sortBar.appendChild(sortContainer);
        filterBar.appendChild(sortBar);
        c.appendChild(filterBar);

        // Fetch and render function
        function fetchAndRender() {
            // Fetch conversation for first dates using async fetch
            fetch('/api/dev-tool-first-date/member_conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ member_id: self.selected_member_id, only_last: onlyLast })
            }).then(res => res.json()).then(conversations => {
                firstDatesData = Array.isArray(conversations) ? conversations : [];

                renderList();
            })
                .catch(e => {
                    firstDatesError = '<p>Error loading first dates.</p>';
                    renderList();
                });
        }

        fetchAndRender();

        // Create sort option buttons container
        // Render list function (unchanged)
        function renderList() {
            // Remove old list if exists
            if (firstDatesTagsDiv && firstDatesTagsDiv.parentNode) {
                firstDatesTagsDiv.parentNode.removeChild(firstDatesTagsDiv);
            }
            firstDatesTagsDiv = document.createElement('ul');
            firstDatesTagsDiv.className = 'first-date-first-dates-list';
            let sorted = [...firstDatesData];
            if (sortBy === 'date') {
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (sortBy === 'match') {
                sorted.sort((a, b) => {
                    let am = (a.last_feedback && typeof a.last_feedback === 'object' && a.last_feedback.match !== undefined) ? a.last_feedback.match : '';
                    let bm = (b.last_feedback && typeof b.last_feedback === 'object' && b.last_feedback.match !== undefined) ? b.last_feedback.match : '';
                    // Sort descending, numbers first, then strings
                    if (!isNaN(am) && !isNaN(bm)) return Number(bm) - Number(am);
                    return String(bm).localeCompare(String(am));
                });
            } else if (sortBy === 'name') {
                sorted.sort((a, b) => {
                    const an = (a.members.find(mem => mem.member_id !== currentMemberId) || {}).member_nick_name || '';
                    const bn = (b.members.find(mem => mem.member_id !== currentMemberId) || {}).member_nick_name || '';
                    return an.localeCompare(bn);
                });
            }
            if (sorted.length) {
                for (const conversation of sorted) {
                    const other = conversation.members.find(mem => String(mem.member_nick_name) !== String(self.member.name));
                    let match = '';
                    if (conversation.last_feedback && typeof conversation.last_feedback === 'object') {
                        match = conversation.last_feedback.match !== undefined ? conversation.last_feedback.match : '';
                    }
                    const li = document.createElement('li');
                    li.className = 'first-date-first-dates-item';
                    li.title = 'View conversation details';
                    // info.name in bottom right, small italic
                    const infoName = conversation.info && conversation.info.name ? conversation.info.name : '';
                    li.innerHTML = `
                        <div class="first-date-conversation-item">
                            <span class="first-date-conversation-dot" style="background:black;"></span>
                            <span class="first-date-conversation-nick">${other ? other.member_nick_name : ''}</span>
                            <span class="first-date-conversation-rate">(${match})</span>
                        </div>
                        <div class="first-date-conversation-meta" style="display:flex;justify-content:space-between;align-items:end;">
                            <span>${conversation.created_at ? new Date(conversation.created_at).toLocaleString() : ''}</span>
                            <span style="font-size:0.85em;font-style:italic;opacity:0.7;">${infoName}</span>
                        </div>
                    `;
                    li.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (self && self.showConversationPopup) {
                            await self.showConversationPopup(conversation, currentMemberId);
                        }
                    });
                    firstDatesTagsDiv.appendChild(li);
                }
                c.appendChild(firstDatesTagsDiv);
            } else {
                c.innerHTML += firstDatesError || '<p>No first dates found.</p>';
            }
        }
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
                if (decision.context.type === CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE) {
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
                    context: { type: CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE }
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

    async showViewProfilePopup() {
        new window.PopupComponent({
            icon: '👀',
            title: 'View Profile Candidates',
            width: 420,
            height: 720,
            content: (container) => { new window.SelectMemberToViewComponent(container, this.selected_member_id, this.members); },
        }).show();
    }




    // Popup for decision details - view profile
    async showDecisionDetailsPopup(decision, memberId) {
        new window.PopupComponent({
            icon: '🗳️', title: 'Viewed Profile - Decision Details', width: 520, height: 720,
            content: (container) => { return new window.MemberDecisionDetailsComponent(container, decision, memberId, this.members); },
        }).show();
    }

    // Popup for conversation details - first date
    async showConversationPopup(conversation, memberId) {
        new window.PopupComponent({
            icon: '💬', title: 'First Date - Conversation Details', width: 1280, height: 960,
            content: (container) => { return new window.ConversationDetailsComponent(container, conversation); },
        }).show();
    }
}

window.MemberDetailsComponent = MemberDetailsComponent;
