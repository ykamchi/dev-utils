(function () {
    /**
     * ExpandDivComponent: A collapsible container component with smooth animation
     * Usage: new window.ExpandDivComponent(container, headerContent, bodyContent, expanded)
     */
    class ExpandDivComponent {
        constructor(container, headerContent, bodyContent, expanded = false) {
            this.isExpanded = !!expanded;

            // Main Wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'framework-expand-container';
            if (this.isExpanded) this.wrapper.classList.add('is-expanded');

            // Header Div
            this.header = document.createElement('div');
            this.header.className = 'framework-expand-header';

            // Header Left Content
            this.headerLeft = document.createElement('div');
            this.headerLeft.className = 'framework-expand-header-left';
            if (headerContent instanceof HTMLElement) {
                this.headerLeft.appendChild(headerContent);
            } else {
                this.headerLeft.textContent = headerContent;
            }

            // Header Right (Toggle Button)
            this.toggleBtn = document.createElement('div');
            this.toggleBtn.className = 'framework-expand-toggle';
            this.toggleBtn.textContent = '⌄';
            
            this.header.appendChild(this.headerLeft);
            this.header.appendChild(this.toggleBtn);

            // Body Div
            this.body = document.createElement('div');
            this.body.className = 'framework-expand-content';
            
            // Inner content wrapper (helps with smooth padding animation)
            const bodyInner = document.createElement('div');
            bodyInner.className = 'framework-expand-content-inner';
            if (bodyContent instanceof HTMLElement) {
                bodyInner.appendChild(bodyContent);
            } else {
                bodyInner.textContent = bodyContent;
            }
            this.body.appendChild(bodyInner);

            // Click Event
            this.header.addEventListener('click', () => this.toggle());

            // Assemble
            this.wrapper.appendChild(this.header);
            this.wrapper.appendChild(this.body);
            container.appendChild(this.wrapper);
        }

        toggle() {
            this.isExpanded = !this.isExpanded;
            this.wrapper.classList.toggle('is-expanded', this.isExpanded);
        }

        setExpanded(state) {
            this.isExpanded = !!state;
            this.wrapper.classList.toggle('is-expanded', this.isExpanded);
        }

        getElement() {
            return this.wrapper;
        }
    }
    window.ExpandDivComponent = ExpandDivComponent;
})();