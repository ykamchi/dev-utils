(function () {
    /**
     * ProgressBarComponent: framework progress bar component
     * Usage: new window.ProgressBarComponent(container, { width, height, percentage, label })
     * @param {HTMLElement} container - DOM element to append the progress bar to
     * @param {Object} options - Progress bar configuration
     * @param {string} [options.width] - Width of progress bar (default: '200px')
     * @param {string} [options.height] - Height of progress bar (default: '8px')
     * @param {number} [options.percentage] - Current percentage 0-100 (default: 0)
     * @param {boolean} [options.label] - Whether to show percentage label inside the bar (default: true)
     */
    class ProgressBarComponent {
        constructor(container, options = {}) {
            this.width = options.width || '200px';
            this.height = options.height || '8px';
            this.percentage = options.percentage !== undefined ? Math.max(0, Math.min(100, options.percentage)) : 0;
            this.showLabel = options.label !== undefined ? options.label : true;

            // Create wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'framework-progressbar-wrapper';

            // Create progress bar container
            this.container = document.createElement('div');
            this.container.className = 'framework-progressbar-container';
            this.container.style.width = this.width;
            this.container.style.height = this.height;

            // Create progress bar fill
            this.fill = document.createElement('div');
            this.fill.className = 'framework-progressbar-fill';
            this.fill.style.width = `${this.percentage}%`;

            this.container.appendChild(this.fill);

            // Create percentage label inside the progress bar
            if (this.showLabel) {
                this.labelElement = document.createElement('div');
                this.labelElement.className = 'framework-progressbar-label';
                this.labelElement.textContent = `${Math.round(this.percentage)}%`;
                this.container.appendChild(this.labelElement);
            }

            this.wrapper.appendChild(this.container);
            container.appendChild(this.wrapper);
        }

        /**
         * Update the progress bar percentage
         * @param {number} percentage - New percentage value (0-100)
         * @param {boolean} animated - Whether to animate the transition (default: true)
         */
        setPercentage(percentage, animated = true) {
            this.percentage = Math.max(0, Math.min(100, percentage));
            
            if (!animated) {
                this.fill.style.transition = 'none';
            }
            
            this.fill.style.width = `${this.percentage}%`;
            
            // Update label text if showing label
            if (this.showLabel && this.labelElement) {
                this.labelElement.textContent = `${Math.round(this.percentage)}%`;
            }
            
            if (!animated) {
                // Force reflow to apply the no-transition state
                this.fill.offsetHeight;
                this.fill.style.transition = '';
            }
        }

        /**
         * Remove the progress bar from the DOM
         */
        remove() {
            if (this.wrapper && this.wrapper.parentNode) {
                this.wrapper.parentNode.removeChild(this.wrapper);
            }
        }
    }

    window.ProgressBarComponent = ProgressBarComponent;
})();
