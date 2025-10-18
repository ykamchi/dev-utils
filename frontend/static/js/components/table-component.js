// Table Component - Reusable table framework for tools and panels
// Provides loading/error states, custom cell renderers, and theme integration
// Sorting and filtering are handled by the parent tool/panel

class TableComponent {
    constructor(options = {}) {
        this.container = options.container;
        this.columns = options.columns || [];
        this.data = options.data || [];
        this.sorting = { enabled: true, ...options.sorting };
        this.cellRenderers = options.cellRenderers || {}; // Custom cell renderers
        this.storageKey = options.storageKey;
        this.resizable = options.resizable !== false; // Enable column resizing by default

        // Column width state
        this.columnWidths = {};
        
        // Resize state
        this.resizeState = {
            isResizing: false,
            columnIndex: -1,
            startX: 0,
            startWidth: 0
        };

        // No internal sorting state - handled by parent
        this.init();
    }

    // Initialize the component
    init() {
        if (!this.container) {
            console.error('TableComponent: container element is required');
            return;
        }

        this.loadColumnWidths();
        this.render();
        this.setupEventListeners();
    }

    // Render the table
    render() {
        if (!this.container) return;

        const html = this.renderTable();
        this.container.innerHTML = html;
    }

    // Render the table
    renderTable() {
        if (!this.data || this.data.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="framework-table-container">
                <table class="framework-table">
                    <thead>
                        <tr>
                            ${this.columns.map((col, index) => `
                                <th ${col.sortable !== false && this.sorting.enabled ? 'class="sortable"' : ''}
                                    data-column="${col.key}" 
                                    style="width: ${this.getColumnWidth(col.key)}px; min-width: ${this.getColumnMinWidth(col)}px;">
                                    ${col.label || col.key}
                                    ${this.renderSortIndicator(col.key)}
                                    ${this.resizable && index < this.columns.length - 1 ? '<div class="resize-handle" data-column-index="' + index + '"></div>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="table-body">
                        ${this.data.map((row, rowIndex) => `
                            <tr>
                                ${this.columns.map(col => `
                                    <td class="table-cell" data-column="${col.key}" data-row="${rowIndex}"></td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render sort indicator
    renderSortIndicator(columnKey) {
        if (!this.sorting.enabled) return '';

        // Sort indicators are controlled by parent - just show neutral indicator
        return '<span class="sort-emoji">↕️</span>';
    }

    // Get cell content (returns string or HTML element)
    getCellContent(column, row) {
        const value = row[column.key] || '';

        // Check for custom renderer first
        if (this.cellRenderers[column.key]) {
            const result = this.cellRenderers[column.key](value, row, column);
            if (result !== undefined) {
                return result; // Can be string or HTMLElement
            }
        }

        if (column.truncate) {
            // Return HTML element for truncated text with title
            const span = document.createElement('span');
            span.title = value;
            span.textContent = value;
            return span;
        }

        return value;
    }

    // Render empty state
    renderEmptyState() {
        return `
            <div class="framework-table-empty-state">
                <p>No data available</p>
            </div>
        `;
    }

    // Render loading state
    renderLoadingState() {
        return `
            <div class="framework-table-loading-state">
                <div class="loading-spinner"></div>
                <p>Loading data...</p>
            </div>
        `;
    }

    // Render error state
    renderErrorState(message) {
        return `
            <div class="framework-table-error-state">
                <p>❌ Error: ${message}</p>
                <button class="framework-table-retry-btn">Retry</button>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.container) return;

        // Sort listeners
        if (this.sorting.enabled) {
            const sortableHeaders = this.container.querySelectorAll('th.sortable');
            sortableHeaders.forEach(header => {
                header.addEventListener('click', (e) => {
                    // Only handle sort if not clicking on resize handle
                    if (!e.target.classList.contains('resize-handle')) {
                        const column = e.currentTarget.dataset.column;
                        this.handleSort(column);
                    }
                });
            });
        }

        // Resize listeners
        if (this.resizable) {
            const resizeHandles = this.container.querySelectorAll('.resize-handle');
            resizeHandles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.startResize(e, parseInt(handle.dataset.columnIndex));
                });
            });
        }

        // Retry button
        const retryBtn = this.container.querySelector('.framework-table-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                if (this.onRetry) {
                    this.onRetry();
                }
            });
        }

        // Cell click listeners for truncated content
        const cells = this.container.querySelectorAll('td');
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                this.handleCellClick(e, cell);
            });
        });
    }

    // Handle sorting
    handleSort(column) {
        // Just fire the event - sorting is handled by parent
        if (this.onSort) {
            this.onSort({ column });
        }
    }

    // Start column resize
    startResize(e, columnIndex) {
        this.resizeState.isResizing = true;
        this.resizeState.columnIndex = columnIndex;
        this.resizeState.startX = e.clientX;
        
        const header = e.target.closest('th');
        this.resizeState.startWidth = header.offsetWidth;

        // Add global event listeners
        document.addEventListener('mousemove', this.handleResizeMove.bind(this));
        document.addEventListener('mouseup', this.handleResizeEnd.bind(this));

        // Add resize cursor
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    // Handle resize mouse move
    handleResizeMove(e) {
        if (!this.resizeState.isResizing) return;

        const deltaX = e.clientX - this.resizeState.startX;
        const newWidth = Math.max(
            this.getColumnMinWidth(this.columns[this.resizeState.columnIndex]), 
            this.resizeState.startWidth + deltaX
        );

        // Update column width
        const columnKey = this.columns[this.resizeState.columnIndex].key;
        this.columnWidths[columnKey] = newWidth;

        // Update the header width immediately
        const headers = this.container.querySelectorAll('th');
        if (headers[this.resizeState.columnIndex]) {
            headers[this.resizeState.columnIndex].style.width = newWidth + 'px';
        }
    }

    // Handle resize end
    handleResizeEnd(e) {
        if (!this.resizeState.isResizing) return;

        this.resizeState.isResizing = false;
        
        // Remove global event listeners
        document.removeEventListener('mousemove', this.handleResizeMove.bind(this));
        document.removeEventListener('mouseup', this.handleResizeEnd.bind(this));

        // Reset cursor
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Save column widths
        this.saveColumnWidths();
    }

    // Populate cells with content after HTML structure is rendered
    populateCells() {
        if (!this.data || !this.container) return;

        const tbody = this.container.querySelector('.table-body');
        if (!tbody) return;

        this.data.forEach((row, rowIndex) => {
            this.columns.forEach((col, colIndex) => {
                const cell = tbody.children[rowIndex]?.children[colIndex];
                if (!cell) return;

                // Clear existing content
                cell.innerHTML = '';

                // Get cell content (can be string or HTML element)
                const content = this.getCellContent(col, row);

                if (content instanceof HTMLElement) {
                    // If it's an HTML element, append it
                    cell.appendChild(content);
                } else {
                    // If it's a string, set as text content
                    cell.textContent = content;
                }
            });
        });
    }

    // Set loading state
    setLoading(loading = true) {
        if (!this.container) return;

        if (loading) {
            this.container.innerHTML = this.renderLoadingState();
        } else {
            this.render();
            this.setupEventListeners();
            this.populateCells();
        }
    }

    // Set error state
    setError(message) {
        if (!this.container) return;

        this.container.innerHTML = this.renderErrorState(message);
        this.setupEventListeners();
    }

    // Update data
    updateData(data) {
        this.data = data || [];
        this.render();
        this.setupEventListeners();
        this.populateCells();
    }

    // Get column width (with default)
    getColumnWidth(columnKey) {
        return this.columnWidths[columnKey] || this.getDefaultColumnWidth(columnKey);
    }

    // Get default column width based on column type
    getDefaultColumnWidth(columnKey) {
        // Special cases for known column types
        if (columnKey === 'jobId') return 100;
        if (columnKey === 'companyId') return 120;
        if (columnKey === 'queueId') return 100;
        if (columnKey === 'jobStatus') return 100;
        if (columnKey === 'creationTimestamp') return 150;
        if (columnKey.includes('jobName') || columnKey.includes('Name')) return 200;
        if (columnKey.includes('jobDetails') || columnKey.includes('Details')) return 250;
        return 150; // Default width
    }

    // Get minimum column width
    getColumnMinWidth(column) {
        if (column.key === 'jobId') return 80;
        if (column.key === 'companyId') return 100;
        if (column.key === 'queueId') return 80;
        if (column.key === 'jobStatus') return 80;
        if (column.key === 'creationTimestamp') return 120;
        if (column.key.includes('jobName') || column.key.includes('Name')) return 150;
        if (column.key.includes('jobDetails') || column.key.includes('Details')) return 200;
        return 100; // Default minimum
    }

    // Load column widths from storage
    loadColumnWidths() {
        if (!this.storageKey) return;
        
        try {
            const saved = StorageService.getToolState(`${this.storageKey}-columns`);
            if (saved && typeof saved === 'object') {
                this.columnWidths = { ...saved };
            }
        } catch (error) {
            console.warn('TableComponent: Failed to load column widths:', error);
        }
    }

    // Save column widths to storage
    saveColumnWidths() {
        if (!this.storageKey) return;
        
        try {
            StorageService.setToolState(`${this.storageKey}-columns`, this.columnWidths);
        } catch (error) {
            console.warn('TableComponent: Failed to save column widths:', error);
        }
    }

    // Handle cell click for truncated content
    handleCellClick(e, cellElement) {
        const rowIndex = parseInt(cellElement.dataset.row);
        const columnKey = cellElement.dataset.column;
        
        if (isNaN(rowIndex) || !columnKey) return;
        
        const row = this.data[rowIndex];
        const column = this.columns.find(col => col.key === columnKey);
        
        if (!row || !column) return;
        
        const value = row[column.key];
        
        // Check if this column has truncate enabled and content exists
        if (column.truncate && value) {
            // Show popup for all truncated columns
            // Create popup content
            const contentElement = document.createElement('div');
            contentElement.style.padding = '16px';
            contentElement.style.maxWidth = '500px';
            contentElement.style.wordWrap = 'break-word';
            contentElement.style.whiteSpace = 'pre-wrap';

            // Add content
            const valueElement = document.createElement('div');
            valueElement.textContent = value;
            valueElement.style.fontFamily = 'monospace';
            valueElement.style.fontSize = '14px';
            valueElement.style.lineHeight = '1.4';
            contentElement.appendChild(valueElement);

            // Create and show popup
            const popup = new PopupComponent({
                icon: '📄',
                title: column.label,
                content: contentElement,
                closable: true,
                overlay: true,
                closeOnOutsideClick: true,
                width: 'auto',
                height: 'auto'
            });

            popup.show();

            // Prevent event bubbling
            e.stopPropagation();
        }

        // Call custom cell click handler if provided
        if (this.onCellClick) {
            this.onCellClick(cellElement, value, row, column);
        }
    }
}

// Export for use in other modules
window.TableComponent = TableComponent;