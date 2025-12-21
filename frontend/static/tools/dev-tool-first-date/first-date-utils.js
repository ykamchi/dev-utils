// Get a color code for confidence level: 'low', 'medium', 'high'
function getConfidenceColor(level) {
    if (level === 'high') return '#2ecc40'; // green
    if (level === 'medium') return '#ffb400'; // orange
    if (level === 'low') return '#ff4136'; // red
    return '#888';
}
// first-date-utils.js
// Utility functions for dev-tool-first-date

// Get a color code based on a rating from 1 to 10
function getRateColor(rate) {
    rate = Math.max(1, Math.min(10, rate));
    let r, g, b = 0;
    if (rate <= 5) {
        r = 255;
        g = Math.round((rate - 1) * (128 / 4));
    } else {
        r = Math.round(255 - ((rate - 5) * (255 / 5)));
        g = Math.round(128 + ((rate - 5) * (127 / 5)));
    }
    const toHex = x => x.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
