// Framework SelectComponent
(function () {
    class SelectComponent {
        /**
         * @param {HTMLElement} container - The container to append the select to
         * @param {Array<{label: string, value: any}>} selectOptions - The options for the select
         * @param {function(value: any): void} onSelection - Callback when selection changes
         * @param {string} [placeholder] - Optional placeholder text
         * @param {any} [value] - Optional initial value
         * @param {boolean} [disabled] - Optional disabled state
         */
        constructor(container, selectOptions, onSelection, placeholder = '', value = undefined, disabled = false) {
            this.container = container;
            this.selectOptions = selectOptions;
            this.onSelection = onSelection;
            this.placeholder = placeholder;
            this.value = value;
            this.disabled = disabled;
            this.select = this._createSelect();
            container.appendChild(this.select);
        }

        _createSelect() {
            const select = document.createElement('select');
            select.disabled = this.disabled;
            select.className = 'framework-select-component';
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
    }

    window.SelectComponent = SelectComponent;
})();
