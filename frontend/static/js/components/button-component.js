(function () {
    /**
     * ButtonComponent: framework button component
     * Usage: new window.ButtonComponent({ container, text, onClick })
     * @param {HTMLElement} container - DOM element to append the button to
     * @param {string} text - Button label
     * @param {function} onClick - Function to invoke on click
     */
    class ButtonComponent {
        constructor(container, text, onClick) {
            this.button = document.createElement('button');
            this.button.className = 'framework-button';
            this.button.textContent = text;
            if (typeof onClick === 'function') {
                this.button.addEventListener('click', onClick);
            }
            container.appendChild(this.button);

        }
        getElement() {
            return this.button;
        }
    }
    window.ButtonComponent = ButtonComponent;
})();
