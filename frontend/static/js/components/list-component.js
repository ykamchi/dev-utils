// ListComponent.js
// Generic, reusable list renderer for framework use


class ListComponent {
    /**
     * @param {HTMLElement} container - The container to render the list into.
     * @param {Array} items - Array of items to render.
     * @param {Function} renderItemFunction - Function(item) => HTMLElement, returns the DOM for each item.
     * @param {string} [selectionMode] - ListComponent.SELECTION_MODE_NONE | ListComponent.SELECTION_MODE_SINGLE | ListComponent.SELECTION_MODE_MULTIPLE
     * @param {Function} [onSelect] - Callback(selectedItems)
     * @param {Function} [onFilter] - Function(item, query) => boolean, returns true if item matches the search query
     * @param {Array} [sortFields] - Array of sort field objects
     * @param {Function} [onRefresh] - Callback when refresh button is clicked
     */
    constructor(container, items, renderItemFunction, selectionMode = ListComponent.SELECTION_MODE_NONE, onSelect = null, onFilter = null, sortFields = [], onRefresh = null) {
        this.container = container;
        this.allItems = items || [];
        this.items = items || [];
        this.renderItemFunction = renderItemFunction;
        this.selectionMode = selectionMode;
        this.onSelect = onSelect;
        this.onFilter = onFilter;
        this.sortFields = sortFields;
        this.onRefresh = onRefresh;
        this.selectedIndices = [];
        this.selectedItems = new Set(); // Track selected items by reference
        this.searchInput = null;
        this.listContainer = null;
        this.selectedSortField = null;
        this.render();
    }

    render() {
        // Create a wrapper div to handle the flex layout internally
        // This wrapper will contain the search input and list, while the container
        // itself remains unchanged (important for components like TabsetComponent)
        let wrapper = this.container.querySelector('.list-component-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'list-component-wrapper';
            this.container.appendChild(wrapper);
        }
        wrapper.innerHTML = '';

        if (this.onFilter || (this.sortFields && this.sortFields.length > 0) || this.onRefresh) {
            const searchContainer = document.createElement('div');
            searchContainer.className = 'list-component-search-container';

            if (this.sortFields && Object.keys(this.sortFields).length > 0) {
                this.selectedSortField = this.sortFields[0];

                // Create sort wrapper with button inside (similar to search input wrapper)
                const sortWrapper = document.createElement('div');
                sortWrapper.className = 'list-component-sort-wrapper';
                searchContainer.appendChild(sortWrapper);

                // Create sort direction button (positioned on the left inside the select)
                this.sortButton = document.createElement('button');
                this.sortButton.className = 'list-component-sort-button';
                this.sortButton.title = 'Sort items';
                this.sortButton.addEventListener('click', () => {
                    this.selectedSortField.direction = -this.selectedSortField.direction;
                    this.sortItems();
                    this.renderList();
                });
                sortWrapper.appendChild(this.sortButton);

                // Create sort select component container
                const sortSelectContainer = document.createElement('div');
                sortSelectContainer.className = 'list-component-sort-select-container';
                sortWrapper.appendChild(sortSelectContainer);

                // Create sort select component
                this.sortSelect = new window.SelectComponent(
                    sortSelectContainer,
                    this.sortFields.map(field => ({ label: field.label, value: field.label })),
                    (selectedSortField) => {
                        if (selectedSortField) {
                            this.selectedSortField = this.sortFields.find(field => field.label === selectedSortField);
                            this.sortItems();
                            this.renderList();
                        }
                    },
                    'Sort by...'
                );

                // Initial sort
                this.sortItems();
            }

            if (this.onFilter) {
                // Create search input wrapper with icon inside
                const inputWrapper = document.createElement('div');
                inputWrapper.className = 'list-component-search-input-wrapper';
                searchContainer.appendChild(inputWrapper);

                // Search input
                this.searchInput = document.createElement('input');
                this.searchInput.type = 'text';
                this.searchInput.className = 'search-input';
                this.searchInput.placeholder = 'Search...';
                this.searchInput.addEventListener('input', () => this.filterItems(this.searchInput.value));
                inputWrapper.appendChild(this.searchInput);

                // Search icon (positioned on the right inside the input)
                const searchIcon = document.createElement('span');
                searchIcon.className = 'list-component-search-icon';
                searchIcon.textContent = '🔍';
                inputWrapper.appendChild(searchIcon);
            }

            // Add refresh button if callback is provided
            if (this.onRefresh) {
                const refreshButton = document.createElement('button');
                refreshButton.className = 'list-component-refresh-button';
                refreshButton.textContent = '🗘';
                refreshButton.title = 'Refresh list';
                refreshButton.addEventListener('click', () => {
                    if (typeof this.onRefresh === 'function') {
                        this.onRefresh();
                    }
                });
                searchContainer.appendChild(refreshButton);
            }

            wrapper.appendChild(searchContainer);
        }

        // Create list container
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'list-component-list-container';
        wrapper.appendChild(this.listContainer);

        // Render the list
        this.renderList();
    }

    sortItems() {
        this.sortSelect.setValue(this.selectedSortField.label);
        this.sortButton.textContent = this.selectedSortField.direction === 1 ? '⬆' : '⬇';
        this.items.sort(this.selectedSortField.func);
        if (this.selectedSortField.direction === -1) {
            this.items.reverse();
        }
    }

    filterItems(query) {
        query = (query || '').toLowerCase();

        if (!query) {
            this.items = [...this.allItems];
        } else {
            this.items = this.allItems.filter(item => this.onFilter(item, query));
        }

        this.renderList();
    }

    renderList() {
        // Clear list container
        this.listContainer.innerHTML = '';

        // Rebuild selectedIndices based on which items still exist
        const oldSelectedCount = this.selectedIndices.length;
        this.selectedIndices = [];

        this.items.forEach((item, idx) => {
            if (this.selectedItems.has(item)) {
                this.selectedIndices.push(idx);
            }
        });

        // Remove items from selectedItems that are no longer in the list
        const currentItemsSet = new Set(this.items);
        const itemsToRemove = [];
        this.selectedItems.forEach(item => {
            if (!currentItemsSet.has(item)) {
                itemsToRemove.push(item);
            }
        });
        itemsToRemove.forEach(item => this.selectedItems.delete(item));

        // Check if selection changed
        const selectionChanged = oldSelectedCount !== this.selectedIndices.length;

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
            if (this.selectionMode !== ListComponent.SELECTION_MODE_NONE) {
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
        this.listContainer.appendChild(ul);

        // Scroll selected item into view
        this.scrollSelectedIntoView();

        // Notify if selection changed
        if (selectionChanged && this.onSelect) {
            const selectedItems = this.selectedIndices.map(i => this.items[i]);
            this.onSelect(selectedItems);
        }
    }

    /**
     * Scrolls the first selected item into view if it exists.
     */
    scrollSelectedIntoView() {
        if (this.selectedIndices.length > 0 && this.itemElements.length > 0) {
            const selectedIndex = this.selectedIndices[0];
            const selectedElement = this.itemElements[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    handleSelect(idx) {
        const item = this.items[idx];

        if (this.selectionMode === ListComponent.SELECTION_MODE_SINGLE) {
            this.selectedIndices = [idx];
            this.selectedItems.clear();
            this.selectedItems.add(item);
        } else if (this.selectionMode === ListComponent.SELECTION_MODE_MULTIPLE) {
            if (this.selectedIndices.includes(idx)) {
                this.selectedIndices = this.selectedIndices.filter(i => i !== idx);
                this.selectedItems.delete(item);
            } else {
                this.selectedIndices.push(idx);
                this.selectedItems.add(item);
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

        // Scroll selected item into view
        this.scrollSelectedIntoView();

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

    /**
     * Clears all selections.
     */
    clearSelection() {
        this.selectedIndices = [];
        this.selectedItems.clear();
        
        // Update selection classes in the DOM
        if (this.itemElements) {
            this.itemElements.forEach((li) => {
                li.classList.remove('selected');
            });
        }
        
        if (this.onSelect) {
            this.onSelect([]);
        }
    }

    updateItems(newItems) {
        this.allItems = newItems || [];
        this.filterItems(this.searchInput ? this.searchInput.value : '');
    }
    
    /**
     * Updates a specific item in the list without re-rendering the entire list.
     * @param {*} updatedItem - The updated item data
     * @param {Function} findFn - Function(item) => boolean, returns true for the item to update
     */
    updateItem(updatedItem, findFn) {
        // Find and update the item in allItems array
        const allIndex = this.allItems.findIndex(findFn);
        if (allIndex === -1) {
            return; // Item not found
        }
        
        const oldItem = this.allItems[allIndex];
        this.allItems[allIndex] = updatedItem;

        // Update selectedItems if this item was selected
        if (this.selectedItems.has(oldItem)) {
            this.selectedItems.delete(oldItem);
            this.selectedItems.add(updatedItem);
        }

        // Re-apply filter and sort to update the items array
        if (this.searchInput && this.searchInput.value) {
            this.filterItems(this.searchInput.value);
        } else {
            this.items = [...this.allItems];
            if (this.selectedSortField) {
                this.sortItems();
            }
        }

        // Re-render the list (necessary because position might have changed)
        this.renderList();
    }

    /**
     * Stores the last selected items based on storageKey and getKeyFn.
     * @param {string} storageKey
     * @param {Function} getKeyFn - Function(item) => key used for storage.
     */
    storeLastSelected(storageKey, getKeyFn) {
        if (this.selectedIndices.length > 0) {
            const keys = this.selectedIndices.map(idx => getKeyFn(this.items[idx]));
            window.StorageService.setLocalStorageItem(storageKey, JSON.stringify(keys));
        }
    }

    /**
     * Restores the last selected items based on storageKey and getKeyFn.
     * @param {string} storageKey
     * @param {Function} getKeyFn - Function(item) => key used for storage.
     */
    setLastSelected(storageKey, getKeyFn) {
        if (this.items.length > 0) {
            const stored = window.StorageService.getLocalStorageItem(storageKey, []);
            if (stored.length > 0) {
                this.items.forEach((item, idx) => {
                    if (stored.includes(getKeyFn(item))) {
                        this.handleSelect(idx);
                    }
                });
            }
        }
    }
}

window.ListComponent = ListComponent;
// Static selection mode constants for encapsulation and external usage
ListComponent.SELECTION_MODE_NONE = 'none';
ListComponent.SELECTION_MODE_SINGLE = 'single';
ListComponent.SELECTION_MODE_MULTIPLE = 'multiple';
