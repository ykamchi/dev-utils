/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.utils = window.conversations.utils || {};


// Create a label element
window.conversations.utils.createLabel = function(container, text, alignRight = false) {
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
window.conversations.utils.createReadOnlyText = function(container, id, value, className = null, title = null) {
    const div = document.createElement('div');
    div.className = className || 'conversations-instruction-field-readonly';
    div.id = id;
    div.textContent = value;
    if (title) {
        div.title = title;
    }
    container.appendChild(div);
    return div;
}


// Create a text input element
window.conversations.utils.createNumberInput = function(container, id, value) {
    const input = document.createElement('input');
    input.className = 'conversations-instruction-field-input';
    input.id = id;
    input.type = 'number';
    input.value = value;
    container.appendChild(input);
    return input;
}


// Create a span element
window.conversations.utils.createSpan = function(container = null, id = null, value, className = null) {
    const span = document.createElement('span');
    if (id) {
        span.id = id;
    }
    span.className = className || '';
    span.textContent = value;
    container.appendChild(span);
    return span;
}


// Create a div container
window.conversations.utils.createDivContainer = function(container = null, id = null, className = null, title = null) {
    const div = document.createElement('div');
    if (id) {
        div.id = id;
    }
    div.className = className || 'conversations-scrollable-group';
    if (container) {
        container.appendChild(div);
    }
    if (title) {
        div.title = title;
    }
    return div;
}


// Create a div that displays JSON content
window.conversations.utils.createJsonDiv = function(container, json) {
    const pre = document.createElement('pre');
    pre.className = 'conversations-json-div';
    pre.textContent = JSON.stringify(json, null, 2);
    container.appendChild(pre);
}
