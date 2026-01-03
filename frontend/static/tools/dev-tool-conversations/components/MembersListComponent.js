// MembersListComponent: left side (formerly ConversationsMembersListComponent)
class MembersListComponent {
  constructor(root, { groupNames, onMemberSelect }) {
    this.root = root;
    this.groupNames = groupNames;
    this.onMemberSelect = onMemberSelect;
    this.selectedGroup = groupNames[0];
    this.members = [];
    this.filteredMembers = [];
    this.render();
    this.fetchMembers();
  }

  render() {
    this.root.innerHTML = `
      <div class="conversations-members-list">
        <div class="conversations-members-list-header">Group</div>
        <select class="conversations-group-select">
          ${this.groupNames.map(g => `<option value="${g}">${g}</option>`).join('')}
        </select>
        <div class="conversations-members-list-header">Members</div>
        <input class="conversations-members-search" type="text" placeholder="Search members..." />
        <div class="conversations-members-list-items"></div>
      </div>
    `;
    this.root.querySelector('.conversations-group-select').addEventListener('change', e => {
      this.selectedGroup = e.target.value;
      this.fetchMembers();
    });
    this.root.querySelector('.conversations-members-search').addEventListener('input', e => {
      this.filterMembers(e.target.value);
    });
  }

  async fetchMembers() {
    const url = `/api/dev-tool-conversations/members`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: this.selectedGroup })
      });
      const data = await resp.json();
      if (data.success && data.members && typeof data.members === 'object') {
        // Convert object to array
        this.members = Object.values(data.members);
        this.filterMembers(this.root.querySelector('.conversations-members-search').value || '');
      } else {
        this.members = [];
        this.filterMembers('');
      }
    } catch (e) {
      this.members = [];
      this.filterMembers('');
    }
  }

  filterMembers(query) {
    query = (query || '').toLowerCase();
    this.filteredMembers = (this.members || []).filter(m => {
      const name = m.member_nick_name || m.name || '';
      const location = m.location || '';
      return name.toLowerCase().includes(query) || location.toLowerCase().includes(query);
    });
    this.renderMembersList();
  }

  renderMembersList() {
    const list = this.root.querySelector('.conversations-members-list-items');
    if (!list) return;
    // Use the same class names and structure as the first-date tool
    let html = '<ul class="members-list">';
    if (this.filteredMembers.length === 0) {
      html += '<li class="empty">No members found</li>';
    } else {
      for (const m of this.filteredMembers) {
        html += `
          <li class="member-item" data-id="${m.name}" tabindex="0">
            <div class="avatar">${'👤'}</div>
            <div class="member-info">
              <div class="member-name">${m.name}</div>
              <div class="member-meta">${m.location} • ${m.age}</div>
            </div>
          </li>
        `;
      }
    }
    html += '</ul>';
    list.innerHTML = html;
    // Add click handler for selection
    list.querySelectorAll('.member-item').forEach(item => {
      item.addEventListener('click', () => {
        const memberId = item.getAttribute('data-id');
        this.selectMember(memberId);
      });
    });
  }

  selectMember(memberId) {
    // Highlight selected
    const list = this.root.querySelector('.conversations-members-list-items');
    if (!list) return;
    list.querySelectorAll('.member-item').forEach(item => {
      if (String(item.getAttribute('data-id')) === String(memberId)) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    const member = (this.members || []).find(m => String(m.name) === String(memberId));
    if (member && this.onMemberSelect) this.onMemberSelect(member);
  }
}

window.MembersListComponent = MembersListComponent;
