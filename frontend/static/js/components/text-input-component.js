/*
    TextInputComponent: A component for text input with regex pattern validation
    - Displays a text input with pattern validation
    - Shows pattern in tooltip (hardcoded from pattern parameter)
    - Validates input against regex pattern
    - Shows error state with border color when validation fails
    - Does not modify the value, only validates it
*/
class TextInputComponent {
    constructor(container, initialValue = '', pattern = /.*/, placeholder = '', onChange = null) {
        this.container = container;
        this.value = initialValue;
        this.placeholder = placeholder;
        this.onChange = onChange;
        
        // Convert string pattern to RegExp if needed
        if (typeof pattern === 'string') {
            try {
                this.pattern = new RegExp(pattern);
            } catch (e) {
                console.error('Invalid regex pattern:', pattern);
                this.pattern = /.*/;
            }
        } else {
            this.pattern = pattern;
        }
        
        // Hardcode tooltip to show the pattern
        this.tooltip = `Pattern: ${this.pattern.source}`;
        
        this.render();
    }

    render() {
        // Create input element
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'text-input-field';
        this.input.value = this.value;
        this.input.placeholder = this.placeholder;
        this.input.title = this.tooltip;

        // Add input event listener for validation
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('blur', () => this.handleInput());

        this.container.appendChild(this.input);

        // Perform initial validation
        this.validate();
    }

    handleInput() {
        this.value = this.input.value;
        const isValid = this.validate();
        
        if (this.onChange) {
            this.onChange(this.value, isValid);
        }
    }

    validate() {
        const isValid = this.pattern.test(this.value);
        
        if (isValid) {
            this.input.classList.remove('text-input-error');
        } else {
            this.input.classList.add('text-input-error');
        }
        
        return isValid;
    }

    getValue() {
        return this.value;
    }

    setValue(newValue) {
        this.value = newValue;
        this.input.value = newValue;
        this.validate();
    }

    isValid() {
        return this.pattern.test(this.value);
    }

    setPattern(newPattern, newTooltip = null) {
        if (typeof newPattern === 'string') {
            try {
                this.pattern = new RegExp(newPattern);
            } catch (e) {
                console.error('Invalid regex pattern:', newPattern);
                return;
            }
        } else {
            this.pattern = newPattern;
        }
        
        if (newTooltip !== null) {
            this.tooltip = newTooltip;
        } else {
            this.tooltip = `Pattern: ${this.pattern.source}`;
        }
        
        this.input.title = this.tooltip;
        this.validate();
    }
}

// Export to window
window.TextInputComponent = TextInputComponent;
