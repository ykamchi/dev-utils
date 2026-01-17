(function () {
    /*
        ManageInstructionsEditorComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageGroupEditorComponent {
        constructor(container, groupName, groupDescription) {
            this.container = container;
            this.groupName = groupName;
            this.groupDescription = groupDescription;
            this.render();
        }

        render() {
            // this.container.innerHTML = '';

            // Edit group section (for Properties tab)
            const editGroupDiv = window.conversations.utils.createDivContainer(this.container, null, 'conversations-instruction-editor-tab');

            // Group Name 
            const nameGroup = window.conversations.utils.createDivContainer(editGroupDiv, 'conversations-instruction-scrollable-group');
            window.conversations.utils.createLabel(nameGroup, 'Group Name:');
            window.conversations.utils.createPatternTextInput(nameGroup, 'conversations-instruction-name-input', this.groupName);
            
            // Group Description
            const descriptionGroup = window.conversations.utils.createDivContainer(editGroupDiv, 'conversations-instruction-scrollable-group');
            window.conversations.utils.createLabel(descriptionGroup, 'Description:');
            window.conversations.utils.createTextArea(descriptionGroup, 'conversations-instruction-description-input', this.groupDescription);
        }

        updatedGroup() {
            const updatedGroup = {
                groupName: this.container.querySelector('#conversations-instruction-name-input').getValue(),
                groupDescription: this.container.querySelector('#conversations-instruction-description-input').value
            };
            return updatedGroup;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupEditorComponent = ManageGroupEditorComponent;
})();
