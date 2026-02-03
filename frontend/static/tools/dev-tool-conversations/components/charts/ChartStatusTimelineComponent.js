(function () {

    // All option value
    const ALL_VALUE = 'all';
    const AGGREGATION_LEVEL_NONE = 'none';

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

    const AGGREGATION_LEVELS = [
        { label: 'No Grouping', value: AGGREGATION_LEVEL_NONE },
        { label: 'Group', value: 'group' },
        { label: 'Type', value: 'conversation_type' },
        { label: 'Instructions', value: 'instructions_key' },
        { label: 'State', value: 'state' }
    ];

    class ChartStatusTimelineComponent {
        constructor(container) {
            this.container = container;
            this.chartInstance = null;
            this.cacheInstructionsByGroup = {};

            this.state = {
                group_id: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_group_id') || ALL_VALUE,
                conversation_type: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_conversation_type') || ALL_VALUE,
                instructions_key: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_instructions_key') || ALL_VALUE,
                states: window.StorageService.getStorageJSON('conversations_chart_status_timeline_states') || STATE_VALUES,
                hours_back: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_hours_back') || 24,
                interval: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_interval') || 'hour',
                measure_field: window.StorageService.getLocalStorageItem('conversations_chart_status_timeline_measure_field') || 'total_conversations',
                aggregation_level_0: AGGREGATION_LEVEL_NONE,
                aggregation_level_1: AGGREGATION_LEVEL_NONE
            };

            this.instructionsKeyControlDiv = null;
            this.aggregation_level_1Div = null;
            
            this.charWrapper = null;
            this.groups = null;
            
            this.render();
        }

        render() {
            this.loadContent();
        }

        async loadContent() {
            this.groups = await window.conversations.apiGroups.groupsList(this.container);
            
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

            // Aggregation area
            const AggregationAreaDiv = window.conversations.utils.createDivContainer(chartBottomAreaDiv, '-');
            this.renderAggregationLevels(AggregationAreaDiv);

            // Measure select
            this.renderMeasureSelect(measureControlDiv);

            // Interval options
            this.renderIntervalOptions(intervalControlDiv);

            // Initial chart render
            this.renderChart();
        }

        renderAggregationLevels(container) {

            const aggregation_level_0Div = window.conversations.utils.createFieldDiv(container, 'Aggregation Level 0:');
            const aggregation_level_0ControlDiv = window.conversations.utils.createDivContainer(aggregation_level_0Div);

            const aggregation_level_1Div = window.conversations.utils.createFieldDiv(container, 'Aggregation Level 1:');
            this.aggregation_level_1Div = window.conversations.utils.createDivContainer(aggregation_level_1Div);

            this.renderAggregationLevel0Select(aggregation_level_0ControlDiv);
            
        }

        async renderFilters(container) {
            // Filter area - Group name div 
            const groupNameDiv = window.conversations.utils.createFieldDiv(container, 'Group:');
            const groupNameSelectDiv = window.conversations.utils.createDivContainer(groupNameDiv);

            // Filter area - Conversation type div
            const conversationTypeDiv = window.conversations.utils.createFieldDiv(container, 'Type:');
            const conversationTypeSelectDiv = window.conversations.utils.createDivContainer(conversationTypeDiv);

            // Filter area - Instruction div
            const instructionKeyDiv = window.conversations.utils.createFieldDiv(container, 'Instruction:');
            this.instructionKeyControlDiv = window.conversations.utils.createDivContainer(instructionKeyDiv);

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
            const groupOptions = this.groups.map(g => ({ label: g.group_name, value: String(g.group_id) }));
            new window.SelectComponent(
                groupNameSelectDiv,
                [{ label: 'All Groups', value: ALL_VALUE }].concat(groupOptions),
                async (v) => {
                    this.state.group_id = v;
                    this.state.instructions_key = ALL_VALUE;
                    await this.renderInstructionSelect();
                    this.renderChart();
                    window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_group_id', v);
                },
                'Select Group ...',
                this.state.group_id
            );
        }

        async renderConversationTypeSelect(conversationTypeDiv) {
            // Conversation type select
            new window.SelectComponent(
                conversationTypeDiv,
                CONVERSATION_TYPES,
                async (v) => {
                    this.state.conversation_type = v;
                    this.state.instructions_key = ALL_VALUE;
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
            this.instructionsKeyControlDiv.innerHTML = '';

            if (this.state.group_id === ALL_VALUE) {
                new window.SelectComponent(this.instructionsKeyControlDiv, [{ label: 'Select a group first', value: ALL_VALUE }], null, 'Select Instruction ...', ALL_VALUE, true);

            } else {
                // Fetch instructions for the selected group (with caching)
                let instructionsResp = this.cacheInstructionsByGroup[this.state.group_id];
                if (!instructionsResp) {
                    instructionsResp = await window.conversations.apiInstructions.instructionsList(this.instructionsKeyControlDiv, this.state.group_id);
                    this.cacheInstructionsByGroup[this.state.group_id] = instructionsResp;
                }

                const options = [{ label: 'All instructions', value: ALL_VALUE }].
                    concat(instructionsResp.
                        filter(instruction => instruction.info.conversation_type === this.state.conversation_type).
                        map(instruction => ({ label: instruction.info.name, value: instruction.instructions_key }))
                    );

                new window.SelectComponent(
                    this.instructionsKeyControlDiv,
                    options,
                    (v) => {
                        this.state.instructions_key = v;
                        this.renderChart();
                        window.StorageService.setLocalStorageItem('conversations_chart_status_timeline_instructions_key', v);
                    },
                    'Select Instruction ...',
                    this.state.instructions_key
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

        renderAggregationLevel0Select(container) {
            // Aggregation level 0 select
            new window.SelectComponent(
                container,
                AGGREGATION_LEVELS,
                (v) => {
                    this.state.aggregation_level_0 = v;
                    if (this.state.aggregation_level_0 === AGGREGATION_LEVEL_NONE) {
                        this.state.aggregation_level_1 = AGGREGATION_LEVEL_NONE;
                    }
                    this.renderAggregationLevel1Select();
                    this.renderChart();
                },
                'Aggregation Level 0 ...',
                this.state.aggregation_level_0
            );
            this.renderAggregationLevel1Select();
        }

        renderAggregationLevel1Select() {
            this.aggregation_level_1Div.innerHTML = '';

            if (this.state.aggregation_level_0 === AGGREGATION_LEVEL_NONE) {
                new window.SelectComponent(this.aggregation_level_1Div, [{ label: 'Select aggregation level 0 first', value: AGGREGATION_LEVEL_NONE }], AGGREGATION_LEVEL_NONE, 'Select Aggregation Level 0 first ...', null, true);

            } else {

                // Aggregation level 1 select
                new window.SelectComponent(
                    this.aggregation_level_1Div,
                    AGGREGATION_LEVELS.filter(al => al.value !== this.state.aggregation_level_0),
                    (v) => {
                        this.state.aggregation_level_1 = v;
                        this.renderChart();
                    },
                    'Aggregation Level 1 ...',
                    this.state.aggregation_level_1
                );
            }
        }

        async renderChart() {
            // Fetch data from API
            const allStatesSelected = STATE_VALUES.every(v => this.state.states.includes(v));

            const timelineResponseData = await window.conversations.system_api.fetchStatusConversationTimeline(
                this.charWrapper,
                this.state.hours_back,
                this.state.interval,
                this.state.group_id !== ALL_VALUE ? this.state.group_id : null,
                this.state.conversation_type !== ALL_VALUE ? this.state.conversation_type : null,
                this.state.instructions_key !== ALL_VALUE ? this.state.instructions_key : null,
                !allStatesSelected ? this.state.states : null,
                this.state.aggregation_level_0 !== AGGREGATION_LEVEL_NONE ? this.state.aggregation_level_0 : null,
                this.state.aggregation_level_1 !== AGGREGATION_LEVEL_NONE ? this.state.aggregation_level_1 : null,
            );

            // Build chart data and options
            const barData = this.buildBarData(timelineResponseData);
            const barOptions = this.buildBarOptions();

            // Create or update chart instance and render the graph
            window.conversations.utils.updateChartInstance(this.charWrapper, this.chartInstance, window.ChartComponent.TYPE_BAR, barData, barOptions);

        }

        buildBarData(timelineResponseData) {
            // X-Axis Labels (Interval timestamps)
            const labels = timelineResponseData.map(bucket => new Date(bucket.interval_start).toLocaleString());
            const datasetCommon = { borderColor: getCssVar('--color-border-light'), backgroundColor: getCssVar('--color-secondary-accent'), borderWidth: 2 };
            let datasets = [];

            // Case 1: No aggregation - simple summary data
            if (this.state.aggregation_level_0 === AGGREGATION_LEVEL_NONE) {
                datasets = [{
                    ...datasetCommon,
                    label: MEASURE_FIELDS[this.state.measure_field].label,
                    data: timelineResponseData.map((bucket) => bucket.summary[MEASURE_FIELDS[this.state.measure_field].field] || 0),
                }];
            }
            // Case 2: Aggregation level 0 only - create dataset per level 0 key
            else if (this.state.aggregation_level_1 === AGGREGATION_LEVEL_NONE) {
                // Get all unique keys from aggregation level 0 (excluding 'interval_start', 'interval_end', 'summary')
                const level0Keys = new Set();
                timelineResponseData.forEach(bucket => {
                    Object.keys(bucket).forEach(key => {
                        if (key !== 'interval_start' && key !== 'interval_end' && key !== 'summary') {
                            level0Keys.add(key);
                        }
                    });
                });

                // Create a dataset for each level 0 key
                Array.from(level0Keys).forEach((key, index) => {
                    datasets.push({
                        ...datasetCommon,
                        label: key,
                        data: timelineResponseData.map(bucket => 
                            bucket[key]?.summary?.[MEASURE_FIELDS[this.state.measure_field].field] || 0
                        ),
                        backgroundColor: this.getColorForIndex(index),
                    });
                });
            }
            // Case 3: Both aggregation levels - stacked bars
            else {
                // Get all unique level 0 and level 1 keys
                const level0Keys = new Set();
                const level1KeysByLevel0 = {};

                timelineResponseData.forEach(bucket => {
                    Object.keys(bucket).forEach(level0Key => {
                        if (level0Key !== 'interval_start' && level0Key !== 'interval_end' && level0Key !== 'summary') {
                            level0Keys.add(level0Key);
                            
                            if (!level1KeysByLevel0[level0Key]) {
                                level1KeysByLevel0[level0Key] = new Set();
                            }
                            
                            // Get level 1 keys (excluding 'summary')
                            Object.keys(bucket[level0Key]).forEach(level1Key => {
                                if (level1Key !== 'summary') {
                                    level1KeysByLevel0[level0Key].add(level1Key);
                                }
                            });
                        }
                    });
                });

                // Create datasets: for each level0 key, create stacked datasets for each level1 key
                let colorIndex = 0;
                Array.from(level0Keys).forEach(level0Key => {
                    const level1Keys = Array.from(level1KeysByLevel0[level0Key] || []);
                    
                    level1Keys.forEach(level1Key => {
                        datasets.push({
                            ...datasetCommon,
                            label: `${level0Key} - ${level1Key}`,
                            data: timelineResponseData.map(bucket => 
                                bucket[level0Key]?.[level1Key]?.summary?.[MEASURE_FIELDS[this.state.measure_field].field] || 0
                            ),
                            stack: level0Key, // Stack by level 0 key
                            backgroundColor: this.getColorForIndex(colorIndex++),
                        });
                    });
                });
            }
            
            return { labels, datasets };
        }

        getColorForIndex(index) {
            // Generate distinct colors for different datasets
            const colors = [
                getCssVar('--color-secondary-accent'),
                getCssVar('--color-primary-accent'),
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40',
                '#FF6384',
                '#C9CBCF'
            ];
            return colors[index % colors.length];
        }

        buildBarOptions() {
            // Enable stacking when we have aggregation level 1 (nested stacking)
            if (this.state.aggregation_level_1 !== AGGREGATION_LEVEL_NONE) {
                return {
                    scales: { x: { stacked: true }, y: { stacked: true } }
                };
            }
            
            // Legacy support for old measure field types
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
