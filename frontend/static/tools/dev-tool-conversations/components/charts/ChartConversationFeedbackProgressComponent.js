(function () {
    /**
     * ChartConversationFeedbackProgressComponent
     * 
     * A component that displays a bar chart showing the progress of conversation feedback over time.
     */
    // Test checkout 1 2 3 4 5 6 
    const BASE_COLORS = [
        { h: 210, s: 80 }, // 1. Electric Blue (Most distinct, cold)
        { h: 350, s: 75 }, // 2. Vivid Red (High contrast to blue, warm)
        { h: 140, s: 65 }, // 3. Forest Green (Balanced)
        { h: 35, s: 85 }, // 4. Deep Orange (Highly visible)
        { h: 280, s: 60 }, // 5. Royal Purple (Distinct from blue and red)
        { h: 180, s: 70 }, // 6. Teal/Cyan (Bright and modern)
        { h: 310, s: 65 }, // 7. Hot Pink/Magenta
        { h: 80, s: 60 }, // 8. Lime Green (High energy)
        { h: 20, s: 60 }, // 9. Sienna/Brown (Earth tone)
        { h: 250, s: 50 }  // 10. Indigo/Slate (Deep and muted)
    ];

    class ChartConversationFeedbackProgressComponent {
        constructor(container, conversation, messages) {
            this.container = container;
            this.conversation = conversation;
            this.messages = messages;
            this.chartInstance = null;
            this.chartWrapper = null;

            this.feedbackDatasets = null;
            this.chartData = null;
            this.state = {
                members: [],
                feedbacks: []
            };

            this.render();
        }

        render() {
            // Horizontal layout with chart on the left and controls on the right
            const horizontalDiv = window.conversations.utils.createDivContainer(this.container, 'conversation-container-horizontal');

            // Chart wrapper
            this.chartWrapper = window.conversations.utils.createDivContainer(horizontalDiv, 'conversations-scrollable-group', { flex: '0.8' });

            // Controls (filter lines) div
            const controlsDiv = window.conversations.utils.createDivContainer(horizontalDiv, 'conversation-container-vertical', { flex: '0.2' });

            this.memberSelectionDiv = window.conversations.utils.createDivContainer(controlsDiv, 'conversation-field-container-vertical');

            this.feedbackSelectionDiv = window.conversations.utils.createDivContainer(controlsDiv, 'conversation-field-container-vertical');

            // Initial state - all members selected (using member_name to match datasets)
            this.state.members = this.conversation.participants.map(p => p.member_name);

            // Initial state - all feedback keys that are integers selected
            this.state.feedbacks = this.conversation.info.roles.flatMap(role => role.feedback_def.filter(f => f.type === 'integer').map(f => f.name));

            // Members options
            this.renderMembersSelectionDiv(controlsDiv);

            // Feedback options per role
            this.renderMembersFeedbackSelectionDiv();

            // Initial load of the chart with all members and feedback keys selected
            this.loadChart()
        }

        renderMembersSelectionDiv() {
            window.conversations.utils.createLabel(this.memberSelectionDiv, 'Members:');
            // States options
            new window.OptionButtonsComponent(
                this.memberSelectionDiv,
                {
                    options: this.conversation.participants.map(participant => ({ label: participant.member_name + ' - ' + participant.instruction_role, value: participant.member_name })),
                    onChange: async (v) => {
                        this.state.members = v;
                        await this.buildChartData();

                        this.chartInstance.setData(this.chartData);
                    },
                    selected: this.state.members,
                    multiSelect: true,
                    viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                    layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
                }
            );
        }

        renderMembersFeedbackSelectionDiv() {
            // Clear previous feedback options
            this.feedbackSelectionDiv.innerHTML = '';

            this.conversation.info.roles.forEach(role => {
                window.conversations.utils.createLabel(this.feedbackSelectionDiv, `${role.role_name} Feedback:`);
                new window.OptionButtonsComponent(
                    this.feedbackSelectionDiv,
                    {
                        options: role.feedback_def.filter(f => f.type === 'integer').map(feedback => ({ label: feedback.name, value: feedback.name })),
                        onChange: async (v) => {
                            this.state.feedbacks = v;
                            await this.buildChartData();

                            this.chartInstance.setData(this.chartData);
                        },
                        selected: this.state.feedbacks,
                        multiSelect: true,
                        viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                        layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
                    }
                );

            });
        }

        async loadChart() {
            await this.buildFeedbackDatasets();

            await this.buildChartData();

            // Create or update chart instance and render the graph
            this.chartInstance = window.conversations.utils.updateChartInstance(this.chartWrapper, this.chartInstance, window.ChartComponent.TYPE_LINE, this.chartData);
        }

        async buildFeedbackDatasets() {
            // Labels are timestamps of messages
            const allLabels = this.messages.map(msg => new Date(msg.created_at).toLocaleTimeString());

            // Conversation members
            const conversationMembers = [...new Set(this.messages.map(msg => msg.member_name))];

            const allPossibleDatasets = [];

            conversationMembers.forEach((member, memberIndex) => {

                // Get the participant data including the feedback and the feedback_def from the conversation
                const participant = this.conversation.participants.find(p => p.member_name === member);
                const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role).feedback_def;

                // Select the base color for the member
                const base = BASE_COLORS[memberIndex % BASE_COLORS.length] || { h: 0, s: 0 };
                const feedbackKeys = feedback_def.filter(f => f.type === 'integer').map(f => f.name);
                // For each feedback key, create a dataset
                feedbackKeys.forEach((fKey, feedbackIndex) => {
                    // Calculate color based on base color and feedback index
                    const color = `hsl(${base.h}, ${base.s}%, ${30 + (feedbackIndex * (50 / Math.max(1, feedbackKeys.length - 1)))}%)`;
                    const dataset = {
                        label: `${member} (${fKey})`,
                        member: member,
                        feedbackKey: fKey,
                        data: [],
                        borderColor: color,
                        spanGaps: true,
                        tension: 0.3,
                        pointRadius: 1,
                        borderWidth: 2
                    };

                    // Populate data for this member and feedback key
                    this.messages.forEach(msg => {
                        if (msg.member_name === member && msg.feedback && msg.feedback[fKey] !== undefined) {
                            dataset.data.push(msg.feedback[fKey]);
                        } else {
                            dataset.data.push(null);
                        }
                    });

                    allPossibleDatasets.push(dataset);
                });
            });

            this.feedbackDatasets = { labels: allLabels, datasets: allPossibleDatasets };
        }

        async buildChartData() {
            this.chartData = {
                labels: this.feedbackDatasets.labels,
                datasets: this.feedbackDatasets.datasets.filter(ds =>
                    this.state.members.includes(ds.member) &&
                    this.state.feedbacks.includes(ds.feedbackKey)
                )
            };
        }

        async refresh(conversation, messages) {
            this.conversation = conversation;
            this.messages = messages;
            await this.buildFeedbackDatasets();
            await this.buildChartData();

            this.chartInstance.setData(this.chartData);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.charts = window.conversations.charts || {};
    window.conversations.charts.ChartConversationFeedbackProgressComponent = ChartConversationFeedbackProgressComponent;
})();
