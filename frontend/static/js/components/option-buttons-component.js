// OptionButtonsComponent.js
// A toggle button group component with single selection, styled with system themes

class OptionButtonsComponent {
    /**
     * @param {HTMLElement} container - The container to render the buttons into
     * @param {Array<{label: string, value: string|number}>} options - The options to display
     * @param {Object} [config] - Optional config: { selected, onChange }
     */
    constructor(container, options, config = {}) {
        this.container = container;
        this.options = options;
        this.selected = config.selected || null;
        this.onChange = config.onChange || null;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'option-buttons-component';
        this.buttons = [];
        this.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'option-btn';
            btn.textContent = opt.label;
            btn.dataset.value = opt.value;
            if (this.selected === opt.value) {
                btn.classList.add('selected');
            }
            btn.addEventListener('click', () => this.select(opt.value));
            wrapper.appendChild(btn);
            this.buttons.push(btn);
        });
        this.container.appendChild(wrapper);
        this.applyTheme();
    }

    select(value) {
        if (this.selected === value) return;
        this.selected = value;
        this.buttons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.value == value);
        });
        if (typeof this.onChange === 'function') {
            this.onChange(value);
        }
        this.emit('change', value);
    }

    getSelection() {
        return this.selected;
    }

    setSelection(value) {
        this.select(value);
    }

    // Simple event emitter pattern
    emit(event, value) {
        const evt = new CustomEvent(`option-buttons:${event}`, { detail: value });
        this.container.dispatchEvent(evt);
    }

    applyTheme() {
        // Use system theme classes if available
        this.container.classList.add('theme-bg', 'theme-border', 'theme-text');
        // Optionally, add more theme logic here
    }
}

// Export for use in other modules
window.OptionButtonsComponent = OptionButtonsComponent;
