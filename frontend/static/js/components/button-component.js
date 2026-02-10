(function () {
    /**
     * ButtonComponent: framework button component
     * Usage: new window.ButtonComponent(container, { label, onClick, type, tooltip, disabled })
     * @param {HTMLElement} container - DOM element to append the button to
     * @param {Object} options - Button configuration
     * @param {string} options.label - Button label text
     * @param {function} options.onClick - Function to invoke on click
     * @param {string} [options.type] - Button type (default: TYPE_FILL)
     * @param {string} [options.tooltip] - Tooltip text for the button
     * @param {boolean} [options.disabled] - Whether button is disabled (default: false)
     */
    class ButtonComponent {
        constructor(container, options = {}) {
            this.onClick = options.onClick;
            this.type = options.type !== undefined ? options.type : ButtonComponent.TYPE_FILL;
            this.disabled = options.disabled !== undefined ? options.disabled : false;

            this.button = document.createElement('button');
            this.updateButtonStyle();
            this.button.textContent = options.label;
            
            if (options.tooltip) {
                this.button.title = options.tooltip;
            }

            this.clickHandler = (e) => {
                if (!this.disabled && typeof this.onClick === 'function') {
                    this.onClick(e);
                }
            };
            this.button.addEventListener('click', this.clickHandler);

            container.appendChild(this.button);
        }

        updateButtonStyle() {
            const baseClass = 'framework-button';
            const typeClass = this.disabled 
                ? `${baseClass}-${this.getDisabledType()}`
                : `${baseClass}-${this.type}`;
            this.button.className = `${baseClass} ${typeClass}`;
            this.button.disabled = this.disabled;
        }

        getDisabledType() {
            // Map active types to their disabled equivalents
            if (this.type === ButtonComponent.TYPE_GHOST || this.type === ButtonComponent.TYPE_GHOST_DANGER) {
                return ButtonComponent.TYPE_DISABLED_GHOST;
            }
            return ButtonComponent.TYPE_DISABLED_FILL;
        }

        setDisabled(disabled) {
            this.disabled = disabled;
            this.updateButtonStyle();
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
window.ButtonComponent.TYPE_DISABLED_GHOST = 'type-disabled-ghost';
window.ButtonComponent.TYPE_DISABLED_FILL = 'type-disabled-fill';
