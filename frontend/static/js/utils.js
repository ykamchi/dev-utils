// Utils Module
// General utility functions for the Dev Tools App

const Utils = {
    /**
     * Formats a date string as YYYY-MM-DD HH:mm:ss
     */
    formatDateTime(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    },
    /**
     * Dynamically load a script if a global is not present
     * @param {string} url - The script URL
     * @param {string} globalName - The global variable to check (e.g. 'ConversationDetailsComponent')
     * @returns {Promise<void>} Resolves when loaded
     */
    async loadScriptIfNeeded(url, globalName) {
        if (window[globalName]) return;
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => {
                if (window[globalName]) {
                    resolve();
                } else {
                    console.warn(`Script '${url}' loaded, but global object '${globalName}' was not found.`);
                    resolve();
                }
            };
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    },
    // API utilities
    async fetchJSON(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}