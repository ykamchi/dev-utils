/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.utils = window.conversations.utils || {};


// Create a label element
window.conversations.utils.createLabel = function (container, text, alignRight = false) {
    const label = document.createElement('label');
    label.className = 'conversations-instruction-field-label';
    label.textContent = text;
    if (alignRight) {
        label.style.textAlign = 'right';
    }
    container.appendChild(label);
    return label;
}


// Create a read-only text div
window.conversations.utils.createReadOnlyText = function (container, value, className = null, title = null) {
    const div = document.createElement('div');
    div.className = className || 'conversations-instruction-field-readonly';
    div.textContent = value;
    if (title) {
        div.title = title;
    }
    container.appendChild(div);
    return div;
}


// Create a text input element
window.conversations.utils.createNumberInput = function (container, value) {
    const input = document.createElement('input');
    input.className = 'conversations-instruction-field-input';
    input.type = 'number';
    input.value = value;
    container.appendChild(input);
    return input;
}


// Create a span element
window.conversations.utils.createSpan = function (container = null, value, className = null) {
    const span = document.createElement('span');
    span.className = className || '';
    span.textContent = value;
    container.appendChild(span);
    return span;
}


// Create a div container
window.conversations.utils.createDivContainer = function (container = null, className = null, title = null) {
    const div = document.createElement('div');
    div.className = className || 'conversations-scrollable-group';
    if (container) {
        container.appendChild(div);
    }
    if (title) {
        div.title = title;
    }
    return div;
}

window.conversations.utils.createFieldDiv = function (container, labelText) {
    const fieldDiv = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
    window.conversations.utils.createLabel(fieldDiv, labelText);
    return fieldDiv;   
}

window.conversations.utils.createField = function (container, labelText, value, readOnly = false) {
    const fieldDiv = window.conversations.utils.createFieldDiv(container, labelText);
    window.conversations.utils.createReadOnlyText(fieldDiv, value, readOnly ? null : 'conversations-field-value');
    return fieldDiv;
}

window.conversations.utils.createInput = function(container, labelText, options = {}) {
    const infoNameGroup = window.conversations.utils.createDivContainer(container, 'conversation-field-container-vertical');
    window.conversations.utils.createLabel(infoNameGroup, labelText);
    new window.TextInputComponent(infoNameGroup, options);
}

window.conversations.utils.createTextArea = function (container, labelText, value, placeholder = '', onChange = null, rows = -1) {
    const textAreaGroup = window.conversations.utils.createDivContainer(container, rows === -1 ? 'conversation-field-container-vertical-full' : 'conversation-field-container-vertical');
    window.conversations.utils.createLabel(textAreaGroup, labelText);
    new window.TextAreaComponent(textAreaGroup, value, placeholder, onChange, rows);
}

window.conversations.utils.createBadge = function (container, labelText, value, badgeType = 'generic') {
    const badgeDiv = window.conversations.utils.createFieldDiv(container, labelText);
    window.conversations.utils.createReadOnlyText(badgeDiv, value, 'conversations-badge-' + badgeType);
    return badgeDiv;
}

// Create a div that displays JSON content
window.conversations.utils.createJsonDiv = function (container, json) {
    const pre = document.createElement('pre');
    pre.className = 'conversations-json-div';
    pre.textContent = JSON.stringify(json, null, 2);
    container.appendChild(pre);
}


//TODO: move to ChartComponent?
window.conversations.utils.updateChartInstance = function (container, chartInstance, type, data, options = {}, title = null) {
    container.innerHTML = '';
    if (chartInstance && typeof chartInstance.destroy === 'function') {
        try { chartInstance.destroy(); } catch (e) { }
    }

    const field = window.conversations.utils.createFieldDiv(container, title);
    chartInstance = new window.ChartComponent(field, type, data, options, '100%', '320px',title);

    if (chartInstance && typeof chartInstance.refresh === 'function') {
        setTimeout(() => chartInstance.refresh(), 0);
    }

};

const getCssVar = (name, fallback = '') => {
    const v = getComputedStyle(document.body).getPropertyValue(name);
    return (v || fallback).trim();
};

const stateColor = (state) => {
    return getCssVar(`--color-state-${state}`, '');
};
