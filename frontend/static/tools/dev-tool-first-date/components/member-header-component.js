// member-header-component.js
// Renders the member profile header and details

class MemberHeaderComponent {
    constructor(container, member) {
        this.container = container;
        this.member = member;
        this.render();
    }

    render() {
        let headerHtml = '';
        if (this.member) {
            const m = this.member;
            headerHtml = `
                <div class="first-date-profile-header">
                    <h2>${m.name}</h2>
                    <div class="first-date-meta">${m.gender} • ${m.age} years</div>
                </div>
                <div class="first-date-profile-body">
                    <div class="first-date-profile-left">
                        <div class="first-date-avatar">👤</div>
                    </div>
                    <div class="first-date-profile-right">
                        <ul class="first-date-details">
                            <li><strong>Age:</strong> <span>${m.age}</span></li>
                            <li><strong>Location:</strong> <span>${m.location || ''}</span></li>
                            <li><strong>Height:</strong> <span>${m.height_in_inches || ''}</span> in</li>
                            <li><strong>Eyes:</strong> <span>${m.eye_color || ''}</span></li>
                            <li><strong>Hair:</strong> <span>${m.hair_color || ''}</span></li>
                            <li><strong>Occupation:</strong> <span>${m.occupation || ''}</span></li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            headerHtml = '<div class="first-date-profile-header empty"><h2>No member selected</h2></div>';
        }
        this.container.innerHTML = headerHtml;
    }
}

window.MemberHeaderComponent = MemberHeaderComponent;
