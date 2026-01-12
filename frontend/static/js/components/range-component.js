/*
    RangeComponent: A component for selecting an integer range
    - Displays two number inputs for min and max values
    - Enforces that min is lower than max
    - Provides a getRange function that returns {min, max}
    - Accepts initial values via constructor
*/
class RangeComponent {
    constructor(container, min = 0, max = 100) {
        this.container = container;
        this.range = {
            min: min,
            max: max,
        };
        // Create wrapper once and reuse
        this.rangeWrapper = document.createElement('div');
        this.rangeWrapper.className = 'range-inputs-wrapper';
        this.container.className = 'range-component';
        this.container.appendChild(this.rangeWrapper);
        this.render();
    }

    render() {
        // If inputs already exist, just update their values
        if (this.rangeWrapper.rangeItem && this.rangeWrapper.minInput && this.rangeWrapper.maxInput) {
            this.rangeWrapper.minInput.value = this.range.min;
            this.rangeWrapper.maxInput.value = this.range.max;
            return;
        }

    // Create .range-item containers for min and max
    const minItem = document.createElement('div');
    minItem.className = 'range-item';
    const maxItem = document.createElement('div');
    maxItem.className = 'range-item';

    // Min input
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'range-input';
    minInput.id = 'range-min-input';
    minInput.value = this.range.min;
    minInput.setAttribute('aria-label', 'Min');

    // Max input
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'range-input';
    maxInput.id = 'range-max-input';
    maxInput.value = this.range.max;
    maxInput.setAttribute('aria-label', 'Max');

    // Add event listeners
    minInput.addEventListener('change', () => this.handleMinChange(minInput, maxInput));
    minInput.addEventListener('blur', () => this.handleMinChange(minInput, maxInput));
    maxInput.addEventListener('change', () => this.handleMaxChange(minInput, maxInput));
    maxInput.addEventListener('blur', () => this.handleMaxChange(minInput, maxInput));

    // Add inputs to their wrappers
    minItem.appendChild(minInput);
    maxItem.appendChild(maxInput);

    // Separator
    const sep = document.createElement('span');
    sep.className = 'range-separator';
    sep.textContent = '–';

    // Add to wrapper: minItem, sep, maxItem
    this.rangeWrapper.appendChild(minItem);
    this.rangeWrapper.appendChild(sep);
    this.rangeWrapper.appendChild(maxItem);

    // Store references for future updates
    this.rangeWrapper.minItem = minItem;
    this.rangeWrapper.maxItem = maxItem;
    this.rangeWrapper.minInput = minInput;
    this.rangeWrapper.maxInput = maxInput;
    }

    handleMinChange(minInput, maxInput) {
        const minValue = parseInt(minInput.value);
        const maxValue = parseInt(maxInput.value);

        // If min is not a number, keep previous value
        if (isNaN(minValue)) {
            minInput.value = this.range.min;
            return;
        }

        // If min is greater than or equal to max, set min to max - 1
        if (minValue >= maxValue) {
            this.range.min = maxValue - 1;
            minInput.value = this.range.min;
        } else {
            this.range.min = minValue;
        }
    }

    handleMaxChange(minInput, maxInput) {
        const minValue = parseInt(minInput.value);
        const maxValue = parseInt(maxInput.value);

        // If max is not a number, keep previous value
        if (isNaN(maxValue)) {
            maxInput.value = this.range.max;
            return;
        }

        // If max is less than or equal to min, set max to min + 1
        if (maxValue <= minValue) {
            this.range.max = minValue + 1;
            maxInput.value = this.range.max;
        } else {
            this.range.max = maxValue;
        }
    }

    getRange() {
        return {
            min: this.range.min,
            max: this.range.max,
        };
    }

    setRange(newRange) {
        if (newRange.min !== undefined) {
            this.range.min = newRange.min;
        }
        if (newRange.max !== undefined) {
            this.range.max = newRange.max;
        }
        this.render();
    }
}

window.RangeComponent = RangeComponent;
