// TabsetComponent.js
// Generic tabset component for framework use

class TabsetComponent {
    /**
     * @param {HTMLElement} container - The container to render the tabset into.
     * @param {Array<{name: string, populateFunc?: function(HTMLElement):void}>} tabsArray - Array of tab objects.
     * @param {string} [storageKey] - Optional key for persistent tab selection.
     * @param {function(string):void} [onTabSwitch] - Optional callback function invoked when tab is switched. Receives the new tab name.
     */
    constructor(container, tabsArray, storageKey = '', onTabSwitch = null) {
        this.container = container;
        this.tabsArray = tabsArray;
        this.storageKey = storageKey;
        this.onTabSwitch = onTabSwitch;
        this.tabContentContainers = {};
        this.populatedTabs = new Set(); // Track which tabs have been populated
        // Load last selected tab if storageKey is provided
        let lastTab = null;
        if (storageKey && window.StorageService) {
            lastTab = window.StorageService.getLocalStorageItem(storageKey, null);
        }
        this.activeTab = (lastTab && tabsArray.some(t => t.name === lastTab)) ? lastTab : tabsArray[0]?.name || null;
        this.render();
    }

    render() {
        // this.container.innerHTML = '';
        // Tab buttons
        const tabButtonsDiv = document.createElement('div');
        tabButtonsDiv.className = 'tabset-tab-buttons';
        this.tabsArray.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = 'tabset-tab-button';
            btn.textContent = tab.name;
            if (tab.name === this.activeTab) btn.classList.add('active');
            btn.addEventListener('click', () => this.switchTab(tab.name));
            tabButtonsDiv.appendChild(btn);
        });
        this.container.appendChild(tabButtonsDiv);
        // Tab content containers
        this.tabsArray.forEach(tab => {
            const tabContent = document.createElement('div');
            tabContent.className = 'tabset-tab-content';
            tabContent.dataset.tab = tab.name;
            if (tab.name === this.activeTab) tabContent.style.display = '';
            else tabContent.style.display = 'none';
            this.tabContentContainers[tab.name] = tabContent;
            this.container.appendChild(tabContent);
        });
        // Populate only the active tab initially (lazy loading for others)
        const activeTabObj = this.tabsArray.find(tab => tab.name === this.activeTab);
        if (activeTabObj && typeof activeTabObj.populateFunc === 'function') {
            this.populateTab(activeTabObj.name, activeTabObj.populateFunc);
            this.populatedTabs.add(activeTabObj.name);
        }
        // Invoke callback for initial active tab
        if (typeof this.onTabSwitch === 'function') {
            this.onTabSwitch(this.activeTab);
        }
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        // Persist tab selection if storageKey is provided
        if (this.storageKey && window.StorageService) {
            window.StorageService.setLocalStorageItem(this.storageKey, tabName);
        }
        // Update button active state
        const buttons = this.container.querySelectorAll('.tabset-tab-button');
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.textContent === tabName);
        });
        // Update tab content visibility
        Object.entries(this.tabContentContainers).forEach(([name, content]) => {
            content.style.display = (name === tabName) ? '' : 'none';
        });
        
        // Populate tab lazily if not yet populated
        if (!this.populatedTabs.has(tabName)) {
            const tabObj = this.tabsArray.find(tab => tab.name === tabName);
            if (tabObj && typeof tabObj.populateFunc === 'function') {
                this.populateTab(tabName, tabObj.populateFunc);
                this.populatedTabs.add(tabName);
            }
        }
        
        // Invoke callback if provided
        if (typeof this.onTabSwitch === 'function') {
            this.onTabSwitch(tabName);
        }
    }

    /**
     * Populate the content of a tab by name.
     * @param {string} tabName - The name of the tab to populate.
     * @param {function(HTMLElement):void} populateFn - Function to manipulate the tab content container.
     */
    populateTab(tabName, populateFn) {
        const container = this.tabContentContainers[tabName];
        if (container && typeof populateFn === 'function') {
            populateFn(container);
        }
    }
}

window.TabsetComponent = TabsetComponent;
