// OptionButtonsComponent.js
// A toggle button group component with single selection, styled with system themes

class OptionButtonsComponent {
    /**
     * @param {HTMLElement} container - The container to render the buttons into
     * @param {Array<{label: string, value: string|number}>} options - The options to display
     * @param {string|number} [selected] - The initially selected value
     * @param {Function} [onChange] - Callback function when selection changes
     * @param {string} [storageKey] - Optional key for persistent selection
     */
    constructor(container, options, selected = null, onChange = null, storageKey = '') {
        this.container = container;
        this.options = options;
        this.storageKey = storageKey;
        this.onChange = onChange;
        
        // Load last selected value if storageKey is provided
        let lastSelected = null;
        if (storageKey && window.StorageService) {
            lastSelected = window.StorageService.getLocalStorageItem(storageKey, null);
        }
        this.selected = (lastSelected && options.some(opt => opt.value == lastSelected)) ? lastSelected : selected;
        // this.onChange(this.selected);
        this.render();
    }

    render() {
        // this.container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'option-buttons-component';
        this.buttons = [];
        this.options.forEach(opt => {
            const btnContainer = document.createElement('div');
            const isSelected = this.selected === opt.value;
            const btnType = isSelected ? window.ButtonComponent.TYPE_FILL : window.ButtonComponent.TYPE_GHOST;
            const btnComponent = new window.ButtonComponent(btnContainer, opt.label, () => this.select(opt.value), btnType);
            const btn = btnComponent.getElement();
            btn.dataset.value = opt.value;
            wrapper.appendChild(btnContainer);
            this.buttons.push(btn);
        });
        this.container.appendChild(wrapper);
        this.applyTheme();
    }

    select(value) {
        if (this.selected === value) return;
        this.selected = value;
        
        // Persist selection if storageKey is provided
        if (this.storageKey && window.StorageService) {
            window.StorageService.setLocalStorageItem(this.storageKey, value);
        }
        
        this.buttons.forEach(btn => {
            const isSelected = btn.dataset.value == value;
            btn.className = isSelected ? 'framework-button framework-button-' + window.ButtonComponent.TYPE_FILL : 'framework-button framework-button-' + window.ButtonComponent.TYPE_GHOST;
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
