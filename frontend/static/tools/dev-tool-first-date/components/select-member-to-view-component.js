// Encapsulates the member selection popup for viewing profiles
class SelectMemberToViewComponent {
    constructor(container, selected_member_id, members) {
        this.selected_member_id = selected_member_id;
        this.members = members;
        this.currentMember = members[selected_member_id];
        this.render(container);
    }

    async render(container) {
        // Fetch decisions for viewed profiles
        const res = await fetch('/api/dev-tool-first-date/member_decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ member_id: this.currentMember.id })
        });
        const decisions = await res.json();
        // Map memberId to their latest view-profile decision (for rate)
        const latestDecisionById = {};
        if (Array.isArray(decisions)) {
            for (const decision of decisions) {
                if (decision.context.type === CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE) {
                    const other = decision.members.find(mem => mem.member_id !== this.currentMember.id);
                    if (other) {
                        // Only keep the latest decision per member
                        if (!latestDecisionById[other.member_id] || new Date(decision.created_at) > new Date(latestDecisionById[other.member_id].created_at)) {
                            latestDecisionById[other.member_id] = decision;
                        }
                    }
                }
            }
        }

        // Filter state
        let showOnlyUnviewed = true;

        // Header (no filter checkbox)

        // Filter checkbox (to be placed at the bottom)
    const filterLabel = document.createElement('label');
    filterLabel.className = 'select-member-popup-filter-label';
        const filterCheckbox = document.createElement('input');
        filterCheckbox.type = 'checkbox';
        filterCheckbox.checked = true;
        filterCheckbox.id = 'show-only-unviewed';
        filterLabel.appendChild(filterCheckbox);
        filterLabel.appendChild(document.createTextNode('Show only un-viewed profiles'));

    container.innerHTML = '';
    // Make popup content a flex column
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.height = '100%';

    const renderList = () => {
            // Show all candidates of opposite gender except self
            let candidates = Object.values(this.members).filter(m => m.gender != this.currentMember.gender && m.name != this.currentMember.name);
            if (showOnlyUnviewed) {
                candidates = candidates.filter(m => !latestDecisionById[m.id]);
            }
            // Remove old list if exists
            let oldList = container.querySelector('.select-member-popup-list');
            if (oldList && oldList.parentNode) oldList.parentNode.removeChild(oldList);
            // Remove old filter if exists
            let oldFilter = container.querySelector('label[for="show-only-unviewed"]');
            if (oldFilter && oldFilter.parentNode) oldFilter.parentNode.removeChild(oldFilter);

            const listDiv = document.createElement('div');
            listDiv.className = 'select-member-popup-list select-member-popup-list-scroll';
            listDiv.style.flex = '1';
            candidates.forEach(member => {
                const row = document.createElement('div');
                row.className = 'select-member-popup-row';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'select-member-popup-name';
                nameSpan.textContent = member.name;
                row.appendChild(nameSpan);
                if (latestDecisionById[member.id]) {
                    // Already viewed: show rate with color
                    const rateSpan = document.createElement('span');
                    rateSpan.className = 'select-member-popup-rate';
                    const rate = latestDecisionById[member.id].feedback && latestDecisionById[member.id].feedback.rate !== undefined ? latestDecisionById[member.id].feedback.rate : '-';
                    rateSpan.textContent = `Rated: ${rate}`;
                    rateSpan.style.color = window.getRateColor ? window.getRateColor(rate) : '';
                    row.appendChild(rateSpan);
                } else {
                    // Not viewed: show button
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'dating-button secondary select-member-popup-btn';
                    viewBtn.textContent = '⚖️ View Profile';
                    viewBtn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        viewBtn.disabled = true;
                        await fetch('/api/dev-tool-first-date/decision_start', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                group_name: 'first-date',
                                participant_members_nick_names: [this.currentMember.name, member.name],
                                context: { type: CONVERSATION_CONTEXT__TYPE_VIEW_PROFILE }
                            })
                        });
                        if (viewBtn.closest('.popup-component')) {
                            const popupEl = viewBtn.closest('.popup-component');
                            if (popupEl && popupEl.parentNode) popupEl.parentNode.removeChild(popupEl);
                        }
                    });
                    row.appendChild(viewBtn);
                }
                listDiv.appendChild(row);
            });
            container.appendChild(listDiv);
            // Add filter checkbox at the bottom
            container.appendChild(filterLabel);
            if (!candidates.length) {
                container.innerHTML += '<div class="select-member-popup-empty">No available members to view.</div>';
            }
        };

        filterCheckbox.addEventListener('change', () => {
            showOnlyUnviewed = filterCheckbox.checked;
            renderList();
        });

        renderList();
    }
    
}

window.SelectMemberToViewComponent = SelectMemberToViewComponent;
