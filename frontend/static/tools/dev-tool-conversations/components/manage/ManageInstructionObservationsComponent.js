(function () {
    /*
        ManageInstructionObservationsComponent: handles editing a single instruction with Info, Instructions, and Feedback tabs
    */
    class ManageInstructionObservationsComponent {
        constructor(container, group, instruction_id, observations, onChange, onObservationsAdded, onObservationsDeleted) {
            this.container = container;
            this.group = group;
            this.instruction_id = instruction_id;
            this.observations = observations || [];

            this.onChange = onChange;
            this.onObservationsAdded = onObservationsAdded;
            this.onObservationsDeleted = onObservationsDeleted;
            this.outputContainer = null;

            this.render();
        }

        render() {
            this.observationsContainer = window.conversations.utils.createDivContainer(this.container, 'conversation-container-vertical', { 'overflow': 'visible' });
            this.loadContent();
        }

        loadContent() {
            this.observationsContainer.innerHTML = '';

            // Create tabset for observations, with an additional tab for adding a new observation
            const observationsFieldDiv = window.conversations.utils.createFieldDiv(this.observationsContainer, 'Observations:', { 'overflow': 'visible' });

            const tabsetDiv = window.conversations.utils.createDivContainer(observationsFieldDiv, 'conversation-container-vertical', { 'overflow': 'visible' });

            // Add tabs for each observation in the instruction, plus an additional tab for adding a new observation
            const observationsTabs = [];
            console.log('Loading observations into ManageInstructionObservationsComponent:', this.observations);
            this.observations.forEach(observation => {
                observationsTabs.push({ name: observation.name, populateFunc: (c) => this.populateObservationTab(c, observation) });
            });
            observationsTabs.push({ name: '+ Add observation', populateFunc: (c) => this.populateAddObservationTab(c) });
            new window.TabsetComponent(tabsetDiv, observationsTabs, `conversations-instruction-editor-${this.group.group_id}`, null, true);
        }

        handleDeleteObservation(observation) {
            new window.AlertComponent('Delete Observation', `Are you sure you want to delete the observation "${observation.observation_name}"?`, [
                ['Confirm Delete', async () => {
                    this.observations = this.observations.filter(o => o !== observation);
                    this.onObservationsDeleted(this.observations);
                    this.render();
                }],
                ['Cancel', () => { }]
            ]);
        }

        populateAddObservationTab(container) {
            const wrapperConvy = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');

            const headerAreaConvy = window.conversations.utils.createDivContainer(wrapperConvy, 'conversations-page-header-area');
            
            // Page title box
            const pageTitleBoxConvy = window.conversations.utils.createDivContainer(headerAreaConvy, 'conversation-page-header-title-box');

            // Emoji
            new window.conversations.ConvyComponent(pageTitleBoxConvy, { reaction: 'happy', height: 92, width: 92 });

            // Title info
            const infoDivConvy = window.conversations.utils.createDivContainer(pageTitleBoxConvy, 'conversations-page-title-info');

            // Title
            window.conversations.utils.createReadOnlyText(infoDivConvy, 'Auto create observations', 'conversations-page-title-info-title');

            // Subtitle
            const metaDivConvy = window.conversations.utils.createDivContainer(infoDivConvy, 'conversations-page-title-info-subtitle');

            window.conversations.utils.createSpan(metaDivConvy, 'Let Convy create the observations for you', 'conversations-page-title-info-subtitle-meta');


            const buttonContainer = window.conversations.utils.createDivContainer(headerAreaConvy, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '✅ Auto create observations',
                onClick: async () => {
                    const suggestedObservations = await window.conversations.apiInstructions.instructionsSuggestObservations(wrapperConvy, this.instruction_id);
                    console.log('Suggested observations from API:', suggestedObservations);
                    this.observations.push(...suggestedObservations.suggested_observations);
                    this.onObservationsAdded(this.observations);
                    this.loadContent(); // Reload to show the new observation tab
                },
                type: window.ButtonComponent.TYPE_GHOST
            });

            const wrapperAdd = window.conversations.utils.createDivContainer(container, 'conversations-page-wrapper');
            const headerAreaAdd = window.conversations.utils.createDivContainer(wrapperAdd, 'conversations-page-header-area');
            
            // Page title box
            const pageTitleBoxAdd = window.conversations.utils.createDivContainer(headerAreaAdd, 'conversation-page-header-title-box');

            // Emoji
            new window.conversations.ConvyComponent(pageTitleBoxAdd, { reaction: 'base', height: 92, width: 92 });

            // Title info
            const infoDivAdd = window.conversations.utils.createDivContainer(pageTitleBoxAdd, 'conversations-page-title-info');

            // Title
            window.conversations.utils.createReadOnlyText(infoDivAdd, 'Manually create observations', 'conversations-page-title-info-title');

            // Subtitle
            const metaDivAdd = window.conversations.utils.createDivContainer(infoDivAdd, 'conversations-page-title-info-subtitle');

            window.conversations.utils.createSpan(metaDivAdd, 'Add observation and manually edit it', 'conversations-page-title-info-subtitle-meta');


            const buttonContainerAdd = window.conversations.utils.createDivContainer(headerAreaAdd, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainerAdd, {
                label: '✅ Add New Observation',
                onClick: () => {
                    // Create a new observation with default values and add it to the list
                    const newObservation = {
                        name: `observation_${this.observations.length + 1}`,
                        type: 'outcome_observation',
                        goal: '',
                        output: [
                            {
                                output_name: 'positive_evidence',
                                output_description: 'Strong positive signals that surfaced in the conversation.',
                                output_type: 'signal_score_evidence_list'
                            },
                            {
                                output_name: 'concerns',
                                output_description: 'Important concerns or risks that surfaced in the conversation.',
                                output_type: 'signal_score_evidence_list'
                            },
                            {
                                output_name: 'unknowns',
                                output_description: 'Important missing evidence or unresolved areas.',
                                output_type: 'signal_score_evidence_list'
                            },
                            {
                                output_name: 'summary',
                                output_description: 'Short overall observation summary.',
                                output_type: 'string'
                            }
                        ]
                    };
                    this.observations.push(newObservation);
                    this.onObservationsAdded(this.observations);
                    this.loadContent(); // Reload to show the new observation tab
                },
                type: window.ButtonComponent.TYPE_GHOST
            });

        }

        populateObservationTab(container, observation) {
            // Vertical wrapper for the whole observation tab content
            const verticalWrapper = window.conversations.utils.createDivContainer(container, 'conversation-container-vertical');

            // Add buttons container
            const buttonContainer = window.conversations.utils.createDivContainer(verticalWrapper, 'conversations-buttons-container');
            new window.ButtonComponent(buttonContainer, {
                label: '🗙 Delete Observation',
                onClick: () => this.handleDeleteObservation(observation),
                type: window.ButtonComponent.TYPE_GHOST_DANGER,
                tooltip: '🗙 Delete observation'
            });

            const splitter = window.conversations.utils.createDivContainer(verticalWrapper, 'conversation-container-horizontal-space-between-full');
            const splitterLeft = window.conversations.utils.createDivContainer(splitter, '-');
            const splitterRight = window.conversations.utils.createDivContainer(splitter, '-', { 'flex': 1 });

            // Observation function name (editable)
            window.conversations.utils.createInput(splitterLeft, 'Observation Name:', {
                initialValue: observation.name,
                // pattern: /^[a-zA-Z_]+$/,
                placeholder: 'e.g., Case Summary',
                onChange: (value) => {
                    observation.name = value;
                    this.onChange(this.observations);
                }
            });

            const observationTypeContainer = window.conversations.utils.createDivContainer(splitterLeft, 'conversation-field-container-vertical');
            window.conversations.utils.createLabel(observationTypeContainer, 'Observation Type:');
            const outputTypeSelectContainer = window.conversations.utils.createDivContainer(observationTypeContainer);
            new window.SelectComponent(
                outputTypeSelectContainer,
                {
                    options: [
                        { label: 'Outcome Observation', value: 'outcome_observation' },
                        { label: 'Conversation Quality', value: 'conversation_quality' }
                    ],
                    onSelection: (value) => {
                        observation.type = value;
                        // Clear other type-specific properties
                        this.onChange(this.observations);
                    },
                    placeholder: 'Select type ...',
                    value: observation.type
                }
            );

            // Observation goal (editable)
            window.conversations.utils.createTextArea(splitterRight, 'Observation Goal:', {
                initialValue: observation.goal,
                placeholder: 'Observation goal, i.e., Describe what this observation is trying to achieve in this conversation.',
                onChange: (value) => {
                    observation.goal = value;
                    this.onChange(this.observations);
                },
                rows: 5
            });

            const outputContainer = window.conversations.utils.createDivContainer(verticalWrapper, 'conversation-container-vertical');
            this.outputContainer = window.conversations.utils.createDivContainer(outputContainer, 'conversation-field-container-vertical-full');
            this.populateOutputEditor(observation);

        }

        // Populate Output tab
        populateOutputEditor(observation) {
            // Clear existing content - populateOutputEditor may be called multiple times
            this.outputContainer.innerHTML = '';
            window.conversations.utils.createLabel(this.outputContainer, 'Output Definitions:');
            const wrapper = window.conversations.utils.createDivContainer(this.outputContainer, 'conversation-container-vertical');
            if (observation.output.length === 0) {
                window.conversations.utils.createReadOnlyText(wrapper, 'No feedback definitions found.', 'conversations-message-empty');
                return;
            }

            // splitterRight
            new window.ListComponent(wrapper, observation.output,
                (output) => {
                    const outputDiv = document.createElement('div');
                    const buttonContainer = window.conversations.utils.createDivContainer(outputDiv, 'conversations-buttons-container-left');
                   
                    // Add delete button
                    new window.ButtonComponent(buttonContainer, {
                        label: '🗙',
                        onClick: () => {
                            observation.output = observation.output.filter(o => o.output_name !== output.output_name);
                            this.populateOutputEditor(observation);
                            this.onChange(this.observations);
                        },
                        type: window.ButtonComponent.TYPE_GHOST_DANGER,
                        tooltip: '🗙 Delete output ' + output.output_name
                    });

                    const splitter = window.conversations.utils.createDivContainer(outputDiv, 'conversation-container-horizontal-space-between-full');
                    const splitterLeft = window.conversations.utils.createDivContainer(splitter, '-');
                    const splitterRight = window.conversations.utils.createDivContainer(splitter, '-', { 'flex': 1 });

                    window.conversations.utils.createInput(splitterLeft, 'Output Name:', {
                        initialValue: output.output_name,
                        placeholder: 'e.g., positive_evidence',
                        onChange: (value) => {
                            output.output_name = value;
                            this.onChange(this.observations);
                        }
                    });
                    
                    const outputTypeContainer = window.conversations.utils.createDivContainer(splitterLeft, 'conversation-field-container-vertical');
                    window.conversations.utils.createLabel(outputTypeContainer, 'Type:');
                    const outputTypeSelectContainer = window.conversations.utils.createDivContainer(outputTypeContainer);
                    new window.SelectComponent(
                        outputTypeSelectContainer,
                        {
                            options: [
                                { label: 'Signal Score Evidence List', value: 'signal_score_evidence_list' },
                                { label: 'Trajectory Evidence List', value: 'trajectory_evidence_list' },
                                { label: 'Summary', value: 'summary' },
                                { label: 'Label', value: 'label' },
                            ],
                            onSelection: (value) => {
                                output.output_type = value;
                                // Clear other type-specific properties
                                this.onChange(this.observations);
                            },
                            placeholder: 'Select type ...',
                            value: output.output_type
                        }
                    );

                    window.conversations.utils.createTextArea(splitterRight, 'Output Description:', {
                        initialValue: output.output_description,
                        placeholder: 'Description of the observation output.',
                        onChange: (value) => {
                            output.output_description = value;
                            this.onChange(this.observations);
                        },
                        rows: 5
                    });
                    return outputDiv;
                }
            );

            // Add buttons container
            const outputButtonContainer = window.conversations.utils.createDivContainer(this.outputContainer, 'conversations-buttons-container');
            
            new window.ButtonComponent(outputButtonContainer, {
                label: '+ Add output field',
                onClick: () => this.handleAddOutput(observation),
                type: window.ButtonComponent.TYPE_GHOST
            });

        }

        // Handle adding a new output definition
        handleAddOutput(observation) {
            let nextIndex = 1;
            while (observation.output.find(od => od.output_name === `output_${nextIndex}`)) {
                nextIndex++;
            }
            observation.output.push({
                output_name: `output_${nextIndex}`,
                output_description: 'Description of the output field',
                output_type: 'summary'
            });
            this.populateOutputEditor(observation);
            this.onChange(this.observations);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.ManageInstructionObservationsComponent = ManageInstructionObservationsComponent;
})();
