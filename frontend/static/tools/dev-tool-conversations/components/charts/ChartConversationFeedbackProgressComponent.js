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

            // Initial state - all members selected (using member_name to match datasets)
            this.state.members = this.messages
                .map(msg => msg.member_name)
                .filter((value, index, self) => self.indexOf(value) === index);

            // Initial state - collect all unique feedback keys from all roles
            const allFeedbackKeys = new Set();
            this.conversation.participants.forEach(participant => {
                const feedback_def = this.conversation.info.roles.find(r => r.role_name === participant.instruction_role)?.feedback_def;
                if (feedback_def) {
                    Object.entries(feedback_def)
                        .filter(([_, val]) => val.type === 'integer')
                        .forEach(([key]) => allFeedbackKeys.add(key));
                }
            });
            this.state.feedbacks = Array.from(allFeedbackKeys);

            const horizontalDiv = window.conversations.utils.createDivContainer(this.container, 'conversation-container-horizontal');

            // Chart wrapper
            this.chartWrapper = window.conversations.utils.createDivContainer(horizontalDiv, 'conversations-scrollable-group');

            // Controls (filter lines) div
            const controlsDiv = window.conversations.utils.createDivContainer(horizontalDiv, 'conversation-container-vertical', { flex: '0 1 auto'});

            // Members options
            this.renderControlsDiv(controlsDiv);

            this.renderChart();
        }

        renderControlsDiv(controlsDiv) {
            window.conversations.utils.createLabel(controlsDiv, 'Members:');
            // States options
            new window.OptionButtonsComponent(
                controlsDiv,
                {
                    options: this.messages
                        .map(msg => msg.member_name)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .map(name => ({ label: name, value: name })),
                    selected: this.state.members,
                    onChange: (v) => {
                        this.state.members = v;
                        this.renderChart();
                    },
                    multiSelect: true,
                    viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                    layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL
                }
            );
        
            // Group feedback keys by role - show options per role (not per member)
            const rolesProcessed = new Set();
            
            // Get unique roles from participants
            this.conversation.participants.forEach(participant => {
                const roleKey = participant.instruction_role;
                
                // Skip if we already processed this role
                if (rolesProcessed.has(roleKey)) return;
                rolesProcessed.add(roleKey);
                
                const roleData = this.conversation.info.roles.find(r => r.role_name === roleKey);
                if (!roleData) return;
                
                const feedback_def = roleData.feedback_def;
                if (!feedback_def) return;
                
                const feedbackKeys = feedback_def
                    .filter(f => f.type === 'integer')
                    .map(f => f.name);
                
                if (feedbackKeys.length === 0) return;
                
                this.state.feedbacks.push(feedbackKeys[0]); // Select the first feedback key by default for this role
                // Create a container for this role's feedback options
                // const roleFeedbackDiv = window.conversations.utils.createDivContainer(feedbacksControlDiv, 'conversation-field-container-vertical');
                // roleFeedbackDiv.style.marginBottom = '10px';
                
                // Use role_name if available, otherwise use roleKey
                const roleName = roleData.role_name || roleKey;
                window.conversations.utils.createLabel(controlsDiv, `Role ${roleName}:`);
                
                new window.OptionButtonsComponent(
                    controlsDiv,
                    {
                        options: feedbackKeys.map(key => ({ label: key, value: key })),
                        selected: this.state.feedbacks,
                        onChange: (v) => {
                            this.state.feedbacks = v;
                            this.renderChart();
                        },
                        multiSelect: true,
                        viewType: window.OptionButtonsComponent.TYPE_CHECKBOXES,
                        layout: window.OptionButtonsComponent.VIEW_TYPE_VERTICAL,
                        selected: this.state.feedbacks
                    }
                );
            });
            this.renderChart();
        }

        parseFeedbackDatasets() {
            // Prepare data for Chart

            // Labels are timestamps of messages
            const allLabels = this.messages.map(msg => new Date(msg.created_at).toLocaleTimeString());
            
            // Prepare feedback keys that are integers
            // const feedbackKeys = Object.entries(this.feedbackDefMap).filter(([_, val]) => val.type === 'integer').map(([key]) => key);

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
            this.chartInstance = window.conversations.utils.updateChartInstance(this.chartWrapper, this.chartInstance, window.ChartComponent.TYPE_LINE, data);
        }
    }

    window.conversations = window.conversations || {};
    window.conversations.charts = window.conversations.charts || {};
    window.conversations.charts.ChartConversationFeedbackProgressComponent = ChartConversationFeedbackProgressComponent;
})();
