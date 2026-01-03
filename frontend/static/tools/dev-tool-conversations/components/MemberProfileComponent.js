// MemberProfileComponent: right side profile viewer for dev-tool-conversations
class MemberProfileComponent {
  constructor(root, member) {
    this.root = root;
    this.member = member;
    if (member) {
      this.renderProfile();
    } else {
      this.renderEmpty();
    }
  }

  renderEmpty() {
    this.root.innerHTML = '<div class="member-profile-empty">No member selected.</div>';
  }

  renderProfile() {
    this.root.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'member-profile-wrapper';

    // Header
    const header = document.createElement('div');
    header.className = 'member-profile-header';
    header.textContent = this.member.member_nick_name || this.member.name || 'Member';
    wrapper.appendChild(header);

    // JSON block
    const pre = document.createElement('pre');
    pre.className = 'member-profile-json';
    pre.textContent = JSON.stringify(this.member, null, 2);
    wrapper.appendChild(pre);

    this.root.appendChild(wrapper);
  }
}

window.MemberProfileComponent = MemberProfileComponent;
