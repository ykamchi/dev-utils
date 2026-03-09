class RateComponent {
    constructor(container, min, max, value, width = '100px', height = '8px', showValue = false, title = null) {
        this.container = container;
        this.min = min;
        this.max = max;
        this.value = value;
        this.width = width;
        this.height = height;
        this.showValue = showValue;
        this.title = title;
        this.render();
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'rate-wrapper';
        wrapper.style.width = this.width;
        wrapper.style.height = this.height;
        if (this.title) {
            wrapper.title = this.title;
        }

        // Create container for the rate bar
        const rateContainer = document.createElement('div');
        rateContainer.className = 'rate-container';
        rateContainer.style.width = '100%';
        rateContainer.style.height = '100%';

        // Create the filled portion with gradient
        const rateFill = document.createElement('div');
        rateFill.className = 'rate-fill';
        
        // Calculate percentage
        const percentage = ((this.value - this.min) / (this.max - this.min)) * 100;
        rateFill.style.width = `${percentage}%`;
        
        // Create gradient where the max opacity reflects the value percentage
        // If value is 50% of range, gradient goes from low opacity to 50% opacity
        // If value is 100% of range, gradient goes from low opacity to 100% opacity
        const maxOpacity = percentage / 100;
        rateFill.style.background = `linear-gradient(to right, rgba(from var(--color-secondary-accent) r g b / 0.1), rgba(from var(--color-secondary-accent) r g b / ${maxOpacity}))`;

        rateContainer.appendChild(rateFill);
        wrapper.appendChild(rateContainer);
        
        if (this.showValue) {
            const label = document.createElement('span');
            label.className = 'rate-label';
            label.innerText = this.value;
            wrapper.appendChild(label);
        }
        
        this.container.appendChild(wrapper);
    }
}

window.RateComponent = RateComponent;