/*
    Constants for dev-tool-conversations
*/
window.conversations = window.conversations || {};
window.conversations.utils = window.conversations.utils || {};
window.conversations.utils.createLabel = function(container, text) {
    const label = document.createElement('label');
    label.className = 'conversations-instruction-field-label';
    label.textContent = text;
    container.appendChild(label);
    return label;
}

window.conversations.utils.createTextInput = function(container, id, value, placeholder = '', onChange = null) {
    return window.conversations.utils.createPatternTextInput(container, id, value, /.*/, placeholder, onChange);
}

window.conversations.utils.createPatternTextInput = function(container, id, value, pattern = /.*/, placeholder = '', onChange = null) {
    const textInputComponent = new window.TextInputComponent(
        container,
        value,
        pattern,
        placeholder,
        onChange
    );
    
    // Set the id on the component's container
    textInputComponent.container.id = id;
    
    // Add convenience methods to the container for easy access
    textInputComponent.container.getValue = () => textInputComponent.getValue();
    textInputComponent.container.setValue = (val) => textInputComponent.setValue(val);
    textInputComponent.container.isValid = () => textInputComponent.isValid();
    
    return textInputComponent.container;
}

window.conversations.utils.createTextArea = function(container, id, value, rows = -1) {
    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.value = value;
    if (rows > 0) {
        textarea.className = 'conversations-instruction-field-textarea';
        textarea.rows = rows;
    } else {
        textarea.className = 'conversations-instruction-field-textarea conversations-instruction-field-textarea-large';
    }
    container.appendChild(textarea);
    return textarea;
}

window.conversations.utils.createReadOnlyText = function(container, id, value, className = null) {
    const div = document.createElement('div');
    div.className = className || 'conversations-instruction-field-readonly';
    div.id = id;
    div.textContent = value;
    container.appendChild(div);
    return div;
}

window.conversations.utils.createNumberInput = function(container, id, value) {
    const input = document.createElement('input');
    input.className = 'conversations-instruction-field-input';
    input.id = id;
    input.type = 'number';
    input.value = value;
    container.appendChild(input);
    return input;
}

window.conversations.utils.create

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

window.conversations.utils.createDivContainer = function(container = null, id = null, className = null) {
    const div = document.createElement('div');
    if (id) {
        div.id = id;
    }
    div.className = className || 'conversations-instruction-scrollable-group';
    if (container) {
        container.appendChild(div);
    }
    return div;
}

window.conversations.utils.createJsonDiv = function(container, json) {
    const pre = document.createElement('pre');
    pre.className = 'conversations-json-div';
    pre.textContent = JSON.stringify(json, null, 2);
    container.appendChild(pre);
}
