/*
    TextAreaComponent: A component for multi-line text input
    - Displays a textarea with configurable rows
    - Supports onChange callback for value changes
    - Provides getValue/setValue methods for programmatic access
    - Supports AI autocomplete via aiSuggestion option
*/
class TextAreaComponent {
    constructor(container, options = {}) {
        this.container = container;
        this.value = options.initialValue !== undefined ? options.initialValue : '';
        this.placeholder = options.placeholder !== undefined ? options.placeholder : '';
        this.onChange = options.onChange !== undefined ? options.onChange : null;
        this.rows = options.rows !== undefined ? options.rows : -1;
        this.aiSuggestionConfig = options.aiSuggestion || null;
        this.aiSuggestionHandler = null;
        
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

        // Setup AI suggestion if configured
        if (this.aiSuggestionConfig && this.aiSuggestionConfig.fn) {
            this.aiSuggestionHandler = new window.AISuggestionHandler({
                inputElement: this.textarea,
                aiSuggestionFn: this.aiSuggestionConfig.fn,
                context: this.aiSuggestionConfig.context,
                onValueChange: (newValue, newCursorPos) => {
                    this.textarea.value = newValue;
                    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
                    this.handleInput();
                },
                debounceMs: this.aiSuggestionConfig.debounceMs,
                timeoutMs: this.aiSuggestionConfig.timeoutMs
            });
        }
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

    destroy() {
        if (this.aiSuggestionHandler) {
            this.aiSuggestionHandler.destroy();
        }
    }
}

window.TextAreaComponent = TextAreaComponent;
