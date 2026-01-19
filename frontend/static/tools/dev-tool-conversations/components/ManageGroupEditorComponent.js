(function () {
    /*
        ManageInstructionsEditorComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageGroupEditorComponent {
        constructor(container, groupName, groupDescription) {
            this.container = container;
            this.groupName = groupName;
            this.groupDescription = groupDescription;
            this.groupDescriptionInput = null;
            this.render();
        }

        render() {
            // Edit group section (for Properties tab)
            const editGroupDiv = window.conversations.utils.createDivContainer(this.container);

            // Group Name 
            const nameGroup = window.conversations.utils.createDivContainer(editGroupDiv, null, 'conversation-container-vertical');
            window.conversations.utils.createLabel(nameGroup, 'Group Name:');
            this.groupNameInput = new window.TextInputComponent(nameGroup, this.groupName, /.*/, 'Enter group name', (value) => {
                this.groupName = value;
            });

            // Group Description
            const descriptionGroup = window.conversations.utils.createDivContainer(editGroupDiv);
            window.conversations.utils.createLabel(descriptionGroup, 'Description:');
            this.groupDescriptionInput = new window.TextAreaComponent(descriptionGroup, this.groupDescription, 'Enter group description', (value) => {
                this.groupDescription = value;
            });
        }

        updatedGroup() {
            const updatedGroup = {
                groupName: this.groupNameInput.getValue(),
                groupDescription: this.groupDescriptionInput.getValue()
            };
            return updatedGroup;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageGroupEditorComponent = ManageGroupEditorComponent;
})();
