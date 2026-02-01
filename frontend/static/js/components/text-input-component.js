/*
    TextInputComponent: A component for text input with regex pattern validation
    - Displays a text input with pattern validation
    - Shows pattern in tooltip (hardcoded from pattern parameter)
    - Validates input against regex pattern and PREVENTS invalid input (reverts to last valid value)
    - Users cannot type characters that violate the pattern
    - onChange callback is ONLY called when input is valid
    - For number type: passes parsed numeric value; for text type: passes string value
    - Supports min/max attributes for number inputs (enforced - cannot enter values outside range)
*/
class TextInputComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.value = options.initialValue !== undefined ? options.initialValue : '';
        this.placeholder = options.placeholder !== undefined ? options.placeholder : '';
        this.onChange = options.onChange !== undefined ? options.onChange : null;
        this.type = options.type !== undefined ? options.type : 'text';
        this.min = options.min !== undefined ? options.min : null;
        this.max = options.max !== undefined ? options.max : null;
        
        // Get pattern with default
        const pattern = options.pattern !== undefined ? options.pattern : /.*/;
        
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
        
        // Generate user-friendly rejection message
        this.rejectionMessageText = `Invalid input - must match: ${this.pattern.source}`;
        
        this.render();
    }

    render() {
        // Create container wrapper for input + error message
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'text-input-container';
        
        // Create input element
        this.input = document.createElement('input');
        this.input.type = this.type;
        this.input.className = 'text-input-field';
        this.input.value = this.value;
        this.input.placeholder = this.placeholder;
        this.input.title = this.tooltip;
        
        // Set min/max attributes for number inputs
        if (this.min !== null) {
            this.input.min = this.min;
        }
        if (this.max !== null) {
            this.input.max = this.max;
        }

        // Create rejection message element
        this.rejectionMessage = document.createElement('div');
        this.rejectionMessage.className = 'text-input-rejection-message';
        this.rejectionMessage.textContent = this.rejectionMessageText;
        
        // Add input event listener for validation
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('blur', () => this.handleInput());

        this.wrapper.appendChild(this.input);
        this.wrapper.appendChild(this.rejectionMessage);
        this.container.appendChild(this.wrapper);
    }

    handleInput() {
        const newValue = this.input.value;
        
        // For number type, if empty, force min value
        if (this.type === 'number' && newValue === '' && this.min !== null) {
            this.value = this.min.toString();
            this.input.value = this.min;
            if (this.onChange) {
                this.onChange(this.min);
            }
            return;
        }
        
        const isValid = this.validateValue(newValue);
        
        if (!isValid) {
            // Revert to the last valid value
            this.input.value = this.value;
            
            // Update rejection message based on validation failure reason
            this.updateRejectionMessage(newValue);
            
            // Show rejection feedback
            this.showRejectionFeedback();
        } else {
            // Accept the new value
            this.value = newValue;
            
            // Call onChange with the validated value
            if (this.onChange) {
                if (this.type === 'number') {
                    // For number type, pass the parsed numeric value
                    const numValue = parseFloat(this.value);
                    this.onChange(numValue);
                } else {
                    // For text type, pass the string value
                    this.onChange(this.value);
                }
            }
        }
    }

    updateRejectionMessage(attemptedValue) {
        // Check if it's a number type validation failure
        if (this.type === 'number' && attemptedValue !== '') {
            const numValue = parseFloat(attemptedValue);
            if (!isNaN(numValue)) {
                if (this.min !== null && numValue < this.min) {
                    this.rejectionMessage.textContent = `Value must be at least ${this.min}`;
                    return;
                }
                if (this.max !== null && numValue > this.max) {
                    this.rejectionMessage.textContent = `Value must be at most ${this.max}`;
                    return;
                }
            }
        }
        
        // Default pattern validation message
        this.rejectionMessage.textContent = this.rejectionMessageText;
    }

    showRejectionFeedback() {
        // Add flash animation to input
        this.input.classList.add('text-input-rejected');
        
        // Show rejection message with animation
        this.rejectionMessage.classList.add('show');
        
        // Remove animations after they complete
        setTimeout(() => {
            this.input.classList.remove('text-input-rejected');
        }, 400);
        
        setTimeout(() => {
            this.rejectionMessage.classList.remove('show');
        }, 1500);
    }

    validateValue(value) {
        let isValid = this.pattern.test(value);
        
        // Additional validation for number type with min/max
        if (isValid && this.type === 'number' && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                if (this.min !== null && numValue < this.min) {
                    isValid = false;
                }
                if (this.max !== null && numValue > this.max) {
                    isValid = false;
                }
            }
        }
        
        return isValid;
    }

    getValue() {
        return this.value;
    }

    setValue(newValue) {
        this.value = newValue;
        this.input.value = newValue;
    }

    isValid() {
        return this.validateValue(this.value);
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
    }
}

// Export to window
window.TextInputComponent = TextInputComponent;
