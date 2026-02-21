(function () {
    /*
        AlertApiErrorComponent: Displays structured API error responses using PopupComponent
        Expects error response format:
        {
            success: false,
            api_name: string,
            message: string,
            error: string,
            exception?: string,
            request_params?: object
        }
    */
    class AlertApiErrorComponent {
        /**
         * @param {Object} errorResponse - Structured error response from API
         */
        constructor(errorResponse) {
            this.errorResponse = errorResponse;
            this.render();
        }

        render() {
            // Create wrapper for popup content
            const wrapper = window.conversations.utils.createDivContainer(null, 'conversations-page-wrapper');
            
            // Variable to hold popup reference for close button
            let popup = null;
            
            // Add close button at the top
            const buttonContainer = window.conversations.utils.createDivContainer(wrapper, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '🏃 Close',
                type: window.ButtonComponent.TYPE_GHOST,
                onClick: () => {
                    if (popup) {
                        popup.hide();
                    }
                }
            });
            
            // Create content container
            const container = window.conversations.utils.createDivContainer(wrapper, 'conversation-container-vertical');

            // 1. API Name
            if (this.errorResponse.api_name) {
                window.conversations.utils.createField(container, 'API:', this.errorResponse.api_name, true);
            }

            // 2. Request parameters
            if (this.errorResponse.request_params) {
                const paramsField = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
                window.conversations.utils.createLabel(paramsField, 'Request Parameters:');
                
                // Parse request_params if it's a string
                let params = this.errorResponse.request_params;
                if (typeof params === 'string') {
                    try {
                        params = JSON.parse(params);
                    } catch (e) {
                        // If parsing fails, keep it as string
                        console.warn('Failed to parse request_params as JSON:', e);
                    }
                }
                
                window.conversations.utils.createJsonDiv(paramsField, params);
            }

            // 3. Error
            if (this.errorResponse.error) {
                window.conversations.utils.createField(container, 'Error:', this.errorResponse.error, true);
            }

            // 4. Details (expandable with message and exception)
            if (this.errorResponse.message || this.errorResponse.exception) {
                // Header: "Details"
                const headerContent = window.conversations.utils.createDivContainer(null, 'conversation-container-horizontal');
                window.conversations.utils.createReadOnlyText(headerContent, 'Details', 'conversations-instruction-field-label');

                // Body: Message and Exception
                const bodyContent = window.conversations.utils.createDivContainer(null, 'conversation-container-vertical');
                bodyContent.style.maxHeight = '200px';
                bodyContent.style.overflow = 'auto';
                
                if (this.errorResponse.message) {
                    window.conversations.utils.createField(bodyContent, 'Message:', this.errorResponse.message, true);
                }
                
                if (this.errorResponse.exception) {
                    window.conversations.utils.createField(bodyContent, 'Exception:', this.errorResponse.exception, true);
                }

                // Create expandable div
                const expandDiv = window.conversations.utils.createDivContainer(container);
                new window.ExpandDivComponent(expandDiv, headerContent, bodyContent, false);
            }

            // Show popup with error icon and title
            popup = new window.PopupComponent({
                icon: '⚠️',
                title: 'API Failed',
                width: 800,
                height: 'auto',
                content: wrapper,
                closable: true,
                overlay: true,
                closeOnOutsideClick: true
            });
            popup.show();
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.AlertApiErrorComponent = AlertApiErrorComponent;
})();
