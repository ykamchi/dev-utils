// SpinnerComponent.js
// Generic spinner/loading indicator for framework use

class SpinnerComponent {
    /**
     * @param {HTMLElement} root - The container to render the spinner into.
     * @param {Object} [options] - Optional customization options.
     * @param {string} [options.text] - Optional loading text to display below the spinner.
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

        // Spinner container for styling
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'loading-spinner';

        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        const size = this.options.size || 32;
        spinner.style.width = size + 'px';
        spinner.style.height = size + 'px';
        spinnerContainer.appendChild(spinner);
        wrapper.appendChild(spinnerContainer);

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
