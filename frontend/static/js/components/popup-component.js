// Popup Component - Reusable popup/modal framework for tools and panels
// Provides overlay, positioning, close functionality, and theme integration
// Content is provided by the calling component as HTML elements

class PopupComponent {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.content = options.content; // HTML element or array of elements
        this.icon = options.icon || '📋'; // Default icon
        this.title = options.title || ''; // Default title
        this.position = options.position || { x: 'center', y: 'center' };
        this.anchorElement = options.anchorElement || null; // Element to position relative to
        this.width = options.width || 'auto'; // Popup width
        this.height = options.height || 'auto'; // Popup height
        this.closable = options.closable !== false; // Show close button by default
        this.overlay = options.overlay !== false; // Show overlay by default
        this.closeOnOutsideClick = options.closeOnOutsideClick !== false; // Close on outside click by default

        // State
        this.isVisible = false;
        this.popupElement = null;
        this.overlayElement = null;

        // Event callbacks
        this.onOpen = options.onOpen || null;
        this.onClose = options.onClose || null;
        this.onOutsideClick = options.onOutsideClick || null;
    }

    // Show the popup
    show() {
        if (this.isVisible) return;

        this.isVisible = true;

        // Handle anchor-based positioning
        if (this.anchorElement) {
            const anchorRect = this.anchorElement.getBoundingClientRect();
            this.position = {
                x: anchorRect.left,
                y: anchorRect.bottom + 5
            };
        }

        this.render();

        // Call onOpen callback
        if (this.onOpen) {
            this.onOpen();
        }
    }

    // Hide the popup
    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        // Call destroy on content instance if available
        if (this._contentInstance && typeof this._contentInstance.destroy === 'function') {
            try { this._contentInstance.destroy(); } catch (e) { }
        }
        this.destroy();

        // Call onClose callback
        if (this.onClose) {
            this.onClose();
        }
    }

    // Render the popup
    render() {
        // Create overlay if needed
        if (this.overlay) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'framework-popup-overlay';
            this.overlayElement.addEventListener('click', () => {
                if (this.onOutsideClick) {
                    this.onOutsideClick();
                } else if (this.closeOnOutsideClick) {
                    this.hide();
                }
            });
            this.container.appendChild(this.overlayElement);
        }

        // Create popup element
        this.popupElement = document.createElement('div');
        this.popupElement.className = 'framework-popup';

        // Apply size
        if (this.width !== 'auto') {
            this.popupElement.style.width = typeof this.width === 'number' ? `${this.width}px` : this.width;
        }
        if (this.height !== 'auto') {
            this.popupElement.style.height = typeof this.height === 'number' ? `${this.height}px` : this.height;
        }

        // Create header with close button
        if (this.closable) {
            const header = document.createElement('div');
            header.className = 'framework-popup-header';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            if (this.title) {
                const titleElement = document.createElement('div');
                titleElement.className = 'framework-popup-title';
                titleElement.innerHTML = `${this.icon} ${this.title}`;
                titleElement.style.margin = '0';
                header.appendChild(titleElement);
            } else {
                // Empty div to maintain flex layout
                const spacer = document.createElement('div');
                header.appendChild(spacer);
            }

            const closeBtn = document.createElement('button');
            closeBtn.className = 'framework-popup-close-btn';
            closeBtn.innerHTML = '✕';
            closeBtn.style.marginLeft = 'auto';
            closeBtn.addEventListener('click', () => this.hide());
            header.appendChild(closeBtn);

            this.popupElement.appendChild(header);
        }

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'framework-popup-content';

        // Add content
        this._contentInstance = null;
        if (this.content) {
            if (typeof this.content === 'function') {
                // Call the function with the content area container, and store the return value
                this._contentInstance = this.content(contentArea);
            } else if (Array.isArray(this.content)) {
                this.content.forEach(element => {
                    if (element instanceof HTMLElement) {
                        contentArea.appendChild(element);
                    }
                });
            } else if (this.content instanceof HTMLElement) {
                contentArea.appendChild(this.content);
            } else if (typeof this.content === 'string') {
                contentArea.innerHTML = this.content;
            }
        }

        this.popupElement.appendChild(contentArea);

        // Add to container
        this.container.appendChild(this.popupElement);

        setTimeout(() => {
            this.updatePosition();// Position the popup
            this.updatePosition();     
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    // Update popup position
    updatePosition() {
        if (!this.popupElement) return;

        const popupRect = this.popupElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left, top;

        // Horizontal positioning
        if (this.position.x === 'center') {
            left = (viewportWidth - popupRect.width) / 2;
        } else if (typeof this.position.x === 'number') {
            left = this.position.x;
        } else {
            left = 50; // Default left position
        }

        // Vertical positioning
        if (this.position.y === 'center') {
            top = (viewportHeight - popupRect.height) / 2;
        } else if (typeof this.position.y === 'number') {
            top = this.position.y;
        } else {
            top = 100; // Default top position
        }

        // Ensure popup stays within viewport
        left = Math.max(10, Math.min(left, viewportWidth - popupRect.width - 10));
        top = Math.max(10, Math.min(top, viewportHeight - popupRect.height - 10));

        this.popupElement.style.left = `${left}px`;
        this.popupElement.style.top = `${top}px`;
        this.popupElement.style.position = 'fixed';
    }

    // Setup event listeners
    setupEventListeners() {
        // Handle window resize to reposition popup
        this.handleResize = () => this.updatePosition();
        window.addEventListener('resize', this.handleResize);

        // Handle escape key
        this.handleKeydown = (e) => {
            if (e.key === 'Escape' && this.closable) {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.handleKeydown);

        // Handle outside click to close
        if (this.closeOnOutsideClick) {
            this.handleOutsideClick = (e) => {
                if (this.popupElement && !this.popupElement.contains(e.target)) {
                    this.hide();
                }
            };
            document.addEventListener('mousedown', this.handleOutsideClick);
        }
    }

    // Destroy the popup
    destroy() {
        // Remove event listeners
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.handleKeydown) {
            document.removeEventListener('keydown', this.handleKeydown);
        }
        if (this.handleOutsideClick) {
            document.removeEventListener('mousedown', this.handleOutsideClick);
        }

        // Remove elements
        if (this.popupElement && this.popupElement.parentNode) {
            this.popupElement.parentNode.removeChild(this.popupElement);
            this.popupElement = null;
        }

        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
            this.overlayElement = null;
        }
    }

    // Update content
    updateContent(content) {
        this.content = content;
        if (this.isVisible) {
            const contentArea = this.popupElement.querySelector('.framework-popup-content');
            if (contentArea) {
                contentArea.innerHTML = '';
                if (Array.isArray(content)) {
                    content.forEach(element => {
                        if (element instanceof HTMLElement) {
                            contentArea.appendChild(element);
                        }
                    });
                } else if (content instanceof HTMLElement) {
                    contentArea.appendChild(content);
                } else if (typeof content === 'string') {
                    contentArea.innerHTML = content;
                }
            }
        }
    }

    // Update title
    updateTitle(title) {
        this.title = title;
        if (this.isVisible) {
            // Find the title element in the header (could be h3 or custom element)
            const header = this.popupElement.querySelector('.framework-popup-header');
            if (header) {
                // Remove existing title elements
                const existingTitles = header.querySelectorAll('.framework-popup-title');
                existingTitles.forEach(el => el.remove());

                // Add new title
                if (title) {
                    if (title instanceof HTMLElement) {
                        title.style.margin = '0';
                        // Insert before the close button
                        const closeBtn = header.querySelector('.framework-popup-close-btn');
                        if (closeBtn) {
                            header.insertBefore(title, closeBtn);
                        } else {
                            header.appendChild(title);
                        }
                    } else {
                        const titleElement = document.createElement('h3');
                        titleElement.className = 'framework-popup-title';
                        titleElement.textContent = title;
                        titleElement.style.margin = '0';
                        // Insert before the close button
                        const closeBtn = header.querySelector('.framework-popup-close-btn');
                        if (closeBtn) {
                            header.insertBefore(titleElement, closeBtn);
                        } else {
                            header.appendChild(titleElement);
                        }
                    }
                }
            }
        }
    }
}

// Export for use in other modules
window.PopupComponent = PopupComponent;