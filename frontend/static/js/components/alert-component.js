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
        // Don't clear container - just add our elements
        // (Clearing would remove any existing popups in modal-root)

        // Modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'alert-component-overlay';
        // Prevent click events from propagating to underlying elements
        overlay.addEventListener('mousedown', e => {
            e.stopPropagation();
            e.preventDefault();
        });
        overlay.addEventListener('mouseup', e => {
            e.stopPropagation();
            e.preventDefault();
        });
        overlay.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
        });

        // Centered modal dialog
        const modal = document.createElement('div');
        modal.className = 'alert-component-modal';
        
        // Also prevent events on modal from propagating
        modal.addEventListener('mousedown', e => {
            e.stopPropagation();
        });
        modal.addEventListener('mouseup', e => {
            e.stopPropagation();
        });
        modal.addEventListener('click', e => {
            e.stopPropagation();
        });

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
                new window.ButtonComponent(buttonContainer, {
                    label,
                    onClick: () => {
                        callback();
                        this.close();
                    }
                });
            });
        } else {
            // Default Ok button
            new window.ButtonComponent(buttonContainer, {
                label: 'Ok',
                onClick: () => {
                    this.close();
                }
            });
        }
        wrapper.appendChild(buttonContainer);

        modal.appendChild(wrapper);
        
        // Store references to our elements for proper cleanup
        this.overlay = overlay;
        this.modal = modal;
        
        this.container.appendChild(overlay);
        this.container.appendChild(modal);
    }

    close() {
        // Remove only our elements, not the entire container
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        this.overlay = null;
        this.modal = null;
    }
}

window.AlertComponent = AlertComponent;
window.AlertComponent.TYPE_DANGER = 'danger';
window.AlertComponent.TYPE_WARNING = 'warning';
window.AlertComponent.TYPE_INFO = 'info';
window.AlertComponent.TYPE_SUCCESS = 'success';
