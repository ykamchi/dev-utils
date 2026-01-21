// AlertComponent.js
// Generic alert/popup component for framework use

class AlertComponent {
    /**
     * @param {string} title - The title of the alert.
     * @param {string|HTMLElement} content - The content of the alert (text or HTML element).
     * @param {Array<[string, Function]>} [buttons] - Optional array of [label, callback] pairs for buttons.
     * @param {string} [type] - The type of alert (e.g., window.AlertComponent.TYPE_DANGER, window.AlertComponent.TYPE_WARNING, window.AlertComponent.TYPE_INFO, window.AlertComponent.TYPE_SUCCESS).
     */
    constructor(title, content, buttons = null, type = window.AlertComponent.TYPE_INFO) {
        // Always use modal-root for blocking modal behavior
        let modalRoot = document.getElementById('modal-root');
        this.container = modalRoot;
        this.title = title;
        this.content = content;
        this.buttons = buttons;
        this.type = type;
        this.render();
    }

    render() {
        // Clear container
        this.container.innerHTML = '';

        // Modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'alert-component-overlay';
        // Prevent click events from propagating to underlying elements
        overlay.addEventListener('mousedown', e => {
            e.stopPropagation();
            e.preventDefault();
        });

        // Centered modal dialog
        const modal = document.createElement('div');
        modal.className = 'alert-component-modal';

        const wrapper = document.createElement('div');
        wrapper.className = 'alert-component-wrapper';

        // Title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'alert-component-title-container';
    
        const titleDivEmoji = document.createElement('span');
        titleDivEmoji.textContent = this.type === window.AlertComponent.TYPE_DANGER ? '❌' :
                                  this.type === window.AlertComponent.TYPE_WARNING ? '⚠️' :
                                  this.type === window.AlertComponent.TYPE_SUCCESS ? '✅' :
                                  'ℹ️';
        titleDivEmoji.className = 'alert-component-title-emoji';
        titleDiv.appendChild(titleDivEmoji);
        const titleDivText = document.createElement('span');
        titleDivText.className = 'alert-component-title';
        titleDivText.textContent = this.title;
        titleDiv.appendChild(titleDivText);
        wrapper.appendChild(titleDiv);

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'alert-component-content';
        if (typeof this.content === 'string') {
            contentDiv.textContent = this.content;
        } else if (this.content instanceof HTMLElement) {
            contentDiv.appendChild(this.content);
        }
        wrapper.appendChild(contentDiv);

        // Buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'alert-component-buttons-container';
        if (Array.isArray(this.buttons) && this.buttons.length > 0) {
            this.buttons.forEach(([label, callback]) => {
                new window.ButtonComponent(buttonContainer, label, () => {
                    callback();
                    this.close();
                });
            });
        } else {
            // Default Ok button
            new window.ButtonComponent(buttonContainer, 'Ok', () => {
                this.close();
            });
        }
        wrapper.appendChild(buttonContainer);

        modal.appendChild(wrapper);
        this.container.appendChild(overlay);
        this.container.appendChild(modal);
    }

    close() {
    this.container.innerHTML = '';
    }
}

window.AlertComponent = AlertComponent;
window.AlertComponent.TYPE_DANGER = 'danger';
window.AlertComponent.TYPE_WARNING = 'warning';
window.AlertComponent.TYPE_INFO = 'info';
window.AlertComponent.TYPE_SUCCESS = 'success';
