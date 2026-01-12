(function () {
    /**
     * ButtonComponent: framework button component
     * Usage: new window.ButtonComponent({ container, text, onClick })
     * @param {HTMLElement} container - DOM element to append the button to
     * @param {string} text - Button label
     * @param {function} onClick - Function to invoke on click
     * @param {string} [type] - Button type (e.g., 'type-fill' or 'type-ghost')
     * @param {string} [tooltip] - Tooltip text for the button
     */
    class ButtonComponent {
        constructor(container, text, onClick, type = ButtonComponent.TYPE_FILL, tooltip = '') {
            this.button = document.createElement('button');
            this.button.className = 'framework-button framework-button-' + type;
            this.button.textContent = text;
            if (typeof onClick === 'function') {
                this.button.addEventListener('click', onClick);
            }
            if (tooltip) {
                this.button.title = tooltip;
            }
            container.appendChild(this.button);

        }
        getElement() {
            return this.button;
        }
    }
    window.ButtonComponent = ButtonComponent;
})();
ButtonComponent.TYPE_GHOST = 'type-ghost';
ButtonComponent.TYPE_FILL = 'type-fill';
window.ButtonComponent.TYPE_FILL_DANGER = 'type-fill-danger';
window.ButtonComponent.TYPE_GHOST_DANGER = 'type-ghost-danger';
