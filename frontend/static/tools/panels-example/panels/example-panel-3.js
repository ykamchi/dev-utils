// Panel 3 - Special Agents Panel
window.example_panel_3 = {
    name: 'Agents',
    icon: '🤖',
    description: 'AI Agents and automation tools',

    // Initialize the panel
    init(container, headerStatusContainer) {
        console.log('[Panel 3] Initializing...');
        this.container = container;
        this.headerStatusContainer = headerStatusContainer;
        // Start activity feed updates
        this.startActivityFeed();
    },

    // Destroy the panel (cleanup)
    destroy(container) {
        console.log('[Panel 3] Destroying...');

        console.log('[Panel 3] Destroyed');
    },

    // Buttons for collapsed mode (secondary toolbar)
    collapseModeButtons: [
        {
            callback: function() { this.refreshAgents(); },
            title: "Refresh",
            icon: "🔄"
        },
        {
            callback: function() { this.addAgent(); },
            title: "Add Agent",
            icon: "➕"
        }
    ],

    // Buttons for expanded mode (panel header)
    expandModeButtons: [
        {
            callback: function() { this.optimizeAll(); },
            title: "Optimize",
            icon: "⚡"
        },
        {
            callback: function() { this.viewLogs(); },
            title: "Logs",
            icon: "📋"
        }
    ],

    // onExpand event triggered
    async onExpand() {
        console.log('[Panel 3] Expanded');
    },

    // onCollapse event triggered
    onCollapse(collapsedStatusContainer) {
        console.log('[Panel 3] Collapsed');
    },

    // Render the panel content
    render() {
        return `
            <div class="panel-3-content special-panel-content">
                <div class="agents-overview">
                    <div class="agent-stats">
                        <div class="stat-item">
                            <span class="stat-label">Active Agents:</span>
                            <span class="stat-value" id="active-agents">3</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Tasks Completed:</span>
                            <span class="stat-value" id="tasks-completed">147</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Success Rate:</span>
                            <span class="stat-value" id="success-rate">94.2%</span>
                        </div>
                    </div>
                </div>
                <div class="agents-list">
                    <h4>Available Agents</h4>
                    <div class="agent-item" data-agent="code-reviewer">
                        <div class="agent-icon">👁️</div>
                        <div class="agent-info">
                            <div class="agent-name">Code Reviewer</div>
                            <div class="agent-status active">Active</div>
                        </div>
                        <button class="agent-action-btn" onclick="panel_3.configureAgent('code-reviewer')">Configure</button>
                    </div>
                    <div class="agent-item" data-agent="test-runner">
                        <div class="agent-icon">🧪</div>
                        <div class="agent-info">
                            <div class="agent-name">Test Runner</div>
                            <div class="agent-status idle">Idle</div>
                        </div>
                        <button class="agent-action-btn" onclick="panel_3.configureAgent('test-runner')">Configure</button>
                    </div>
                    <div class="agent-item" data-agent="deployer">
                        <div class="agent-icon">🚀</div>
                        <div class="agent-info">
                            <div class="agent-name">Deployer</div>
                            <div class="agent-status active">Active</div>
                        </div>
                        <button class="agent-action-btn" onclick="panel_3.configureAgent('deployer')">Configure</button>
                    </div>
                </div>
                <div class="agent-controls">
                    <button class="btn-primary" onclick="panel_3.runAllAgents()">Run All Agents</button>
                    <button class="btn-secondary" onclick="panel_3.stopAllAgents()">Stop All</button>
                    <button class="btn-outline" onclick="panel_3.viewAgentLogs()">View Logs</button>
                </div>
                <div class="recent-activity">
                    <h4>Recent Activity</h4>
                    <div class="activity-feed" id="activity-feed">
                        <div class="activity-item">
                            <span class="activity-time">2 min ago</span>
                            <span class="activity-desc">Code review completed for PR #123</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-time">5 min ago</span>
                            <span class="activity-desc">Test suite executed successfully</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-time">12 min ago</span>
                            <span class="activity-desc">Deployment completed to staging</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Panel-specific methods
    configureAgent(agentName) {
        const agentNames = {
            'code-reviewer': 'Code Reviewer',
            'test-runner': 'Test Runner',
            'deployer': 'Deployer'
        };

        alert(`Configuring ${agentNames[agentName] || agentName} agent...`);
        console.log('Configuring agent:', agentName);
    },

    runAllAgents() {
        console.log('Running all agents...');
        // Update UI to show agents are running
        const statusElements = document.querySelectorAll('.agent-status');
        statusElements.forEach(el => {
            el.textContent = 'Running';
            el.className = 'agent-status running';
        });

        // Update stats
        this.updateAgentStats();

        alert('All agents started successfully!');
    },

    stopAllAgents() {
        console.log('Stopping all agents...');
        // Update UI to show agents are stopped
        const statusElements = document.querySelectorAll('.agent-status');
        statusElements.forEach(el => {
            el.textContent = 'Stopped';
            el.className = 'agent-status stopped';
        });

        alert('All agents stopped.');
    },

    viewAgentLogs() {
        console.log('Viewing agent logs...');
        // In a real implementation, this would open a logs viewer
        const logs = [
            '[2025-10-10 14:30:15] Code Reviewer: Analysis completed',
            '[2025-10-10 14:25:10] Test Runner: All tests passed',
            '[2025-10-10 14:20:05] Deployer: Deployment successful',
            '[2025-10-10 14:15:00] Code Reviewer: Reviewing pull request #456'
        ];

        alert('Agent Logs:\n\n' + logs.join('\n'));
    },

    updateAgentStats() {
        // Simulate updating stats
        const activeAgents = document.getElementById('active-agents');
        const tasksCompleted = document.getElementById('tasks-completed');
        const successRate = document.getElementById('success-rate');

        if (activeAgents) activeAgents.textContent = '3';
        if (tasksCompleted) {
            const current = parseInt(tasksCompleted.textContent);
            tasksCompleted.textContent = current + Math.floor(Math.random() * 5) + 1;
        }
        if (successRate) {
            const current = parseFloat(successRate.textContent);
            const newRate = Math.min(99.9, current + (Math.random() - 0.5) * 2);
            successRate.textContent = newRate.toFixed(1) + '%';
        }
    },

    startActivityFeed() {
        // Simulate real-time activity updates
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every 10 seconds
                this.addActivityItem();
            }
        }, 10000);
    },

    addActivityItem() {
        const activities = [
            'Code review completed',
            'Test execution finished',
            'Deployment pipeline started',
            'Security scan completed',
            'Documentation updated',
            'Build process finished'
        ];

        const activityFeed = document.getElementById('activity-feed');
        if (!activityFeed) return;

        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <span class="activity-time">just now</span>
            <span class="activity-desc">${activities[Math.floor(Math.random() * activities.length)]}</span>
        `;

        // Insert at the top
        activityFeed.insertBefore(activityItem, activityFeed.firstChild);

        // Remove oldest items if too many
        while (activityFeed.children.length > 10) {
            activityFeed.removeChild(activityFeed.lastChild);
        }

        // Update timestamps
        this.updateActivityTimestamps();
    },

    updateActivityTimestamps() {
        // This would update relative timestamps, but simplified for demo
        console.log('Activity timestamps updated');
    },

    // New button methods
    addAgent() {
        console.log('Adding new agent...');
        alert('New agent added!');
    },

    bulkAction() {
        console.log('Performing bulk action...');
        alert('Bulk action completed!');
    },

    refreshAgents() {
        console.log('Refreshing agents...');
        // Update agent stats randomly
        const activeAgents = Math.floor(Math.random() * 10) + 1;
        const tasksCompleted = Math.floor(Math.random() * 200) + 100;
        const successRate = (Math.random() * 20 + 80).toFixed(1);

        const activeElement = document.getElementById('active-agents');
        const tasksElement = document.getElementById('tasks-completed');
        const successElement = document.getElementById('success-rate');

        if (activeElement) activeElement.textContent = activeAgents;
        if (tasksElement) tasksElement.textContent = tasksCompleted;
        if (successElement) successElement.textContent = successRate + '%';

        alert('Agents refreshed!');
    },

    optimizeAll() {
        console.log('Optimizing all agents...');
        alert('All agents optimized!');
    },

    viewLogs() {
        console.log('Viewing logs...');
        alert('Logs displayed!');
    }
};
