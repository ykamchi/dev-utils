// Panel Drag and Drop Service
// Handles drag and drop functionality for panels

const PanelsDragDropService = {
    dragState: null, // Current drag state

    // Initialize drag and drop for panels
    initialize(panelsService) {
        console.log('[PanelsDragDropService] Initializing drag and drop for panels');

        this.panelsService = panelsService;
        this.dragState = null;
        this.resizeState = null;

        const container = this.panelsService.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (!container) return;

        // Make panels draggable
        const panels = container.querySelectorAll('.expanded-panel');
        panels.forEach(panel => {
            panel.draggable = true;
            panel.addEventListener('dragstart', this.handleDragStart.bind(this));
            panel.addEventListener('dragend', this.handleDragEnd.bind(this));

            // Add resize event listeners for flexible mode
            if (this.panelsService.currentViewMode === 'flexible') {
                this.addResizeListeners(panel);
            }
        });

        // Make container a drop zone
        container.addEventListener('dragover', this.handleDragOver.bind(this));
        container.addEventListener('drop', this.handleDrop.bind(this));

        // Restore panel positions if in flexible mode
        if (this.panelsService.currentViewMode === 'flexible') {
            this.restorePanelPositions();
            this.restorePanelDimensions();
        }
    },

    // Handle drag start
    handleDragStart(e) {
        const rect = e.target.getBoundingClientRect();
        this.dragState = {
            draggedPanel: e.target.dataset.panelName,
            draggedElement: e.target,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top
        };
        e.target.style.opacity = '0.5';
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    // Handle drag end
    handleDragEnd(e) {
        if (this.dragState) {
            e.target.style.opacity = '1';
            e.target.classList.remove('dragging');
            this.dragState = null;
        }

        // Remove drag-over class from container
        const container = this.panelsService.panelsState.contentArea.querySelector('.expanded-panels-container');
        if (container) {
            container.classList.remove('drag-over');
        }
    },

    // Handle drag over
    handleDragOver(e) {
        e.preventDefault(); // Allow drop
        e.dataTransfer.dropEffect = 'move';

        // Add visual feedback
        const container = e.currentTarget;
        container.classList.add('drag-over');
    },

    // Handle drop
    handleDrop(e) {
        console.log('[PanelsDragDropService] Handling drop event', e);
        e.preventDefault();

        if (!this.dragState) return;

        const container = e.currentTarget;
        const draggedPanel = this.dragState.draggedPanel;
        const draggedElement = this.dragState.draggedElement;

        // Check if we're in flexible mode
        if (this.panelsService.currentViewMode === 'flexible') {
            // In flexible mode, position the panel where the mouse cursor is
            const containerRect = container.getBoundingClientRect();
            // const containerStyles = window.getComputedStyle(container);
            // const paddingLeft = parseInt(containerStyles.paddingLeft) || 0;
            // const paddingTop = parseInt(containerStyles.paddingTop) || 0;

            // Calculate position relative to content area (inside padding), accounting for grab offset
            const panelLeft = e.clientX - containerRect.left - this.dragState.offsetX;
            const panelTop = e.clientY - containerRect.top - this.dragState.offsetY;

            // Apply new position
            draggedElement.style.left = panelLeft + 'px';
            draggedElement.style.top = panelTop + 'px';

            // Save the position
            this.savePanelPosition(draggedPanel, draggedElement.style.left, draggedElement.style.top);

            // Bring the panel to the front by moving it to the end of the container
            container.appendChild(draggedElement);
        } else {
            // Original behavior for other modes
            const dropTarget = e.target.closest('.expanded-panel');

            if (!dropTarget || dropTarget.dataset.panelName === draggedPanel) {
                return;
            }

            const dropPanel = dropTarget.dataset.panelName;

            // Determine if we should insert before or after based on mouse position
            const rect = dropTarget.getBoundingClientRect();
            const isAfter = e.clientX > rect.left + rect.width / 2;

            // Reorder panels
            this.reorderPanels(draggedPanel, dropPanel, isAfter);

            // Move the DOM element instead of recreating all panels
            if (draggedElement && dropTarget) {
                const parent = dropTarget.parentNode;
                if (isAfter) {
                    parent.insertBefore(draggedElement, dropTarget.nextSibling);
                } else {
                    parent.insertBefore(draggedElement, dropTarget);
                }
            }
        }
    },

    // Reorder panels in expand order
    reorderPanels(draggedPanel, targetPanel, insertAfter = false) {
        console.log(`[PanelsDragDropService] Reordering panels: ${draggedPanel} -> ${targetPanel}, insertAfter: ${insertAfter}`);

        const currentIndex = this.panelsService.panelsState.expandOrder.indexOf(draggedPanel);
        const targetIndex = this.panelsService.panelsState.expandOrder.indexOf(targetPanel);

        if (currentIndex === -1 || targetIndex === -1) return;

        // Remove dragged panel from current position
        this.panelsService.panelsState.expandOrder.splice(currentIndex, 1);

        // Insert at target position (after if insertAfter is true)
        const insertPosition = insertAfter ? targetIndex + 1 : targetIndex;
        this.panelsService.panelsState.expandOrder.splice(insertPosition, 0, draggedPanel);
    },

    // Save panel position for flexible mode
    savePanelPosition(panelName, left, top) {
        const toolName = this.panelsService.toolName;
        const positions = StorageService.getToolState(toolName, {}).panelPositions || {};
        positions[panelName] = { left, top };
        
        const toolState = StorageService.getToolState(toolName, {});
        toolState.panelPositions = positions;
        StorageService.setToolState(toolName, toolState);
    },

    // Restore panel positions for flexible mode
    restorePanelPositions() {
        if (this.panelsService.currentViewMode !== 'flexible') return;

        const toolName = this.panelsService.toolName;
        const positions = StorageService.getToolState(toolName, {}).panelPositions || {};
        const container = this.panelsService.panelsState.contentArea.querySelector('.expanded-panels-container');

        if (!container) return;

        // Apply saved positions to panels
        Object.entries(positions).forEach(([panelName, position]) => {
            const panelElement = container.querySelector(`[data-panel-name="${panelName}"]`);
            if (panelElement) {
                panelElement.style.left = position.left;
                panelElement.style.top = position.top;
            }
        });

        // Position panels that don't have saved positions at 0,0
        const allPanels = container.querySelectorAll('.expanded-panel');
        allPanels.forEach(panel => {
            const panelName = panel.dataset.panelName;
            if (!positions[panelName]) {
                panel.style.left = '0px';
                panel.style.top = '0px';
            }
        });

        // Also restore dimensions
        this.restorePanelDimensions();
    },

    // Restore panel dimensions for flexible mode
    restorePanelDimensions() {
        if (this.panelsService.currentViewMode !== 'flexible') return;

        const toolName = this.panelsService.toolName;
        const dimensions = StorageService.getToolState(toolName, {}).panelDimensions || {};
        const container = this.panelsService.panelsState.contentArea.querySelector('.expanded-panels-container');

        if (!container) return;

        // Apply saved dimensions to panels
        Object.entries(dimensions).forEach(([panelName, dimension]) => {
            const panelElement = container.querySelector(`[data-panel-name="${panelName}"]`);
            if (panelElement) {
                panelElement.style.width = dimension.width;
                panelElement.style.height = dimension.height;
            }
        });
    },

    // Add resize event listeners to a panel
    addResizeListeners(panel) {
        panel.addEventListener('mousedown', this.handleMouseDown.bind(this));
        panel.addEventListener('mousemove', this.handleMouseMoveCursor.bind(this));
    },

    // Handle mouse move for cursor changes
    handleMouseMoveCursor(e) {
        if (this.panelsService.currentViewMode !== 'flexible') return;

        const panel = e.currentTarget;
        const rect = panel.getBoundingClientRect();
        const borderSize = 10;

        const nearLeft = e.clientX <= rect.left + borderSize;
        const nearRight = e.clientX >= rect.right - borderSize;
        const nearTop = e.clientY <= rect.top + borderSize;
        const nearBottom = e.clientY >= rect.bottom - borderSize;

        let cursor = 'move'; // default

        if (nearLeft && nearTop) cursor = 'nw-resize';
        else if (nearRight && nearTop) cursor = 'ne-resize';
        else if (nearLeft && nearBottom) cursor = 'sw-resize';
        else if (nearRight && nearBottom) cursor = 'se-resize';
        else if (nearTop) cursor = 'n-resize';
        else if (nearBottom) cursor = 's-resize';
        else if (nearLeft) cursor = 'w-resize';
        else if (nearRight) cursor = 'e-resize';

        panel.style.cursor = cursor;
    },

    // Handle mouse down for resize detection
    handleMouseDown(e) {
        // Check if clicking on resize handle (any border edge)
        const panel = e.currentTarget;
        const rect = panel.getBoundingClientRect();
        const borderSize = 10; // pixels from edge to consider as resize area

        // Determine which edges/corners are being resized
        const nearLeft = e.clientX <= rect.left + borderSize;
        const nearRight = e.clientX >= rect.right - borderSize;
        const nearTop = e.clientY <= rect.top + borderSize;
        const nearBottom = e.clientY >= rect.bottom - borderSize;

        const isResizeHandle = (nearLeft || nearRight || nearTop || nearBottom) && this.panelsService.currentViewMode === 'flexible';

        if (isResizeHandle) {
            this.resizeState = {
                panel: panel,
                panelName: panel.dataset.panelName,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: panel.offsetLeft,
                startTop: panel.offsetTop,
                startWidth: panel.offsetWidth,
                startHeight: panel.offsetHeight,
                resizeLeft: nearLeft,
                resizeRight: nearRight,
                resizeTop: nearTop,
                resizeBottom: nearBottom
            };

            // Add resizing class to disable transitions
            panel.classList.add('resizing');

            document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            document.addEventListener('mouseup', this.handleMouseUp.bind(this));
            e.preventDefault();
            e.stopPropagation();
        }
    },

    // Handle mouse move for resizing
    handleMouseMove(e) {
        if (!this.resizeState) return;

        // Store the current mouse position
        this.resizeState.currentX = e.clientX;
        this.resizeState.currentY = e.clientY;

        // Use requestAnimationFrame to throttle updates to browser refresh rate
        if (!this.resizeState.animationFrameId) {
            this.resizeState.animationFrameId = requestAnimationFrame(() => {
                this.updateResize();
            });
        }
    },

    // Update resize dimensions (called via requestAnimationFrame)
    updateResize() {
        if (!this.resizeState) return;

        const deltaX = this.resizeState.currentX - this.resizeState.startX;
        const deltaY = this.resizeState.currentY - this.resizeState.startY;

        let newLeft = this.resizeState.startLeft;
        let newTop = this.resizeState.startTop;
        let newWidth = this.resizeState.startWidth;
        let newHeight = this.resizeState.startHeight;

        // Apply resizing based on active directions
        if (this.resizeState.resizeRight) {
            newWidth = Math.max(300, this.resizeState.startWidth + deltaX);
        }
        if (this.resizeState.resizeBottom) {
            newHeight = Math.max(200, this.resizeState.startHeight + deltaY);
        }
        if (this.resizeState.resizeLeft) {
            const newWidthFromLeft = Math.max(300, this.resizeState.startWidth - deltaX);
            newLeft = this.resizeState.startLeft + (this.resizeState.startWidth - newWidthFromLeft);
            newWidth = newWidthFromLeft;
        }
        if (this.resizeState.resizeTop) {
            const newHeightFromTop = Math.max(200, this.resizeState.startHeight - deltaY);
            newTop = this.resizeState.startTop + (this.resizeState.startHeight - newHeightFromTop);
            newHeight = newHeightFromTop;
        }

        // Apply the new dimensions and position
        this.resizeState.panel.style.left = newLeft + 'px';
        this.resizeState.panel.style.top = newTop + 'px';
        this.resizeState.panel.style.width = newWidth + 'px';
        this.resizeState.panel.style.height = newHeight + 'px';

        // Clear the animation frame ID
        this.resizeState.animationFrameId = null;
    },

    // Handle mouse up for resize end
    handleMouseUp(e) {
        if (this.resizeState) {
            // Cancel any pending animation frame
            if (this.resizeState.animationFrameId) {
                cancelAnimationFrame(this.resizeState.animationFrameId);
            }

            // Remove resizing class to re-enable transitions
            this.resizeState.panel.classList.remove('resizing');

            // Save the new dimensions
            const panel = this.resizeState.panel;
            const panelName = this.resizeState.panelName;
            this.savePanelDimensions(panelName, panel.style.width, panel.style.height);

            // Bring the panel to the front by moving it to the end of the container
            const container = this.panelsService.panelsState.contentArea.querySelector('.expanded-panels-container');
            if (container) {
                container.appendChild(panel);
            }

            this.resizeState = null;
        }

        document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    },

    // Save panel dimensions for flexible mode
    savePanelDimensions(panelName, width, height) {
        const toolName = this.panelsService.toolName;
        const dimensions = StorageService.getToolState(toolName, {}).panelDimensions || {};
        dimensions[panelName] = { width, height };

        const toolState = StorageService.getToolState(toolName, {});
        toolState.panelDimensions = dimensions;
        StorageService.setToolState(toolName, toolState);
    }
};

// Make PanelsDragDropService globally available
window.PanelsDragDropService = PanelsDragDropService;