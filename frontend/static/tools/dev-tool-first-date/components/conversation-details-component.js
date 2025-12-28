
// ConversationDetailsComponent.js
// Encapsulates the conversation details for reuse

class ConversationDetailsComponent {
    destroyAllCharts() {
        if (this.chartInstances) {
            Object.values(this.chartInstances).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    try { chart.destroy(); } catch (e) { }
                }
            });
            this.chartInstances = {};
        }
    }

    destroy() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            this._refreshInterval = null;
        }
        this.destroyAllCharts();
    }

    static _instanceCounter = 0;
    constructor(container, conversation) {
        this._instanceId = 'cdcomp-' + (++ConversationDetailsComponent._instanceCounter);
        this.container = container;
        this.conversation = conversation;
        this.messages = [];
        this.detailsEl = container;
        this.memberProfiles = {};
        this.currentTab = 'details';
        this.chartInstances = {}; // Make chartInstances an instance property
        // this.destroyAllCharts(); // Ensure no lingering charts from previous popups
        this.fetchAndRenderMessages();
        // Only set interval once
        if (!this._refreshInterval) {
            this._refreshInterval = setInterval(() => this.refreshGraphData(), 5000);
        }
    }

    async refreshGraphData() {
        console.log('[ConversationDetailsComponent] Polling API for graph data...');
        // Always fetch latest messages
        const res = await fetch('/api/dev-tool-first-date/conversation_messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: this.conversation.conversation_id })
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            // Save previous members/keys
            const prevFeedback = this.parseFeedbackData();
            const prevMembers = prevFeedback.members.join(',');
            const prevKeys = prevFeedback.keys.join(',');
            this.messages = data.messages;
            const newFeedback = this.parseFeedbackData();
            const newMembers = newFeedback.members.join(',');
            const newKeys = newFeedback.keys.join(',');
            // If members or keys changed, re-render the tab
            if (prevMembers !== newMembers || prevKeys !== newKeys) {
                // Find the active tab and re-populate it
                const tabset = this.container.querySelector('.first-date-profile-tabset');
                if (tabset) {
                    // Get active tab index
                    const activeTab = tabset.querySelector('.tab.active');
                    if (activeTab) {
                        const tabName = activeTab.textContent.trim();
                        if (tabName.includes('By Members')) {
                            this.populateFeedbackByMembers(tabset.querySelector('.tab-content'));
                        } else if (tabName.includes('By Metrics')) {
                            this.populateFeedbackByMetrics(tabset.querySelector('.tab-content'));
                        }
                    }
                }
            } else {
                // Otherwise, just update the charts
                this.updateFeedbackByMembersGraphs(true);
                this.updateFeedbackByMetricsGraphs(true);
            }
        }
    }

    updateFeedbackByMembersGraphs(allowCreate = false) {
        const feedbackData = this.parseFeedbackData();
        feedbackData.members.forEach(member => {
            const canvasId = `${this._instanceId}-graph-member-${member.replace(/\s+/g, '-')}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const chart = this.chartInstances[canvasId];
            const data = feedbackData.points.filter(p => p.member === member);
            if (chart) {
                // For each key, update the corresponding dataset
                feedbackData.keys.forEach(key => {
                    const points = data.filter(d => d.key === key);
                    const dataset = chart.data.datasets.find(ds => ds.label === key);
                    if (dataset) {
                        dataset.data = points.map(p => ({ x: p.time, y: p.value }));
                    }
                });
                chart.update();
            } else if (allowCreate) {
                this.drawLineGraph(canvas, data, feedbackData.keys, 'key');
            }
        });
    }

    updateFeedbackByMetricsGraphs(allowCreate = false) {
        const feedbackData = this.parseFeedbackData();
        feedbackData.keys.forEach(key => {
            const canvasId = `${this._instanceId}-graph-key-${key.replace(/\s+/g, '-')}`;
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const chart = this.chartInstances[canvasId];
            const data = feedbackData.points.filter(p => p.key === key);
            if (chart) {
                // For each member, update the corresponding dataset
                feedbackData.members.forEach(member => {
                    const points = data.filter(d => d.member === member);
                    const dataset = chart.data.datasets.find(ds => ds.label === member);
                    if (dataset) {
                        dataset.data = points.map(p => ({ x: p.time, y: p.value }));
                    }
                });
                chart.update();
            } else if (allowCreate) {
                this.drawLineGraph(canvas, data, feedbackData.members, 'member');
            }
        });
    }

    /**
     * Fetches the member profile for a given member_id using the backend API.
     * @param {number} memberId - The member's ID.
     * @returns {Promise<Object|null>} Resolves to the member profile object, or null if not found/error.
     */
    async getMemberProfile(memberId) {
        const resp = await fetch(`/api/dev-tool-first-date/members/${memberId}`);
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data.success && data.member) {
            return data.member;
        }
        return null;
    }

    async fetchAndRenderMessages() {
        const res = await fetch('/api/dev-tool-first-date/conversation_messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: this.conversation.conversation_id })
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
            this.messages = data.messages;
            this.render();
        } else {
            throw new Error('Failed to fetch messages for conversation');
        }
    }

    render() {
        // Create content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.className = 'first-date-conversation';

        // Conversation header (above tabset)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'first-date-conversation-header-top';
        headerDiv.innerHTML = `
                <div class="first-date-conversation-avatar-large">💬</div>
                <div class="first-date-conversation-info-main">
                    <h3>Conversation #${this.conversation.conversation_id}</h3>
                    <div class="first-date-conversation-meta-row">
                        <span class="date">${this.conversation.created_at ? new Date(this.conversation.created_at).toLocaleString() : ''}</span>
                    </div>
                </div>
            `;
        contentDiv.appendChild(headerDiv);

        // Create tabset
        const tabsetDiv = document.createElement('div');
        tabsetDiv.className = 'first-date-profile-tabset';
        contentDiv.appendChild(tabsetDiv);
        const tabs = [
            { name: 'ℹ️ Details', populateFunc: this.populateDetailsTab.bind(this) },
            { name: '💬 Messages', populateFunc: this.populateMessagesTab.bind(this) },
            { name: '👤 By Members', populateFunc: this.populateFeedbackByMembers.bind(this) },
            { name: '📊 By Metrics', populateFunc: this.populateFeedbackByMetrics.bind(this) }
        ];
        // Use a unique storageKey per conversation
        const storageKey = `conversation-tabset`;
        new window.TabsetComponent(tabsetDiv, tabs, storageKey);
        this.container.innerHTML = '';
        this.container.appendChild(contentDiv);
        return;
    }

    // Store chart instances for cleanup
    chartInstances = {};

    populateFeedbackByMembers(c) {
        const feedbackData = this.parseFeedbackData();
        let html = '<div style="display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding: 20px; gap: 20px;">';
        if (feedbackData.members.length > 0) {
            feedbackData.members.forEach(member => {
                const canvasId = `${this._instanceId}-graph-member-${member.replace(/\s+/g, '-')}`;
                html += `
                    <div style="flex-shrink: 0; margin-bottom: 20px;">
                        <h4 class="graph-title">📉 ${member}</h4>
                        <div style="position: relative; height: 240px; width: 100%;">
                            <canvas id="${canvasId}"></canvas>
                        </div>
                    </div>
                `;
            });
        }
        html += '</div>';
        c.innerHTML = html;
        setTimeout(() => {
            feedbackData.members.forEach(member => {
                const canvasId = `${this._instanceId}-graph-member-${member.replace(/\s+/g, '-')}`;
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;
                // For this member, show a line for each key (metric)
                const data = feedbackData.points.filter(p => p.member === member);
                this.drawLineGraph(canvas, data, feedbackData.keys, 'key');
            });
        }, 100);
    }

    populateFeedbackByMetrics(c) {
        const feedbackData = this.parseFeedbackData();
        // 2x2 grid for up to 4 metrics
        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 340px; gap: 20px; padding: 20px;">';
        feedbackData.keys.forEach((key, idx) => {
            const canvasId = `${this._instanceId}-graph-key-${key.replace(/\s+/g, '-')}`;
            html += `
                <div style="display: flex; flex-direction: column; align-items: stretch; height: 100%;">
                    <h4 class="graph-title" style="margin-bottom: 8px;">📉 ${key}</h4>
                    <div style="position: relative; flex: 1;">
                        <canvas id="${canvasId}" style="width: 100%; height: 100%;"></canvas>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        c.innerHTML = html;
        setTimeout(() => {
            feedbackData.keys.forEach(key => {
                const canvasId = `${this._instanceId}-graph-key-${key.replace(/\s+/g, '-')}`;
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;
                // For this key, show a line for each member
                const data = feedbackData.points.filter(p => p.key === key);
                this.drawLineGraph(canvas, data, feedbackData.members, 'member');
            });
        }, 100);
    }

    parseFeedbackData() {
        const data = { members: [], keys: [], points: [] };
        // Use conversation members as source of truth if available
        if (this.conversation && Array.isArray(this.conversation.members)) {
            this.conversation.members.forEach(m => {
                const name = m.member_nick_name || m.name || 'Unknown';
                if (!data.members.includes(name)) data.members.push(name);
            });
        }
        if (!this.messages) return data;
        this.messages.forEach(msg => {
            const member = msg.member_nick_name || msg.name || 'Unknown';
            if (!data.members.includes(member)) data.members.push(member);
            const time = new Date(msg.created_at || msg.timestamp || Date.now());
            Object.entries(msg.feedback).forEach(([key, value]) => {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    if (!data.keys.includes(key)) data.keys.push(key);
                    data.points.push({ member, key, value: numValue, time });
                }
            });
        });
        return data;
    }

    drawLineGraph(canvas, data, labels, labelType) {
        if (!window.Chart || !canvas) return;
        // If chart already exists, just update its datasets
        if (this.chartInstances[canvas.id]) {
            const chart = this.chartInstances[canvas.id];
            // Update datasets
            if (labelType === 'key') {
                labels.forEach(key => {
                    const points = data.filter(d => d.key === key);
                    const dataset = chart.data.datasets.find(ds => ds.label === key);
                    if (dataset) {
                        dataset.data = points.map(p => ({ x: p.time, y: p.value }));
                    }
                });
            } else if (labelType === 'member') {
                labels.forEach(member => {
                    const points = data.filter(d => d.member === member);
                    const dataset = chart.data.datasets.find(ds => ds.label === member);
                    if (dataset) {
                        dataset.data = points.map(p => ({ x: p.time, y: p.value }));
                    }
                });
            }
            chart.update();
            return;
        }
        // Otherwise, create chart as before
        const datasets = [];
        if (labelType === 'key') {
            labels.forEach(key => {
                const points = data.filter(d => d.key === key);
                datasets.push({
                    label: key,
                    data: points.map(p => ({ x: p.time, y: p.value })),
                    fill: false,
                    borderColor: this.getColorForLabel(key),
                    tension: 0.1
                });
            });
        } else if (labelType === 'member') {
            labels.forEach(member => {
                const points = data.filter(d => d.member === member);
                datasets.push({
                    label: member,
                    data: points.map(p => ({ x: p.time, y: p.value })),
                    fill: false,
                    borderColor: this.getColorForLabel(member),
                    tension: 0.1
                });
            });
        }
        this.chartInstances[canvas.id] = new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            padding: 10,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-card-background').trim(),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--color-text-dark').trim(),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-border-light').trim(),
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        displayColors: true
                    }
                },
                scales: {
                    x: { type: 'time', time: { unit: 'minute' }, title: { display: true, text: 'Time' } },
                    y: {
                        title: { display: true, text: 'Value' },
                        min: 0,
                        max: 10
                    }
                }
            }
        });
    }

    getColorForLabel(label) {
        // Expanded color palette for more variety
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1',
            '#e83e8c', '#fd7e14', '#20c997', '#6610f2', '#6c757d', '#343a40',
            '#ff6f00', '#00bcd4', '#8bc34a', '#ff9800', '#795548', '#607d8b',
            '#b71c1c', '#1b5e20', '#0d47a1', '#4a148c', '#fbc02d', '#388e3c',
            '#c51162', '#009688', '#f44336', '#3f51b5', '#9c27b0', '#e91e63',
            '#2196f3', '#4caf50', '#ffeb3b', '#ff5722', '#673ab7', '#00e676',
            '#ff1744', '#00bfae', '#aeea00', '#ffd600', '#ffab00', '#a1887f',
            '#90a4ae', '#bdbdbd', '#212121', '#ffb300', '#43a047', '#3949ab',
            '#d50000', '#00c853', '#ff4081', '#536dfe', '#c6ff00', '#ff9100',
            '#ff5252', '#448aff', '#69f0ae', '#ea80fc', '#b388ff', '#ff8a80'
        ];
        // Improved hash: djb2 algorithm for better distribution
        let hash = 5381;
        for (let i = 0; i < label.length; i++) {
            hash = ((hash << 5) + hash) + label.charCodeAt(i); // hash * 33 + c
        }
        return colors[Math.abs(hash) % colors.length];
    }



    populateMessagesTab(c) {
        if (!this.messages || this.messages.length === 0) {
            container.innerHTML = '<p>No messages yet.</p>';
            return;
        }
        c.innerHTML = '';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        this.messages.forEach(msg => {
            const li = document.createElement('li');
            li.style.marginBottom = '12px';
            li.style.padding = '8px';
            li.style.background = 'var(--color-card-background)';
            li.style.borderRadius = '6px';
            li.style.border = '1px solid var(--color-border-light)';
            li.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.9em; color:var(--color-text-secondary);">
                    <span style="font-weight:600; color:var(--color-text-primary);">${msg.member_nick_name}</span>
                    <span>${new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <div style="white-space: pre-wrap; margin-top: 8px;">${msg.message_text}</div>
            `;
            ul.appendChild(li);
        });
        c.appendChild(ul);
    }

    populateDetailsTab(c) {
        // Calculate message counts per member
        const memberCounts = {};
        this.messages.forEach(msg => {
            const member = msg.member_nick_name;
            memberCounts[member] = (memberCounts[member] || 0) + 1;
        });
        // Calculate conversation duration
        let duration = 'N/A';
        if (this.messages.length > 0) {
            const firstMsg = new Date(this.messages[0].created_at);
            const lastMsg = new Date(this.messages[this.messages.length - 1].created_at);
            const diffMs = lastMsg - firstMsg;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const remainingMins = diffMins % 60;
            const remainingSecs = diffSecs % 60;
            if (diffHours > 0) {
                duration = `${diffHours}h ${remainingMins}m:${remainingSecs}s`;
            } else if (diffMins > 0) {
                duration = `${diffMins}m:${remainingSecs}s`;
            } else {
                duration = `${diffSecs}s`;
            }
        }
        // Build member tags with message counts
        const memberTags = (this.conversation.members || []).map(member => {
            const name = member.member_nick_name;
            const count = memberCounts[name] || 0;
            return `<span class="first-date-member-tag">${name} <span class="message-count">(${count})</span></span>`;
        }).join('');
        const detailsHTML = `
            <div class="details-section">
                <h3>📋 Overview</h3>
                <div class="detail-item">
                    <span class="detail-label">Conversation ID:</span>
                    <span class="detail-value">#${this.conversation.conversation_id}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${this.conversation.created_at ? new Date(this.conversation.created_at).toLocaleString() : ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Total Messages:</span>
                    <span class="detail-value">${this.messages.length}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${duration}</span>
                </div>
            </div>
            <div class="details-section">
                <h3>👥 Participants</h3>
                <div class="first-date-members-tags">
                    ${memberTags}
                </div>
            </div>
        `;
        c.innerHTML = detailsHTML;
    }

    // Player controls (play, pause, next, prev)
    // Voice control logic removed; handled by ConversationVoiceControlComponent

    highlightMessage(index) {
        const listItems = this.container.querySelectorAll('.first-date-conversation-body li');
        listItems.forEach((li, i) => {
            if (i === index) {
                li.style.border = '2px solid var(--color-primary-accent)';
                li.style.background = 'var(--color-highlight)';
                li.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                li.style.border = '1px solid var(--color-border-light)';
                li.style.background = 'var(--color-card-background)';
            }
        });
    }
}

window.ConversationDetailsComponent = ConversationDetailsComponent;
