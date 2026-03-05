// Framework SelectComponent
(function () {
    class SelectComponent {
        /**
         * @param {HTMLElement} container - The container to append the select to
         * @param {Object} options - Configuration options
         * @param {Array<{label: string, value: any}>} options.options - The options for the select
         * @param {function(value: any): void} [options.onSelection] - Callback when selection changes
         * @param {string} [options.placeholder] - Optional placeholder text
         * @param {any} [options.value] - Optional initial value
         * @param {boolean} [options.disabled] - Optional disabled state
         * @param {boolean} [options.fullWidth] - Optional boolean to set the width to full width of the container - default: true
         */
        constructor(container, options = {}) {
            this.container = container;
            this.selectOptions = options.options || [];
            this.onSelection = options.onSelection;
            this.placeholder = options.placeholder || '';
            this.value = options.value;
            this.disabled = options.disabled || false;
            this.fullWidth = options.fullWidth !== undefined ? options.fullWidth : true;
            this.select = this._createSelect();
            container.appendChild(this.select);
        }

        _createSelect() {
            const select = document.createElement('select');
            select.disabled = this.disabled;
            select.className = 'framework-select-component' + (this.fullWidth ? '' : ' align-self');
            let placeholderOption = null;
            if (this.placeholder) {
                placeholderOption = document.createElement('option');
                placeholderOption.value = '';
                placeholderOption.textContent = this.placeholder;
                placeholderOption.disabled = true;
                placeholderOption.selected = (this.value === undefined || this.value === null || this.value === '');
                select.appendChild(placeholderOption);
            }
            for (const opt of this.selectOptions) {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                if (this.value !== undefined && this.value !== null && opt.value === this.value) {
                    option.selected = true;
                }
                select.appendChild(option);
            }
            select.addEventListener('change', (e) => {
                // Enable all options after first change
                if (placeholderOption) placeholderOption.disabled = true;
                this.setValue(e.target.value);
                if (this.onSelection) this.onSelection(e.target.value);
            });
            return select;
        }

        getElement() {
            return this.select;
        }

        setValue(value) {
            this.select.value = value;
        }

        getSelectedValue() {
            return this.select.value;
        }

        /**
         * Replace options and selected value, recreating the select as if it was new
         * @param {Array<{label: string, value: any}>} newOptions - New options for the select
         * @param {any} newValue - New selected value
         */
        updateOptionsAndValue(newOptions, newValue) {
            this.selectOptions = newOptions;
            this.value = newValue;
            
            // Remove old select element
            if (this.select && this.select.parentNode) {
                this.select.parentNode.removeChild(this.select);
            }
            
            // Create and append new select
            this.select = this._createSelect();
            this.container.appendChild(this.select);
        }
    }

    window.SelectComponent = SelectComponent;
})();
