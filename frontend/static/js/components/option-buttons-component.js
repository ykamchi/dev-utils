// OptionButtonsComponent.js
// A toggle button group component with single selection, styled with system themes

class OptionButtonsComponent {
    /**
     * @param {HTMLElement} container - The container to render the buttons into
     * @param {Array<{label: string, value: string|number}>} options - The options to display
     * @param {string|number|Array} [selected] - The initially selected value (single value or array for multi-select)
     * @param {Function} [onChange] - Callback function when selection changes
     * @param {string} [storageKey] - Optional key for persistent selection
     * @param {boolean} [multiSelect] - Enable multi-selection mode
     */
    constructor(container, options, selected = null, onChange = null, storageKey = null, multiSelect = false) {
        this.container = container;
        this.options = options;
        this.storageKey = storageKey;
        this.onChange = onChange;
        this.multiSelect = multiSelect;
        
        // Load last selected value if storageKey is provided
        let lastSelected = null;
        if (storageKey && window.StorageService) {
            lastSelected = window.StorageService.getStorageJSON(storageKey, null);
        }

        // Handle multi-select vs single-select initialization
        if (this.multiSelect) {
            // Multi-select: selected should be an array
            if (lastSelected && Array.isArray(lastSelected)) {
                this.selected = lastSelected.filter(val => options.some(opt => opt.value == val));
            } else if (Array.isArray(selected)) {
                this.selected = selected;
            } else {
                this.selected = [];
            }
        } else {
            // Single-select: selected is a single value
            this.selected = (lastSelected && options.some(opt => opt.value == lastSelected)) ? lastSelected : selected;
        }
        
        this.render();
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'option-buttons-component';
        this.buttons = [];
        this.options.forEach(opt => {
            const btnContainer = document.createElement('div');
            const isSelected = this.multiSelect 
                ? this.selected.includes(opt.value) 
                : this.selected === opt.value;
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
        if (this.multiSelect) {
            // Multi-select: toggle the value in the array
            const index = this.selected.indexOf(value);
            if (index > -1) {
                // Remove from selection
                this.selected.splice(index, 1);
            } else {
                // Add to selection
                this.selected.push(value);
            }
        } else {
            // Single-select: only change if different
            if (this.selected === value) return;
            this.selected = value;
        }
        
        // Persist selection if storageKey is provided
        if (this.storageKey && window.StorageService) {
            window.StorageService.setStorageJSON(this.storageKey, this.selected);
        }
        
        // Update button styles
        this.buttons.forEach(btn => {
            const isSelected = this.multiSelect
                ? this.selected.includes(btn.dataset.value)
                : btn.dataset.value == this.selected;
            btn.className = isSelected 
                ? 'framework-button framework-button-' + window.ButtonComponent.TYPE_FILL 
                : 'framework-button framework-button-' + window.ButtonComponent.TYPE_GHOST;
        });
        
        if (typeof this.onChange === 'function') {
            this.onChange(this.selected);
        }
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
