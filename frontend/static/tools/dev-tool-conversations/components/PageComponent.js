(function () {
    /*
        PageComponent: Generic page layout component with header, control area, buttons area, and content area
    */
    class PageComponent {
        constructor(container, emoji, title, fields) {
            this.container = container;
            this.emoji = emoji;
            this.title = title;
            this.fields = fields;
            this.wrapper = null;
            this.pageButtonsArea = null;
            this.pageControlArea = null;
            this.pageContentArea = null;
            this.render();
        }

        // Render the main structure of the left side
        render() {
            // Create wrapper
            const wrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-page-wrapper');

            // Page header area
            const pageHeaderArea = window.conversations.utils.createDivContainer(wrapper, 'conversations-page-header-area');

            // Page title box with emoji, title, and fields if provided
            if (this.emoji && this.title && this.fields) {
                this.renderPageTitleBox(pageHeaderArea);
            }

            // Page control area
            this.pageControlArea = window.conversations.utils.createDivContainer(pageHeaderArea, 'conversations-page-control-area');
            new window.SpinnerComponent(this.pageControlArea);

            // Page buttons area
            this.pageButtonsArea = window.conversations.utils.createDivContainer(pageHeaderArea, 'conversations-page-buttons-area');
            new window.SpinnerComponent(this.pageButtonsArea);

            // Page content area
            this.pageContentArea = window.conversations.utils.createDivContainer(wrapper, 'conversations-page-content-area');
            new window.SpinnerComponent(this.pageContentArea);
        }

        // Renders the page title box with emoji, title, and fields
        renderPageTitleBox(container) {
            // Page title box
            const pageTitleBox = window.conversations.utils.createDivContainer(container, 'conversation-page-header-title-box');

            // Emoji
            window.conversations.utils.createReadOnlyText(pageTitleBox, this.emoji, 'conversations-page-title-emoji');

            // Title info
            const infoDiv = window.conversations.utils.createDivContainer(pageTitleBox, 'conversations-page-title-info');

            // Title
            window.conversations.utils.createReadOnlyText(infoDiv, this.title, 'conversations-page-title-info-title');

            // Subtitle
            const metaDiv = window.conversations.utils.createDivContainer(infoDiv, 'conversations-page-title-info-subtitle');

            // Render fields into subtitle
            if (Array.isArray(this.fields)) {
                /* List of values: [ 'FieldValue', 'FieldValue2' ] */
                this.fields.forEach((fieldValue, index) => {
                    window.conversations.utils.createSpan(metaDiv, fieldValue, 'conversations-page-title-info-subtitle-meta');
                    if (index < this.fields.length - 1) {
                        window.conversations.utils.createSpan(metaDiv, '•', 'conversations-page-title-info-subtitle-meta');
                    }
                });
                return;
            } else if (typeof this.fields === 'object') {
                /* Key-value pairs: { 'FieldName': 'FieldValue', 'FieldName2': 'FieldValue2' } */
                const entries = Object.entries(this.fields);
                entries.forEach(([fieldName, fieldValue], index) => {
                    window.conversations.utils.createSpan(metaDiv, `${fieldName}:`, 'conversations-page-title-info-subtitle-meta');
                    window.conversations.utils.createSpan(metaDiv, fieldValue, 'conversations-page-title-info-subtitle-meta-bold');
                    if (index < entries.length - 1) {
                        window.conversations.utils.createSpan(metaDiv, '|', 'conversations-page-title-info-subtitle-meta');
                    }
                });
            } else {
                /* Simple string: 'FieldValue' */
                window.conversations.utils.createSpan(metaDiv, this.fields, 'conversations-page-title-info-subtitle-meta-bold');
            }

        }

        updateControlArea(newControlArea) {
            this.pageControlArea.innerHTML = '';
            if (newControlArea !== null) {
                this.pageControlArea.appendChild(newControlArea);
            }
        }

        updateButtonsArea(newButtonsArea) {
            this.pageButtonsArea.innerHTML = '';
            if (newButtonsArea !== null) {
                this.pageButtonsArea.appendChild(newButtonsArea);
            }
        }

        updateContentArea(newContentArea) {
            this.pageContentArea.innerHTML = '';
            if (newContentArea !== null) {
                this.pageContentArea.appendChild(newContentArea);
            }
        }
    }

    // Expose the component
    window.conversations = window.conversations || {};
    window.conversations.PageComponent = PageComponent;
})();