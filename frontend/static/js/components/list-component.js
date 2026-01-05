// ListComponent.js
// Generic, reusable list renderer for framework use


class ListComponent {
    /**
     * @param {HTMLElement} container - The container to render the list into.
     * @param {Array} items - Array of items to render.
     * @param {Function} renderItemFunction - Function(item) => HTMLElement, returns the DOM for each item.
     * @param {string} [selectionMode] - 'none' | 'single' | 'multiple'
     * @param {Function} [onSelect] - Callback(selectedItems)
     */
    constructor(container, items, renderItemFunction, selectionMode = 'none', onSelect = null) {
        this.container = container;
        this.items = items || [];
        this.renderItemFunction = renderItemFunction;
        this.selectionMode = selectionMode;
        this.onSelect = onSelect;
        this.selectedIndices = [];
        this.render();
    }

    render() {
        const ul = document.createElement('ul');
        ul.className = 'list-component-list';
        let hasItems = false;
        this.itemElements = [];
        this.items.forEach((item, idx) => {
            hasItems = true;
            const isSelected = this.selectedIndices.includes(idx);
            const li = document.createElement('li');
            li.className = 'list-component-item';
            if (isSelected) li.classList.add('selected');
            const rendered = this.renderItemFunction(item);
            li.appendChild(rendered);
            if (this.selectionMode !== 'none') {
                li.style.cursor = 'pointer';
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleSelect(idx);
                });
            }
            ul.appendChild(li);
            this.itemElements.push(li);
        });
        if (!hasItems) {
            const li = document.createElement('li');
            li.className = 'list-component-empty';
            li.textContent = 'No items found';
            ul.appendChild(li);
        }
        this.container.appendChild(ul);
    }

    handleSelect(idx) {
        if (this.selectionMode === 'single') {
            this.selectedIndices = [idx];
        } else if (this.selectionMode === 'multiple') {
            if (this.selectedIndices.includes(idx)) {
                this.selectedIndices = this.selectedIndices.filter(i => i !== idx);
            } else {
                this.selectedIndices.push(idx);
            }
        }
        // For 'none', do nothing

        // Update selection classes in the DOM
        this.itemElements.forEach((li, i) => {
            if (this.selectedIndices.includes(i)) {
                li.classList.add('selected');
            } else {
                li.classList.remove('selected');
            }
        });

        if (this.onSelect) {
            const selectedItems = this.selectedIndices.map(i => this.items[i]);
            this.onSelect(selectedItems);
        }
    }


    /**
     * Returns the currently selected items.
     * @returns {Array}
     */
    getSelectedItems() {
        return this.selectedIndices.map(i => this.items[i]);
    }

    /**
     * Returns the indices of the currently selected items.
     * @returns {Array<number>}
     */
    getSelectedIndices() {
        return [...this.selectedIndices];
    }

}

window.ListComponent = ListComponent;
// Static selection mode constants for encapsulation and external usage
ListComponent.SELECTION_MODE_NONE = 'none';
ListComponent.SELECTION_MODE_SINGLE = 'single';
ListComponent.SELECTION_MODE_MULTIPLE = 'multiple';
