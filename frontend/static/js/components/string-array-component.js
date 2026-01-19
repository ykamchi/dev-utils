/*
    StringArrayComponent: A component for editing an array of strings
    - Displays a list of string values with delete buttons
    - Provides an input field to add new values
    - Supports getting the current array of strings
*/
class StringArrayComponent {
    constructor(container, initialValues = [], placeholder = 'Add new value...', onChange = null,style = StringArrayComponent.STYLE_COLUMN) {
        this.container = container;
        this.values = [...initialValues]; // Create a copy of the array
        this.placeholder = placeholder;
        this.onChange = onChange;
        this.style = style;
        this.stylesMap = {
            [StringArrayComponent.STYLE_WRAP]: 'string-array-list-wrap',
            [StringArrayComponent.STYLE_COLUMN]: 'string-array-list-column',
        };
        this.render();
    }

    render() {
        // this.container.innerHTML = '';
        this.container.className = 'string-array-component';

        // Create list container for existing values
        const listContainer = document.createElement('div');
        listContainer.id = 'string-array-list';
        listContainer.className = this.stylesMap[this.style];
        this.container.appendChild(listContainer);

        // Render each value
        this.values.forEach((value, index) => {
            this.renderValue(listContainer, value, index);
        });

        // Render the add input as the last item in the list
        this.renderAddInput(listContainer);
    }

    renderAddInput(listContainer) {
        // Create input item that looks like other list items
        const itemDiv = document.createElement('div');
        itemDiv.className = 'string-array-item string-array-item-input';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'string-array-input';
        input.placeholder = this.placeholder;
        itemDiv.appendChild(input);

        const addButton = document.createElement('button');
        addButton.className = 'string-array-add-button';
        addButton.textContent = '+';
        addButton.addEventListener('click', () => {
            const newValue = input.value.trim();
            if (newValue) {
                this.addValue(newValue);
                input.value = '';
                input.focus();
            }
        });
        itemDiv.appendChild(addButton);

        // Allow pressing Enter to add value
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addButton.click();
            }
        });

        listContainer.appendChild(itemDiv);
    }

    renderValue(listContainer, value, index) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'string-array-item';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'string-array-value';
        valueSpan.textContent = value;
        itemDiv.appendChild(valueSpan);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'string-array-delete-button';
        deleteButton.textContent = '×';
        deleteButton.addEventListener('click', () => {
            this.removeValue(index);
        });
        itemDiv.appendChild(deleteButton);

        listContainer.appendChild(itemDiv);
    }


    addValue(value) {
        this.values.push(value);
        // Re-render the entire list to maintain the add input at the end
        const listContainer = this.container.querySelector('#string-array-list');
        if (listContainer) {
            listContainer.innerHTML = '';
            this.values.forEach((val, idx) => {
                this.renderValue(listContainer, val, idx);
            });
            this.renderAddInput(listContainer);
        }
        if (this.onChange) {
            this.onChange(this.getValues());
        }
    }

    removeValue(index) {
        this.values.splice(index, 1);
        // Re-render the entire list
        const listContainer = this.container.querySelector('#string-array-list');
        if (listContainer) {
            listContainer.innerHTML = '';
            this.values.forEach((value, idx) => {
                this.renderValue(listContainer, value, idx);
            });
            this.renderAddInput(listContainer);
        }
        if (this.onChange) {
            this.onChange(this.getValues());
        }
    }

    getValues() {
        return [...this.values]; // Return a copy of the array
    }

    // setValues(newValues) {
    //     this.values = [...newValues];
    //     this.render();
    // }
}

window.StringArrayComponent = StringArrayComponent;


// Static text position constants for encapsulation and external usage
StringArrayComponent.STYLE_WRAP = 'wrap';
StringArrayComponent.STYLE_COLUMN = 'column';
