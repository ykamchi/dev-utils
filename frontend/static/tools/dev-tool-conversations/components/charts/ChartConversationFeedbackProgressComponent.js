(function () {
    /**
     * ChartConversationFeedbackProgressComponent
     * 
     * A component that displays a bar chart showing the progress of conversation feedback over time.
     */
// Test checkout 1
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
        constructor(container, feedbackDefMap, messages) {
            this.container = container;
            this.feedbackDefMap = feedbackDefMap;
            this.messages = messages;
            this.chartInstance = null;
            this.chartWrapper = null;
            this.chartData = null;
            this.state = {
                members: [],
                feedbacks: []
            };

            this.render();
        }

        render() {
            this.loadContent();
        }

        async loadContent() {
            // Fetch messages from API if not already given in the constructor
            // if (!this.messages) {
            //     this.messages = await window.conversations.apiConversations.conversationsMessages(this.container, this.conversation.info.conversation_type, this.conversation.conversation_id);
            // }

            this.chartData = this.parseFeedbackDatasets();

            // Initial state - all members selected
            this.state.members = this.messages
                .map(msg => msg.member_nick_name)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(name => name);

            // Initial state - first integer feedback selected
            this.state.feedbacks = [Object.entries(this.feedbackDefMap).map(([key, value]) => {
                if (value.type === 'integer') {
                    return key;
                }
            })[0]];

            // Members selection div
            const membersDiv = window.conversations.utils.createFieldDiv(this.container, 'Members:');
            const membersControlDiv = window.conversations.utils.createDivContainer(membersDiv);

            // Chart wrapper
            this.chartWrapper = window.conversations.utils.createDivContainer(this.container, 'conversations-scrollable-group');

            // Feedbacks selection div
            const feedbacksDiv = window.conversations.utils.createFieldDiv(this.container, 'Feedbacks:');
            const feedbacksControlDiv = window.conversations.utils.createDivContainer(feedbacksDiv);

            // Members options
            this.renderMembersOptions(membersControlDiv);

            // Feedback options
            this.renderFeedbackOptions(feedbacksControlDiv);

            this.renderChart();
        }

        renderMembersOptions(membersControlDiv) {
            // States options
            new window.OptionButtonsComponent(
                membersControlDiv,
                this.messages
                    .map(msg => msg.member_nick_name)
                    .filter((value, index, self) => self.indexOf(value) === index)
                    .map(name => ({ label: name, value: name })),
                this.state.members,
                (v) => {
                    this.state.members = v;
                    this.renderChart();
                },
                null,
                true
            );
        }

        renderFeedbackOptions(feedbacksControlDiv) {
            // States options
            new window.OptionButtonsComponent(
                feedbacksControlDiv,
                Object.keys(this.feedbackDefMap)
                .filter(key => this.feedbackDefMap[key].type === 'integer')
                .map(key => ({ label: key, value: key })),
                this.state.feedbacks,
                (v) => {
                    this.state.feedbacks = v;
                    this.renderChart();
                },
                null,
                true
            );
        }

        parseFeedbackDatasets() {
            // Prepare data for Chart

            // Labels are timestamps of messages
            const allLabels = this.messages.map(msg => new Date(msg.created_at).toLocaleTimeString());

            // Prepare feedback keys that are integers
            const feedbackKeys = Object.entries(this.feedbackDefMap).filter(([_, val]) => val.type === 'integer').map(([key]) => key);

            // Conversation members
            const conversationMembers = [...new Set(this.messages.map(msg => msg.member_nick_name))];

            const allPossibleDatasets = [];

            conversationMembers.forEach((member, memberIndex) => {
                // Select the base color for the member
                const base = BASE_COLORS[memberIndex % BASE_COLORS.length] || { h: 0, s: 0 };

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
                        if (msg.member_nick_name === member && msg.feedback && msg.feedback[fKey] !== undefined) {
                            dataset.data.push(msg.feedback[fKey]);
                        } else {
                            dataset.data.push(null);
                        }
                    });

                    allPossibleDatasets.push(dataset);
                });
            });

            return { labels: allLabels, datasets: allPossibleDatasets };
        }

        async renderChart() {
            // Show chart with current state filters
            const data = {
                labels: this.chartData.labels,
                datasets: this.chartData.datasets.filter(ds =>
                    this.state.members.includes(ds.member) &&
                    this.state.feedbacks.includes(ds.feedbackKey)
                )
            };

            // Create or update chart instance and render the graph
            window.conversations.utils.updateChartInstance(this.chartWrapper, this.chartInstance, window.ChartComponent.TYPE_LINE, data);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.charts = window.conversations.charts || {};
    window.conversations.charts.ChartConversationFeedbackProgressComponent = ChartConversationFeedbackProgressComponent;
})();
