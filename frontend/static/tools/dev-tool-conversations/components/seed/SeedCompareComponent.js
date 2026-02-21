(function () {
    /*
        SeedCompareComponent: displays comparison between seed data and current group data
    */
    class SeedCompareComponent {
        constructor(data, onReloadFromSeed, onOverrideSeed, onDirtySeed, onDirty, dataFilter = [], title = 'Seed Data Compare') {
            this.onReloadFromSeed = onReloadFromSeed;
            this.onOverrideSeed = onOverrideSeed;
            this.onDirtySeed = onDirtySeed;
            this.onDirty = onDirty;
            this.dataFilter = dataFilter;
            this.title = title;

            this.data = data;
            this.dataOrig = _.cloneDeep(data);
            this.seed = null;

            this.popup = null;
        }

        undoChanges() {
            this.data = _.cloneDeep(this.dataOrig);
            this.onDirty(false);
            this.onDirtySeed(this.dirty());
        }

        updateSeed(seed) {
            this.seed = seed;
            this.onDirtySeed(this.dirty());
        }

        // Apply a change function to the data and check for changes compared to original data
        // The changeFunction receives the current data and can modify it directly (since it's an object), 
        // then we check if the modified data is different from the original data to determine if there are unsaved changes
        // and call the onDirty callback with the result, which can be used to enable/disable save buttons or show warnings
        change(changeFunction) {
            changeFunction(this.data);
            this.onDirty(!_.isEqual(this.data, this.dataOrig));
        }

        // Update the data with new data (e.g. from seed) and reset original data to the new data, since we consider the new 
        // data as the "saved" state, and then check for changes compared to seed to update the onDirtySeed state 
        // then check for changes compared to seed
        update(newData) {
            this.dataOrig = _.cloneDeep(newData);
            this.change((data) => { this.data = newData; });
            this.onDirtySeed(this.dirty());
        }

        hasChanges() {
            return !_.isEqual(this.data, this.dataOrig);
        }

        // Check if there are differences between the current data and the seed, after applying the data filter
        dirty() {
            const filteredData = this.applyDataFilter(this.data);
            const filteredSeed = this.applyDataFilter(this.seed);
            return !_.isEqual(filteredData, filteredSeed);
        }

        // Show the popup
        show() {
            this.popup = new window.PopupComponent({
                icon: '💡', 
                title: this.title, 
                width: 1200, 
                height: 720, 
                closeOnOutsideClick: false, // Keep modal open when clicking overlay
                content: (container) => {
                    this.render(container);
                },
            });
            this.popup.show();
        }

        render(container) {
            const wrapper = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

            const pageButtons = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');

            // Apply data filter
            const filteredData = this.applyDataFilter(this.data);

            if (this.seed) {
                // Seed exists - save to override
                new window.ButtonComponent(pageButtons, {
                    label: '💾 Override seed',
                    onClick: async () => { await this.onOverrideSeed(filteredData); this.popup.hide(); },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '💾 Override seed'
                });

                // Seed exists - reload from seed
                new window.ButtonComponent(pageButtons, {
                    label: '💡 Reload from seed',
                    onClick: async () => { this.data = { ...this.data, ...this.seed }; await this.onReloadFromSeed(); this.popup.hide(); },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '💡 Reload from seed'
                });

            } else {
                // Seed does not exist - create new seed
                new window.ButtonComponent(pageButtons, {
                    label: '💾 Create seed',
                    onClick: async () => { await this.onOverrideSeed(filteredData); this.popup.hide(); },
                    type: window.ButtonComponent.TYPE_GHOST,
                    tooltip: '💾 Create seed'
                });
            }

            // Show single diff component
            new window.DiffComponent(
                wrapper,
                window.Utils.sortJsonKeys(this.seed || {}),
                window.Utils.sortJsonKeys(filteredData),
                {
                    leftLabel: 'Seed Data',
                    rightLabel: 'Current Data',
                    height: 500
                }
            );
        }

        // Helper to delete a property from an object using dot notation
        deletePropertyByPath(obj, path) {
            const parts = path.split('.');
            const lastPart = parts.pop();
            let current = obj;
            
            // Navigate to the parent object
            for (const part of parts) {
                if (current[part] === undefined) {
                    return; // Path doesn't exist, nothing to delete
                }
                current = current[part];
            }
            
            // Delete the final property
            delete current[lastPart];
        }

        // Apply dataFilter to remove specified properties
        applyDataFilter(data) {
            const filtered = _.cloneDeep(data); // Deep clone
            
            if (filtered) {
                for (const path of this.dataFilter) {
                    this.deletePropertyByPath(filtered, path);
                }
            }
            
            return filtered;
        }

    }

    window.conversations = window.conversations || {};
    window.conversations.SeedCompareComponent = SeedCompareComponent;
})();
