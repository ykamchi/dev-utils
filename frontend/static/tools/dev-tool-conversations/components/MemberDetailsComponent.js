// MemberDetails: right side tabset for member details in dev-tool-conversations
(function() {
class MemberDetailsComponent {
  constructor(root, member) {
    this.root = root;
    this.member = member;
    this.render();
  }

  render() {
    this.root.innerHTML = '';

    // Create wrapper for details
    const wrapper = document.createElement('div');
    wrapper.className = 'member-details-wrapper';

    // Header with avatar and member details
    const headerDiv = document.createElement('div');
    headerDiv.className = 'member-details-header';


    // Emoji avatar
    const avatar = document.createElement('div');
    avatar.textContent = '👤';
    avatar.className = 'member-details-avatar';
    headerDiv.appendChild(avatar);

    // Member info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'member-details-info';

    // Member name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'member-details-name';
    nameDiv.textContent = this.member.name;
    infoDiv.appendChild(nameDiv);

  // Member meta info
  const metaDiv = document.createElement('div');
  metaDiv.className = 'member-details-meta';
  
  // Age
  const ageLabel = document.createElement('span');
  ageLabel.textContent = 'Age: ';
  const ageValue = document.createElement('b');
  ageValue.textContent = this.member.age;
  metaDiv.appendChild(ageLabel);
  metaDiv.appendChild(ageValue);

  // Separator
  const sep1 = document.createElement('span');
  sep1.innerHTML = ' &nbsp; | &nbsp; ';
  metaDiv.appendChild(sep1);

  // Gender
  if (this.member.gender) {
    const genderLabel = document.createElement('span');
    genderLabel.textContent = 'Gender: ';
    const genderValue = document.createElement('b');
    genderValue.text = this.member.gender;
    metaDiv.appendChild(genderLabel);
    metaDiv.appendChild(genderValue);
    
    // Separator  
    const sepGender = document.createElement('span');
    sepGender.innerHTML = ' &nbsp; | &nbsp; ';
    metaDiv.appendChild(sepGender);
  }


  // Location
  const locationLabel = document.createElement('span');
  locationLabel.textContent = 'Location: ';
  const locationValue = document.createElement('b');
  locationValue.textContent = this.member.location;
  metaDiv.appendChild(locationLabel);
  metaDiv.appendChild(locationValue);

  // Separator
  const sep2 = document.createElement('span');
  sep2.innerHTML = ' &nbsp; | &nbsp; ';
  metaDiv.appendChild(sep2);


  // Occupation
  const occupationLabel = document.createElement('span');
  occupationLabel.textContent = 'Occupation: ';
  const occupationValue = document.createElement('b');
  occupationValue.textContent = this.member.occupation;
  metaDiv.appendChild(occupationLabel);
  metaDiv.appendChild(occupationValue);

  infoDiv.appendChild(metaDiv);
    headerDiv.appendChild(infoDiv);

    wrapper.appendChild(headerDiv);

    // Tabset container
    const tabsetDiv = document.createElement('div');
    tabsetDiv.className = 'first-date-profile-tabset';
    wrapper.appendChild(tabsetDiv);

    // Tabs definition (using TabsetComponent)
    const tabs = [
      { name: 'Profile', populateFunc: (c) => this.renderProfileTab(c) },
      { name: 'TODO', populateFunc: (c) => this.renderTodoTab(c) }
    ];
    // Optionally use a storageKey for tab persistence
    const storageKey = this.member ? `conversations-member-tabset` : '';
    new window.TabsetComponent(tabsetDiv, tabs, storageKey);

    this.root.appendChild(wrapper);
  }

  renderProfileTab(container) {
    new window.MemberProfileComponent(container, this.member);
  }

  renderTodoTab(container) {
  container.innerHTML = '<div class="member-details-todo">TODO: Add more details here.</div>';
  }
}
window.Conversations = {};
window.Conversations.MemberDetailsComponent = MemberDetailsComponent;
})();