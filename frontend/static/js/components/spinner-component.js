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
        if (!root) {
            this.root = document.createElement('div');
            document.body.appendChild(this.root);
            this.root.style.position = 'absolute';
            this.root.style.left = '50%';
            this.root.style.top = '50%';
            this.root.style.transform = 'translate(-50%, -50%)';
            this.root.style.zIndex = '9999';
        } else {
            this.root = root;
        }
        this.wrapper = null;
        this.options = options;
        this.render();
    }

    render() {
        // this.root.innerHTML = '';
        // Outer flex wrapper to fill parent
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'spinner-center-flex';

        // Set flex direction based on text position
        const textPosition = this.options.textPosition;
        if (textPosition === SpinnerComponent.TEXT_POSITION_TOP) {
            this.wrapper.classList.add('spinner-text-top');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_BOTTOM) {
            this.wrapper.classList.add('spinner-text-bottom');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_LEFT) {
            this.wrapper.classList.add('spinner-text-left');
        } else if (textPosition === SpinnerComponent.TEXT_POSITION_RIGHT) {
            this.wrapper.classList.add('spinner-text-right');
        }

        // Spinner element
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        const size = this.options.size || 32;
        spinner.style.width = size + 'px';
        spinner.style.height = size + 'px';
        this.wrapper.appendChild(spinner);

        // Optional loading text
        if (this.options.text) {
            const loadingText = document.createElement('div');
            loadingText.className = 'spinner-loading-text';
            loadingText.textContent = this.options.text;
            this.wrapper.appendChild(loadingText);
        }

        this.root.appendChild(this.wrapper);
    }
    remove() {
        this.wrapper.remove();
    }
}

window.SpinnerComponent = SpinnerComponent;

// Static text position constants for encapsulation and external usage
SpinnerComponent.TEXT_POSITION_TOP = 'top';
SpinnerComponent.TEXT_POSITION_BOTTOM = 'bottom';
SpinnerComponent.TEXT_POSITION_LEFT = 'left';
SpinnerComponent.TEXT_POSITION_RIGHT = 'right';
