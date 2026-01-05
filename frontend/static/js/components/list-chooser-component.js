// Framework ListChooserComponent
(function () {
    class ListChooserComponent {
        /**
         * @param {HTMLElement} container - The container to append the chooser to
         * @param {Array<{label: string, value: any}>} sourceItems - The source list items
         * @param {function(selected: Array<{label: string, value: any}>): void} onSelectionChange - Callback when selection changes
         * @param {Array<{label: string, value: any}>} [initialSelected] - Optional initial selected items
         */
        constructor(container, items, renderItemFunction) {
            this.container = container;
            this.items = items;
            this.renderItemFunction = renderItemFunction;
            this.render();
        }

        render() {

            const chooserWrapper = document.createElement('div');
            chooserWrapper.style.display = 'flex';
            chooserWrapper.style.flexDirection = 'row';
            chooserWrapper.style.flex = '1';
            chooserWrapper.style.overflow = 'auto';
            chooserWrapper.style.width = '100%';
            chooserWrapper.style.gap = '24px';

            // Source list
            const sourceListContainer = document.createElement('div');
            sourceListContainer.style.flex = '1';
            sourceListContainer.style.overflow = 'auto';
            sourceListContainer.style.display = 'flex';
            sourceListContainer.style.flexDirection = 'column';
            chooserWrapper.appendChild(sourceListContainer);

            // Middle buttons
            const buttonCol = document.createElement('div');
            buttonCol.style.display = 'flex';
            buttonCol.style.flexDirection = 'column';
            buttonCol.style.gap = '8px';
            buttonCol.style.flex = '0';
            buttonCol.style.alignItems = 'center';
            chooserWrapper.appendChild(buttonCol);

            // Target list
            const targetListContainer = document.createElement('div');
            targetListContainer.style.flex = '1';
            targetListContainer.style.overflow = 'auto';
            targetListContainer.style.display = 'flex';
            targetListContainer.style.flexDirection = 'column';
            chooserWrapper.appendChild(targetListContainer);

            // Source ListComponent
            const sourceList = new window.ListComponent(
                sourceListContainer,
                this.items,
                this.renderItemFunction
            );


            // Target ListComponent
            // const targetList = new window.ListComponent(
            //     targetListContainer,
            //     chooserWrapper,
            //     this.renderItemFunction
            // );

            // Button actions
            const moveToTarget = () => {
                const toMove = this.unselectedItems.filter(i => selectedSource.has(i.value));
                this.selectedItems = [...this.selectedItems, ...toMove];
                this.unselectedItems = this.unselectedItems.filter(i => !selectedSource.has(i.value));
                selectedSource.clear();
                this.render();
                this.onSelectionChange(this.selectedItems);
            };
            const moveToSource = () => {
                const toMove = this.selectedItems.filter(i => selectedTarget.has(i.value));
                this.unselectedItems = [...this.unselectedItems, ...toMove];
                this.selectedItems = this.selectedItems.filter(i => !selectedTarget.has(i.value));
                selectedTarget.clear();
                this.render();
                this.onSelectionChange(this.selectedItems);
            };
            const moveAllToTarget = () => {
                this.selectedItems = [...this.selectedItems, ...this.unselectedItems];
                this.unselectedItems = [];
                selectedSource.clear();
                this.render();
                this.onSelectionChange(this.selectedItems);
            };
            const moveAllToSource = () => {
                this.unselectedItems = [...this.unselectedItems, ...this.selectedItems];
                this.selectedItems = [];
                selectedTarget.clear();
                this.render();
                this.onSelectionChange(this.selectedItems);
            };

            // Buttons
            new window.ButtonComponent(buttonCol, '>', moveToTarget);
            new window.ButtonComponent(buttonCol, '<', moveToSource);
            new window.ButtonComponent(buttonCol, '>>', moveAllToTarget);
            new window.ButtonComponent(buttonCol, '<<', moveAllToSource);

            // chooserWrapperColumn.appendChild(chooserWrapper);
            // this.container.appendChild(chooserWrapperColumn);
            this.container.appendChild(chooserWrapper);
        }
    }

    window.ListChooserComponent = ListChooserComponent;
})();
