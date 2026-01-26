(function () {

    // All option value
    const ALL_VALUE = 'all';

    // Measures (single mode now)
    const MEASURE_FIELDS = {
        'total_conversations': {
            type: 'summary',
            label: 'Total conversation',
            field: 'total_conversations'
        },
        'total_messages': {
            type: 'summary',
            label: 'Total msgs',
            field: 'total_messages'
        },
        'avg_messages': {
            type: 'summary',
            label: 'Avg msgs',
            field: 'avg_messages'
        },
        'avg_duration_seconds': {
            type: 'summary',
            label: 'Avg duration',
            field: 'avg_duration_seconds'
        },
        'avg_participants': {
            type: 'summary',
            label: 'Avg participants',
            field: 'avg_participants'
        },
        'conversations_by_state': {
            type: 'conversations_by_state',
            label: 'Total conversation by state',
        },
        'conversation_types_by_state': {
            type: 'conversation_types_by_state',
            label: 'Conversation types by state',
        }
    }

    const CONVERSATION_TYPES = [
        { label: 'All types', value: ALL_VALUE },
        { label: 'AI Conversation', value: 'ai_conversation' },
        { label: 'AI Decision', value: 'ai_decision' }
    ];

    const STATES = [
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' }
    ];
    const STATE_VALUES = STATES.map(s => s.value);

    const INTERVALS = [
        { label: 'Hour', value: 'hour' },
        { label: 'Day', value: 'day' },
        { label: 'Week', value: 'week' },
        { label: 'All', value: ALL_VALUE }
    ];

    class ChartStatusTimelineComponent {
        constructor(container) {
            this.container = container;
            this.chartInstance = null;
            this.cacheInstructionsByGroup = {};

            this.state = {
                group_name: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_group_name') || ALL_VALUE,
                conversation_type: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_conversation_type') || ALL_VALUE,
                instruction_type: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_instruction_type') || ALL_VALUE,
                states: window.StorageService.getStorageJSON('conversations_chart_status_timeline_states') || STATE_VALUES,
                hours_back: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_hours_back') || 24,
                interval: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_interval') || 'hour',
                measure_field: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_measure_field') || 'total_conversations'
            };

            this.instructionTypeControlDiv = null;
            this.charWrapper = null;

            this.render();
        }

        render() {
            this.loadContent();
        }

        async loadContent() {
            // Timeline container - holds the filters and the chart side by side
            const timelineWrapperDiv = window.conversations.utils.createDivContainer(this.container, 'conversation-container-horizontal');

            // Filter area
            const filterAreaDiv = window.conversations.utils.createDivContainer(timelineWrapperDiv, '-');
            this.renderFilters(filterAreaDiv);

            // Chart area
            const chartAreaDiv = window.conversations.utils.createDivContainer(timelineWrapperDiv);

            // Chart area divided into top area, chart area and bottom areas
            const chartTopAreaDiv = window.conversations.utils.createDivContainer(chartAreaDiv, '-');
            this.charWrapper = window.conversations.utils.createDivContainer(chartAreaDiv, '-');
            const chartBottomAreaDiv = window.conversations.utils.createDivContainer(chartAreaDiv, '-');

            // Chart top area - Measure div
            const measuredDiv =window.conversations.utils.createFieldDiv(chartTopAreaDiv, 'Measure:');
            const measureControlDiv = window.conversations.utils.createDivContainer(measuredDiv);

            // Chart bottom area - Interval div
            const intervalDiv = window.conversations.utils.createFieldDiv(chartBottomAreaDiv, 'Interval:');
            const intervalControlDiv = window.conversations.utils.createDivContainer(intervalDiv);


            // Measure select
            this.renderMeasureSelect(measureControlDiv);

            // Interval options
            this.renderIntervalOptions(intervalControlDiv);

            // Initial chart render
            this.renderChart();
        }

        async renderFilters(container) {
            // Filter area - Group name div 
            const groupNameDiv = window.conversations.utils.createFieldDiv(container, 'Group:');
            const groupNameSelectDiv = window.conversations.utils.createDivContainer(groupNameDiv);

            // Filter area - Conversation type div
            const conversationTypeDiv = window.conversations.utils.createFieldDiv(container, 'Type:');
            const conversationTypeSelectDiv = window.conversations.utils.createDivContainer(conversationTypeDiv);

            // Filter area - Instruction div
            const instructionTypeDiv = window.conversations.utils.createFieldDiv(container, 'Instruction:');
            this.instructionTypeControlDiv = window.conversations.utils.createDivContainer(instructionTypeDiv);

            // Filter area - States div
            const statesDiv = window.conversations.utils.createFieldDiv(container, 'States:');
            const statesControlDiv = window.conversations.utils.createDivContainer(statesDiv);

            // Filter area - Hours back div
            const hoursBackDiv = window.conversations.utils.createFieldDiv(container, 'Hours back:');
            const hoursBackControlDiv = window.conversations.utils.createDivContainer(hoursBackDiv);

            // Group select
            await this.renderGroupNameSelect(groupNameSelectDiv);

            // Conversation type select
            await this.renderConversationTypeSelect(conversationTypeSelectDiv);

            // Instruction type select
            this.renderInstructionSelect();

            // States options
            this.renderStatesOptions(statesControlDiv);

            // Hours back options
            this.renderHoursBackOptions(hoursBackControlDiv);
        }

        async renderGroupNameSelect(groupNameSelectDiv) {
            // Group name select
            const groups = await window.conversations.api.fetchGroups(groupNameSelectDiv);
            const groupOptions = groups.map(g => ({ label: g.group_name, value: g.group_name }));
            new window.SelectComponent(
                groupNameSelectDiv,
                [{ label: 'All Groups', value: ALL_VALUE }].concat(groupOptions),
                async (v) => {
                    this.state.group_name = v;
                    this.state.instruction_type = ALL_VALUE;
                    await this.renderInstructionSelect();
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_group_name', v);
                },
                'Select Group ...',
                this.state.group_name
            );
        }

        async renderConversationTypeSelect(conversationTypeDiv) {
            // Conversation type select
            new window.SelectComponent(
                conversationTypeDiv,
                CONVERSATION_TYPES,
                async (v) => {
                    this.state.conversation_type = v;
                    this.state.instruction_type = ALL_VALUE;
                    await this.renderInstructionSelect();
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_conversation_type', v);
                },
                'Select Type ...',
                this.state.conversation_type
            );
        }

        async renderInstructionSelect() {
            // Instruction type select - called when group or conversation type changes
            this.instructionTypeControlDiv.innerHTML = '';

            if (this.state.group_name === ALL_VALUE) {
                new window.SelectComponent(this.instructionTypeControlDiv, [{ label: 'Select a group first', value: ALL_VALUE }], null, 'Select Instruction ...', ALL_VALUE, true);

            } else {
                // Fetch instructions for the selected group (with caching)
                let instructionsResp = this.cacheInstructionsByGroup[this.state.group_name];
                if (!instructionsResp) {
                    instructionsResp = await window.conversations.api.fetchGroupInstructions(this.instructionTypeControlDiv, this.state.group_name);
                    this.cacheInstructionsByGroup[this.state.group_name] = instructionsResp;
                }

                const options = [{ label: 'All instructions', value: ALL_VALUE }].
                    concat(instructionsResp.
                        filter(instruction => instruction.info.conversation_type === this.state.conversation_type).
                        map(instruction => ({ label: instruction.info.name, value: instruction.info.type }))
                    );

                new window.SelectComponent(
                    this.instructionTypeControlDiv,
                    options,
                    (v) => {
                        this.state.instruction_type = v;
                        this.renderChart();
                        window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_instruction_type', v);
                    },
                    'Select Instruction ...',
                    this.state.instruction_type
                );
            }
        };

        renderStatesOptions(statesDiv) {
            // States options
            new window.OptionButtonsComponent(
                statesDiv,
                STATES,
                this.state.states,
                (v) => {
                    this.state.states = v;
                    console.log('Selected states:', v);
                    this.renderChart();
                    window.StorageService.setStorageJSON('conversations_chart_status_timeline_states', v);
                },
                null,
                true
            );
        }

        renderHoursBackOptions(hoursBackControlDiv) {
            // Hours back options
            // TODO: currently it uses a range component, but need to revisit
            new window.RangeComponent(
                hoursBackControlDiv,
                1,
                this.state.hours_back,
                (v) => {
                    console.log('Hours back selected:', v.max);
                    this.state.hours_back = v.max;
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_hours_back', v.max);
                }
            );

        }

        renderMeasureSelect(measureControlDiv) {
            // Measure select
            new window.SelectComponent(
                measureControlDiv,
                Object.entries(MEASURE_FIELDS).map(([key, mf]) => ({ label: mf.label, value: key })),
                (v) => {
                    this.state.measure_field = v;
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_measure_field', v);
                },
                'Select Measure ...',
                this.state.measure_field
            );

        }

        renderIntervalOptions(intervalControlDiv) {
            // Interval options
            new window.OptionButtonsComponent(
                intervalControlDiv,
                INTERVALS,
                this.state.interval,
                (v) => {
                    this.state.interval = v;
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_interval', this.state.interval);
                },
            );

        }

        async renderChart() {
            // Fetch data from API
            const allStatesSelected = STATE_VALUES.every(v => this.state.states.includes(v));

            const timelineResponseData = await window.conversations.system_api.fetchStatusConversationTimeline(
                this.charWrapper,
                this.state.hours_back,
                this.state.interval,
                this.state.group_name !== ALL_VALUE ? this.state.group_name : null,
                this.state.conversation_type !== ALL_VALUE ? this.state.conversation_type : null,
                this.state.instruction_type !== ALL_VALUE ? this.state.instruction_type : null,
                !allStatesSelected ? this.state.states : null
            );

            // Build chart data and options
            const barData = this.buildBarData(timelineResponseData);
            const barOptions = this.buildBarOptions();

            // Create or update chart instance and render the graph
            window.conversations.utils.updateChartInstance(this.charWrapper, this.chartInstance, window.ChartComponent.TYPE_BAR, barData, barOptions);

        }

        buildBarData(timelineResponseData) {
            // Build chart data based on the measure field type and the response data according to the selected group
            const groupKey = (this.state.group_name === ALL_VALUE) ? 'all' : this.state.group_name;
            const timelineData = timelineResponseData[groupKey];
            
            // X-Axis Labels (Interval timestamps)
            const labels = timelineData.map(bucket => new Date(bucket.interval_start).toLocaleString());

            // Build datasets according to measure field type
            const datasetCommon = { borderColor: getCssVar('--color-border-light'), backgroundColor: getCssVar('--color-secondary-accent'), borderWidth: 2 };
            let datasets = [];
            if (MEASURE_FIELDS[this.state.measure_field].type === 'summary') {
                datasets = [{
                    ...datasetCommon,
                    label: MEASURE_FIELDS[this.state.measure_field].label,
                    data: timelineData.map((bucket) => bucket.summary[MEASURE_FIELDS[this.state.measure_field].field] || 0),
                }];

            } else if (MEASURE_FIELDS[this.state.measure_field].type === 'conversations_by_state') {
                // Simple stacked bars by interval (states summed up across all types)
                const allStates = [...new Set(timelineData.flatMap(d => Object.keys(d.summary.by_state)))];

                datasets = allStates.map(state => ({
                    ...datasetCommon,
                    label: state,
                    data: timelineData.map(entry => entry.summary.by_state[state] || 0),
                    backgroundColor: stateColor(state),
                }));

            } else if (MEASURE_FIELDS[this.state.measure_field].type === 'conversation_types_by_state') {
                datasets = [];
                const rawData = timelineResponseData[groupKey];

                const allStates = [...new Set(rawData.flatMap(entry =>
                    Object.values(entry.by_type).flatMap(typeObj => Object.keys(typeObj.summary.by_state))
                ))];
                const allTypes = [...new Set(rawData.flatMap(entry => Object.keys(entry.by_type)))];

                // Create unique labels by combining type and state
                allTypes.forEach(type => {
                    allStates.forEach(state => {
                        datasets.push({
                            ...datasetCommon,
                            label: `${type} - ${state}`,
                            data: rawData.map(entry => entry.by_type[type]?.summary?.by_state?.[state] || 0),
                            stack: type,
                            backgroundColor: stateColor(state),
                            borderColor: type === 'ai_decision' ? 'magenta' : 'black',
                        });
                    });
                });

            } else {
                new window.AlertComponent("Chart error", 'Unknown measure field type: ' + MEASURE_FIELDS[this.state.measure_field].type, null, window.AlertComponent.TYPE_DANGER);
                datasets = [];
            }

            return {
                labels,
                datasets
            };
        };

        buildBarOptions() {
            if (MEASURE_FIELDS[this.state.measure_field].type === 'conversations_by_state' || 
                MEASURE_FIELDS[this.state.measure_field].type === 'conversation_types_by_state') {
                return {
                    scales: { x: { stacked: true }, y: { stacked: true } }
                };
            }
            return null;
        }

        destroy() {
            if (this.chartInstance && typeof this.chartInstance.destroy === 'function') {
                try { this.chartInstance.destroy(); } catch (e) { }
            }
            this.chartInstance = null;
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.charts = window.conversations.charts || {};
    window.conversations.charts.ChartStatusTimelineComponent = ChartStatusTimelineComponent;
})();
