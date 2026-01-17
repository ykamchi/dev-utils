(function () {
    class CheckboxComponent {
        constructor(container, checked = false, onChange = null, labelText = null, disabled = false, tooltip = '') {
            this.onChange = onChange; // Store reference for the clicked method
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'framework-checkbox-container';
            if (tooltip) this.wrapper.title = tooltip;

            this.input = document.createElement('input');
            this.input.type = 'checkbox';
            this.input.checked = !!checked;
            this.input.disabled = !!disabled;
            this.input.className = 'framework-checkbox-input';

            this.checkmark = document.createElement('span');
            this.checkmark.className = 'framework-checkbox-box';
            this.checkmark.textContent = '✔️';
            
            // Listener ONLY on the box
            this.checkmark.addEventListener('click', (e) => this.clicked(e));

            this.wrapper.appendChild(this.input);
            this.wrapper.appendChild(this.checkmark);

            if (typeof labelText === 'string' && labelText.length > 0) {
                this.label = document.createElement('div');
                this.label.className = 'framework-checkbox-label';
                this.label.innerHTML = labelText;
                
                // Listener ONLY on the label text
                this.label.addEventListener('click', (e) => this.clicked(e));
                
                this.wrapper.appendChild(this.label);
            }

            if (disabled) {
                this.wrapper.classList.add('framework-checkbox-disabled');
            }

            container.appendChild(this.wrapper);
        }

        clicked(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (this.input.disabled) return;

            this.input.checked = !this.input.checked;
            
            if (typeof this.onChange === 'function') {
                this.onChange(this.input.checked);
            }
        }

        isChecked() { return this.input.checked; }
        setChecked(v) { this.input.checked = !!v; }
        setDisabled(d) {
            this.input.disabled = !!d;
            this.wrapper.classList.toggle('framework-checkbox-disabled', !!d);
        }
        getElement() { return this.wrapper; }
    }
    window.CheckboxComponent = CheckboxComponent;
})();