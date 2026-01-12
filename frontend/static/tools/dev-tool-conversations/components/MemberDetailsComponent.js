(function () {
    /*
        MemberDetails: right side tabset for member details in dev-tool-conversations
    */
    class MemberDetailsComponent {
        constructor(container, groupName, memberId, membersMap) {
            this.container = container;
            this.groupName = groupName;
            this.memberId = memberId;
            this.membersMap = membersMap;
            this.member = membersMap[memberId];
            this.render();
        }

        render() {
            this.container.innerHTML = '';

            // Create wrapper for details
            const wrapper = document.createElement('div');
            wrapper.className = 'conversations-page-details-wrapper';

            // Header with avatar and member details
            const headerDiv = document.createElement('div');
            headerDiv.className = 'conversations-page-details-header';

            // Emoji avatar
            const avatar = document.createElement('div');
            avatar.textContent = '👤';
            avatar.className = 'conversations-page-details-icon';
            headerDiv.appendChild(avatar);

            // Member info
            const infoDiv = document.createElement('div');
            infoDiv.className = 'conversations-page-details-info';

            // Member name
            const nameDiv = document.createElement('div');
            nameDiv.className = 'conversation-page-details-title';
            nameDiv.textContent = this.member.name;
            infoDiv.appendChild(nameDiv);

            // Member meta info
            const metaDiv = document.createElement('div');
            metaDiv.className = 'conversation-page-details-subtitle';

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

            // Gender (if exists)
            if (this.member.gender) {
                const genderLabel = document.createElement('span');
                genderLabel.textContent = 'Gender: ';
                const genderValue = document.createElement('b');
                genderValue.textContent = this.member.gender;
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
            tabsetDiv.className = 'conversations-profile-tabset';
            wrapper.appendChild(tabsetDiv);

            // Tabs definition (using TabsetComponent)
            const tabs = [
                { name: '🧑 Profile', populateFunc: (c) => this.renderProfileTab(c) },
                { name: '👀 Decisions', populateFunc: (c) => this.renderDecisionsTab(c) },
                { name: 'TODO', populateFunc: (c) => this.renderTodoTab(c) }
            ];

            // Optionally use a storageKey for tab persistence (showing the last selected tab)
            const storageKey = this.member ? `conversations-member-tabset` : '';
            new window.TabsetComponent(tabsetDiv, tabs, storageKey);

            this.container.appendChild(wrapper);
        }

        renderProfileTab(container) {
            new window.conversations.MemberProfileComponent(container, this.groupName, this.memberId, this.membersMap);
        }

        renderDecisionsTab(container) {
            new window.conversations.MemberDecisionsComponent(container, this.groupName, this.memberId, this.membersMap);
        }

        renderTodoTab(container) {
            container.innerHTML = '<div class="conversations-member-details-todo">TODO: Add more details here.</div>';
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.MemberDetailsComponent = MemberDetailsComponent;
})();