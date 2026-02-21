// OptionButtonsComponent.js
// A toggle button/checkbox group component with single or multi-selection, styled with system themes

class OptionButtonsComponent {
    /**
     * @param {HTMLElement} container - The container to render the component into
     * @param {Object} options - Configuration options
     * @param {Array<{label: string, value: string|number}>} options.options - The options to display
     * @param {string|number|Array} [options.selected] - The initially selected value (single value or array for multi-select)
     * @param {Function} [options.onChange] - Callback function when selection changes
     * @param {string} [options.storageKey] - Optional key for persistent selection
     * @param {boolean} [options.multiSelect] - Enable multi-selection mode
     * @param {string} [options.viewType] - View type: TYPE_BUTTONS or TYPE_CHECKBOXES (default: TYPE_BUTTONS)
     * @param {string} [options.layout] - Layout: VIEW_TYPE_HORIZONTAL or VIEW_TYPE_VERTICAL (default: VIEW_TYPE_HORIZONTAL)
     */
    constructor(container, options = {}) {
        this.container = container;
        this.options = options.options || [];
        this.storageKey = options.storageKey || null;
        this.onChange = options.onChange || null;
        this.multiSelect = options.multiSelect !== undefined ? options.multiSelect : false;
        this.viewType = options.viewType;
        this.layout = options.layout;

        // Load last selected value if storageKey is provided
        let lastSelected = null;
        if (this.storageKey && window.StorageService) {
            lastSelected = window.StorageService.getStorageJSON(this.storageKey, null);
        }

        // Handle multi-select vs single-select initialization
        if (this.multiSelect) {
            // Multi-select: selected should be an array
            if (lastSelected && Array.isArray(lastSelected)) {
                this.selected = lastSelected.filter(val => this.options.some(opt => opt.value == val));
            } else if (Array.isArray(options.selected)) {
                this.selected = options.selected;
            } else {
                this.selected = [];
            }
        } else {
            // Single-select: selected is a single value
            this.selected = (lastSelected && this.options.some(opt => opt.value == lastSelected)) ? lastSelected : (options.selected !== undefined ? options.selected : null);
        }
        
        this.render();
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'option-buttons-component';
        
        // Apply layout style
        if (this.layout === window.OptionButtonsComponent.VIEW_TYPE_VERTICAL) {
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.gap = '5px';
        } else {
            // Horizontal layout (default)
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'row';
            wrapper.style.flexWrap = 'wrap';
            wrapper.style.gap = '5px';
        }
        
        this.controls = []; // Store references to buttons or checkboxes
        
        if (this.viewType === window.OptionButtonsComponent.TYPE_CHECKBOXES) {
            // Render as checkboxes
            this.options.forEach(opt => {
                const isSelected = this.multiSelect 
                    ? this.selected.includes(opt.value) 
                    : this.selected === opt.value;
                
                const checkboxContainer = document.createElement('div');
                
                const checkbox = new window.CheckboxComponent(
                    checkboxContainer,
                    isSelected,
                    (checked) => {
                        if (this.multiSelect) {
                            // For multi-select with checkboxes, toggle the value
                            if (checked) {
                                if (!this.selected.includes(opt.value)) {
                                    this.selected.push(opt.value);
                                }
                            } else {
                                const index = this.selected.indexOf(opt.value);
                                if (index > -1) {
                                    this.selected.splice(index, 1);
                                }
                            }
                        } else {
                            // For single-select with checkboxes, uncheck others
                            this.selected = checked ? opt.value : null;
                            this.controls.forEach((ctrl, idx) => {
                                if (idx !== this.options.indexOf(opt)) {
                                    ctrl.setChecked(false);
                                }
                            });
                        }
                        
                        // Persist selection
                        if (this.storageKey && window.StorageService) {
                            window.StorageService.setStorageJSON(this.storageKey, this.selected);
                        }
                        
                        // Trigger onChange
                        if (typeof this.onChange === 'function') {
                            this.onChange(this.selected);
                        }
                    },
                    opt.label
                );
                
                wrapper.appendChild(checkboxContainer);
                this.controls.push(checkbox);
            });
        } else {
            // Render as buttons (default)
            this.options.forEach(opt => {
                const btnContainer = document.createElement('div');
                const isSelected = this.multiSelect 
                    ? this.selected.includes(opt.value) 
                    : this.selected === opt.value;
                const btnType = isSelected ? window.ButtonComponent.TYPE_FILL : window.ButtonComponent.TYPE_GHOST;
                const btnComponent = new window.ButtonComponent(btnContainer, {
                    label: opt.label,
                    onClick: () => this.select(opt.value),
                    type: btnType
                });
                const btn = btnComponent.getElement();
                btn.dataset.value = opt.value;
                wrapper.appendChild(btnContainer);
                this.controls.push(btn);
            });
        }
        
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
        
        // Update control styles/states
        if (this.viewType === window.OptionButtonsComponent.TYPE_CHECKBOXES) {
            // Update checkbox states
            this.controls.forEach((checkbox, idx) => {
                const optValue = this.options[idx].value;
                const isSelected = this.multiSelect
                    ? this.selected.includes(optValue)
                    : optValue == this.selected;
                checkbox.setChecked(isSelected);
            });
        } else {
            // Update button styles
            this.controls.forEach(btn => {
                const isSelected = this.multiSelect
                    ? this.selected.includes(btn.dataset.value)
                    : btn.dataset.value == this.selected;
                btn.className = isSelected 
                    ? 'framework-button framework-button-' + window.ButtonComponent.TYPE_FILL 
                    : 'framework-button framework-button-' + window.ButtonComponent.TYPE_GHOST;
            });
        }
        
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

// View type constants
window.OptionButtonsComponent.TYPE_BUTTONS = 'type-buttons';
window.OptionButtonsComponent.TYPE_CHECKBOXES = 'type-checkboxes';

// Layout constants
window.OptionButtonsComponent.VIEW_TYPE_HORIZONTAL = 'view-type-horizontal';
window.OptionButtonsComponent.VIEW_TYPE_VERTICAL = 'view-type-vertical';
