/*
    TextAreaComponent: A component for multi-line text input
    - Displays a textarea with configurable rows
    - Supports onChange callback for value changes
    - Provides getValue/setValue methods for programmatic access
*/
class TextAreaComponent {
    constructor(container, initialValue = '', placeholder = '', onChange = null, rows = -1) {
        this.container = container;
        this.value = initialValue;
        this.placeholder = placeholder;
        this.onChange = onChange;
        this.rows = rows;
        
        this.render();
    }

    render() {
        // Create textarea element
        this.textarea = document.createElement('textarea');
        this.textarea.className = 'text-area-field';
        this.textarea.value = this.value;
        this.textarea.placeholder = this.placeholder;
        
        // Set rows or use large class
        if (this.rows > 0) {
            this.textarea.rows = this.rows;
        } else {
            this.textarea.classList.add('text-area-large');
        }

        // Add input event listener
        this.textarea.addEventListener('input', () => this.handleInput());

        this.container.appendChild(this.textarea);
    }

    handleInput() {
        this.value = this.textarea.value;
        
        if (this.onChange) {
            this.onChange(this.value);
        }
    }

    getValue() {
        return this.value;
    }

    setValue(newValue) {
        this.value = newValue;
        this.textarea.value = newValue;
    }

    setPlaceholder(newPlaceholder) {
        this.placeholder = newPlaceholder;
        this.textarea.placeholder = newPlaceholder;
    }

    setRows(newRows) {
        this.rows = newRows;
        if (newRows > 0) {
            this.textarea.rows = newRows;
            this.textarea.classList.remove('text-area-large');
        } else {
            this.textarea.removeAttribute('rows');
            this.textarea.classList.add('text-area-large');
        }
    }

    disable() {
        this.textarea.disabled = true;
    }

    enable() {
        this.textarea.disabled = false;
    }

    focus() {
        this.textarea.focus();
    }
}

window.TextAreaComponent = TextAreaComponent;
