(function () {

    // Register the datalabels plugin globally if available, but disable by default
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
        Chart.defaults.set('plugins.datalabels', {
            display: false // Disable by default
        });
    }

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
        { label: 'All', value: ALL_VALUE },
        { label: 'Queued', value: 'queued' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' }
    ];

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
                states: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_states') || ALL_VALUE,
                hours_back: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_hours_back') || 24,
                interval: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_interval') || 'hour',
                measure_field: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_measure_field') || 'total_conversations'
            };

            this.page = null;

            this.instructionTypeControlDiv = null;
            this.charWrapper = null;

            this.render();
        }

        render() {
            // Create the main page component
            this.page = new window.conversations.PageComponent(this.container);

            this.loadControl();

            // Page buttons
            const buttonsDiv = window.conversations.utils.createDivContainer(null, 'conversations-buttons-container');
            this.page.updateButtonsArea(buttonsDiv);

            this.loadContent();
        }

        async loadControl() {
            // Page control
            const controlDiv = window.conversations.utils.createDivContainer(null, '-');

            // Filter area - Group name div 
            const groupNameDiv = window.conversations.utils.createDivContainer(controlDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(groupNameDiv, 'Group:');
            const groupNameSelectDiv = window.conversations.utils.createDivContainer(groupNameDiv);

            // Filter area - Conversation type div
            const conversationTypeDiv = window.conversations.utils.createDivContainer(controlDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(conversationTypeDiv, 'Type:');
            const conversationTypeSelectDiv = window.conversations.utils.createDivContainer(conversationTypeDiv);

            // Filter area - Instruction div
            const instructionTypeDiv = window.conversations.utils.createDivContainer(controlDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(instructionTypeDiv, 'Instruction:');
            this.instructionTypeControlDiv = window.conversations.utils.createDivContainer(instructionTypeDiv);

            // Filter area - States div
            const statesDiv = window.conversations.utils.createDivContainer(controlDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(statesDiv, 'States:');
            const statesControlDiv = window.conversations.utils.createDivContainer(statesDiv);

            // Filter area - Hours back div
            const hoursBackDiv = window.conversations.utils.createDivContainer(controlDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(hoursBackDiv, 'Hours back:');
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

            // Update control area
            this.page.updateControlArea(controlDiv);
        }

        async loadContent() {
            // Page content
            const contentDiv = window.conversations.utils.createDivContainer();

            const chartTopAreaDiv = window.conversations.utils.createDivContainer(contentDiv, 'chart-status-timeline-chart');
            this.charWrapper = window.conversations.utils.createDivContainer(contentDiv, 'chart-status-timeline-chart');
            const chartBottomAreaDiv = window.conversations.utils.createDivContainer(contentDiv, 'chart-status-timeline-chart');

            // Chart top area - Measure div
            const measuredDiv = window.conversations.utils.createDivContainer(chartTopAreaDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(measuredDiv, 'Measure:');
            const measureControlDiv = window.conversations.utils.createDivContainer(measuredDiv);

            // Chart bottom area - Interval div
            const intervalDiv = window.conversations.utils.createDivContainer(chartBottomAreaDiv, 'conversation-container-vertical');
            new window.conversations.utils.createLabel(intervalDiv, 'Interval:');
            const intervalControlDiv = window.conversations.utils.createDivContainer(intervalDiv, 'conversation-container-vertical');


            // Measure select
            this.renderMeasureSelect(measureControlDiv);

            // Interval options
            this.renderIntervalOptions(intervalControlDiv);

            // Initial chart render
            await this.renderChart();

            this.page.updateContentArea(contentDiv);
        }

        async renderGroupNameSelect(groupNameSelectDiv) {
            // Group select
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
            new window.OptionButtonsComponent(
                statesDiv,
                STATES,
                this.state.states,
                (v) => {
                    this.state.states = [v];
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_states', v);
                },
            );
        }

        renderHoursBackOptions(hoursBackControlDiv) {
            new window.RangeComponent(
                hoursBackControlDiv,
                1,
                24 * 365,
                (v) => {
                    const n = Number(v);
                    this.state.hours_back = n;
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_hours_back', this.state.hours_back);
                }
            );

        }

        renderMeasureSelect(measureControlDiv) {
            measureControlDiv.innerHTML = '';
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
            this.charWrapper.innerHTML = '';

            const resp = await window.conversations.system_api.fetchStatusConversationTimeline(
                this.charWrapper,
                this.state.hours_back,
                this.state.interval,
                this.state.group_name !== ALL_VALUE ? this.state.group_name : null,
                this.state.conversation_type !== ALL_VALUE ? this.state.conversation_type : null,
                this.state.instruction_type !== ALL_VALUE ? this.state.instruction_type : null,
                this.state.states !== ALL_VALUE ? [this.state.states] : null
            );

            const barData = this.buildBarData(resp);

            const barOptions = this.buildBarOptions();

            if (this.chartInstance && typeof this.chartInstance.destroy === 'function') {
                try { this.chartInstance.destroy(); } catch (e) { }
            }

            const chartDiv = window.conversations.utils.createDivContainer(this.charWrapper, 'conversation-container-vertical');
            this.chartInstance = new window.ChartComponent(
                chartDiv,
                window.ChartComponent.TYPE_BAR,
                barData,
                barOptions,
                '100%',
                '320px',
                'Status timeline'
            );

            if (this.chartInstance && typeof this.chartInstance.refresh === 'function') {
                setTimeout(() => this.chartInstance.refresh(), 0);
            }
        }

        buildBarData(resp) {
            const groupKey = (this.state.group_name === ALL_VALUE) ? 'all' : this.state.group_name;
            const rawData = resp[groupKey];
            // X-Axis Labels (Interval timestamps)
            const labels = rawData.map(bucket => new Date(bucket.interval_start).toLocaleString());

            let datasets = [];

            if (MEASURE_FIELDS[this.state.measure_field].type === 'summary') {
                datasets = [{
                    label: MEASURE_FIELDS[this.state.measure_field].label,
                    data: rawData.map((bucket) => bucket.summary[MEASURE_FIELDS[this.state.measure_field].field] || 0),
                    backgroundColor: getCssVar('--color-secondary-accent'),
                    borderColor: 'black',
                    borderWidth: 3
                }];
            } else if (MEASURE_FIELDS[this.state.measure_field].type === 'conversations_by_state') {
                // Simple stacked bars by interval (states summed up across all types)
                const allStates = [...new Set(rawData.flatMap(d => Object.keys(d.summary.by_state)))];

                datasets = allStates.map(state => ({
                    label: state,
                    data: rawData.map(entry => entry.summary.by_state[state] || 0),
                    backgroundColor: stateColor(state)
                }));

            } else if (MEASURE_FIELDS[this.state.measure_field].type === 'conversation_types_by_state') {
                datasets = [];
                const rawData = resp[groupKey];

                const allStates = [...new Set(rawData.flatMap(entry =>
                    Object.values(entry.by_type).flatMap(typeObj => Object.keys(typeObj.summary.by_state))
                ))];
                const allTypes = [...new Set(rawData.flatMap(entry => Object.keys(entry.by_type)))];

                // Create unique labels by combining type and state
                allTypes.forEach(type => {
                    allStates.forEach(state => {
                        datasets.push({
                            label: `${type} - ${state}`,
                            data: rawData.map(entry => entry.by_type[type]?.summary?.by_state?.[state] || 0),
                            backgroundColor: stateColor(state),
                            stack: type
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
            // Shared options for all stacked scenarios
            const stackedScales = {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true }
            };

            // Options for standard, non-stacked bars
            const regularScales = {
                x: { stacked: false },
                y: { stacked: false, beginAtZero: true }
            };

            if (MEASURE_FIELDS[this.state.measure_field].type === 'conversations_by_state') {
                // Simple stacked bars over time
                return {
                    plugins: { legend: { display: true } },
                    scales: stackedScales
                };
            } else if (MEASURE_FIELDS[this.state.measure_field].type === 'conversation_types_by_state') {
                // Grouped stacked bars (intervals on X, types grouped within the interval, states stacked within the type)
                return {
                    plugins: {
                        legend: {
                            display: true
                        },
                        datalabels: {
                            display: true,
                            color: 'white',
                            font: {
                                weight: 'bold',
                                size: 11
                            },
                            formatter: (value) => {
                                return value > 0 ? value : '';
                            }
                        }
                    },
                    scales: stackedScales
                };
            } else {
                // Default case (e.g., 'summary' type)
                return {
                    plugins: { legend: { display: true } },
                    scales: regularScales
                };
            }
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
