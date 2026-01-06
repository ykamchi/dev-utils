// SpinnerComponent.js
// Generic spinner/loading indicator for framework use

class SpinnerComponent {
    /**
     * @param {HTMLElement} root - The container to render the spinner into.
     * @param {Object} [options] - Optional customization options.
     * @param {string} [options.text] - Optional loading text to display.
     * @param {number} [options.size] - Optional spinner size in pixels.
     * @param {string} [options.textPosition] - Position of text relative to spinner: 'top', 'bottom', 'left', 'right'.
     */
    constructor(root, options = {}) {
        this.root = root;
        this.options = options;
        this.render();
    }

    render() {
        this.root.innerHTML = '';
        // Outer flex wrapper to fill parent
        const wrapper = document.createElement('div');
        wrapper.className = 'spinner-center-flex';

        // Set flex direction based on text position
        const textPosition = this.options.textPosition;
        if (textPosition === SpinnerComponent.TEXT_POSITION_TOP) {
            wrapper.classList.add('spinner-text-top');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_BOTTOM) {
            wrapper.classList.add('spinner-text-bottom');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_LEFT) {
            wrapper.classList.add('spinner-text-left');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_RIGHT) {
            wrapper.classList.add('spinner-text-right');
        }

        // Spinner element
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        const size = this.options.size || 32;
        spinner.style.width = size + 'px';
        spinner.style.height = size + 'px';
        wrapper.appendChild(spinner);

        // Optional loading text
        if (this.options.text) {
            const loadingText = document.createElement('div');
            loadingText.className = 'spinner-loading-text';
            loadingText.textContent = this.options.text;
            wrapper.appendChild(loadingText);
        }

        this.root.appendChild(wrapper);
    }
}

window.SpinnerComponent = SpinnerComponent;

// Static text position constants for encapsulation and external usage
SpinnerComponent.TEXT_POSITION_TOP = 'top';
SpinnerComponent.TEXT_POSITION_BOTTOM = 'bottom';
SpinnerComponent.TEXT_POSITION_LEFT = 'left';
SpinnerComponent.TEXT_POSITION_RIGHT = 'right';
