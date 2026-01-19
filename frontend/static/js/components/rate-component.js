class RateComponent {
    constructor(container, min, max, value, width = '100px', height = '8px', showValue = false) {
        this.container = container;
        this.min = min;
        this.max = max;
        this.value = value;
        this.width = width;
        this.height = height;
        this.showValue = showValue;
        this.render();
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.className = 'rate-wrapper';
        wrapper.style.width = this.width;
        wrapper.style.height = this.height;

        const progressBar = document.createElement('progress');
        progressBar.className = 'rate-progress-bar';
        progressBar.style.width = '100%';
        progressBar.style.height = '100%';
        
        progressBar.max = this.max - this.min;
        progressBar.value = this.value - this.min;

        // Calculate bucket index (1 to 10)
        const p = (this.value - this.min) / (this.max - this.min);
        const bucket = Math.max(1, Math.min(10, Math.ceil(p * 10)));
        progressBar.classList.add(`rate-bucket-${bucket}`);

        wrapper.appendChild(progressBar);
        
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