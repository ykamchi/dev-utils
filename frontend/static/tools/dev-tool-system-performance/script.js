/**
 * Dev Tool System Performance - Frontend JavaScript
 * Handles loading and displaying system performance metrics
 */
window.tool_script = {
    container: null,
    pollingIntervalId: null,
    cpuHistory: [],
    cpuChart: null,
    memoryChart: null,
    MAX_DATA_POINTS: 60, // Keep 60 data points (3 minutes at 5-second intervals)
    POLLING_INTERVAL: 1000, // Update every 5 seconds
    memoryChartColors: [
        'var(--color-primary-accent)',
        'var(--color-secondary-accent)',
        'var(--color-highlight)',
        'var(--color-warning-error)',
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
    ],

    // Initialize the tool
    async init(container) {
        console.log('[Dev Tool System Performance] Initializing...');

        // Store container reference
        this.container = container;

        try {
            // Load Chart.js first
            await this.loadChartJS();

            // Listen for unload to clean up
            window.addEventListener('beforeunload', () => this.destroy(container));

            // Fetch and show initial system info
            const info = await this.fetchInfo();
            this.showInfo(info);

            // Start polling for memory usage updates
            this.startPolling();
        } catch (error) {
            console.error('Error loading system performance:', error);
            this.showError(error.message);
        }
    },

    // Cleanup function - called when the tool is unloaded
    destroy(container) {
        console.log('[System Performance Tool] Destroying system performance tool...');
        
        // Stop polling for data first
        this.stopPolling();

        // Destroy Chart.js instances
        if (this.cpuChart) {
            this.cpuChart.destroy();
            this.cpuChart = null;
        }
        if (this.memoryChart) {
            this.memoryChart.destroy();
            this.memoryChart = null;
        }

        // Remove the event listener
        window.removeEventListener('beforeunload', () => this.destroy(container));
    },

    /**
     * Load Chart.js library if not already loaded
     */
    loadChartJS() {
        return new Promise((resolve, reject) => {
            // Check if Chart.js is already loaded
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }

            // Load Chart.js from CDN (latest stable version)
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => {
                // Register center text plugin
                Chart.register({
                    id: 'centerText',
                    beforeDraw: function(chart) {
                        if (chart.config.options.plugins &&
                            chart.config.options.plugins.centerText &&
                            chart.config.options.plugins.centerText.display) {
                            const { ctx, chartArea: { left, right, top, bottom, width, height } } = chart;
                            ctx.save();

                            const centerX = (left + right) / 2;
                            const centerY = (top + bottom) / 2;

                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';

                            const text = chart.config.options.plugins.centerText.text;
                            const lines = text.split('\n');

                            // Main title
                            ctx.font = 'bold 14px Arial';
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.fillText(lines[0], centerX, centerY - 6);

                            // Value
                            if (lines[1]) {
                                ctx.font = 'bold 18px Arial';
                                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                                ctx.fillText(lines[1], centerX, centerY + 12);
                            }

                            ctx.restore();
                        }
                    }
                });
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Chart.js'));
            document.head.appendChild(script);
        });
    },

    /**
     * Start polling for updates every 5 seconds
     */
    startPolling() {
        // Clear any existing interval first
        this.stopPolling();

        // Poll immediately
        this.update();

        // Start new polling interval
        this.pollingIntervalId = setInterval(() => {
            this.update();
        }, this.POLLING_INTERVAL);
    },

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingIntervalId) {
            clearInterval(this.pollingIntervalId);
            this.pollingIntervalId = null;
        }
    },

    /**
     * Update function - called by polling to refresh data
     */
    async update() {
        try {
            const data = await this.fetchData();
            this.showData(data);
        } catch (error) {
            console.error('Error updating system performance:', error);
            this.showError(error.message);
        }
    },

    /**
     * Fetch system info from the server
     */
    async fetchInfo() {
        const response = await fetch('/api/dev-tool-system-performance/info');

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load system information');
        }

        return result.data;
    },

    /**
     * Display system info in the GUI
     */
    showInfo(info) {
        // Update system stats cards
        this.updateStatCard('cpu', info.system_stats.cpu.usage_percent, info.system_stats.cpu.core_count);
        this.updateStatCard('memory', info.system_stats.memory.usage_percent,
                       `${info.system_stats.memory.used_gb} / ${info.system_stats.memory.total_gb} GB`);
        this.updateStatCard('disk', info.system_stats.disk.usage_percent,
                       `${info.system_stats.disk.used_gb} / ${info.system_stats.disk.total_gb} GB`);

        // Add CPU data point to history for graphing
        this.addCpuDataPoint(info.system_stats.cpu.usage_percent);

        // Update system info grid
        this.updateSystemInfo(info.system_info);

        // Show content
        this.showContent(true);
    },

    /**
     * Fetch all required data from the server (memory usage and CPU stats for polling)
     */
    async fetchData() {
        const response = await fetch('/api/dev-tool-system-performance/memory-usage');

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load memory usage');
        }

        // Also fetch current CPU stats for the chart
        try {
            const cpuResponse = await fetch('/api/dev-tool-system-performance/info');
            if (cpuResponse.ok) {
                const cpuResult = await cpuResponse.json();
                if (cpuResult.success) {
                    result.data.system_stats = cpuResult.data.system_stats;
                }
            }
        } catch (error) {
            console.warn('Could not fetch CPU stats for update:', error);
        }

        return result.data;
    },

    /**
     * Display data in the GUI elements (memory usage and CPU stats for polling updates)
     */
    showData(memoryUsage) {
        // Update memory usage data
        this.updateMemoryPieChart(memoryUsage);
        this.updateCpuAppsList(memoryUsage);

        // Update CPU chart with new data point
        if (memoryUsage.system_stats && memoryUsage.system_stats.cpu) {
            this.addCpuDataPoint(memoryUsage.system_stats.cpu.usage_percent);
        }

        // Update stat cards with current values
        if (memoryUsage.system_stats) {
            const stats = memoryUsage.system_stats;
            if (stats.cpu) {
                this.updateStatCard('cpu', stats.cpu.usage_percent, stats.cpu.core_count);
            }
            if (stats.memory) {
                this.updateStatCard('memory', stats.memory.usage_percent,
                              `${stats.memory.used_gb} / ${stats.memory.total_gb} GB`);
            }
            if (stats.disk) {
                this.updateStatCard('disk', stats.disk.usage_percent,
                              `${stats.disk.used_gb} / ${stats.disk.total_gb} GB`);
            }
        }
    },

    /**
     * Update a stat card with new values
     */
    updateStatCard(type, percentage, detail) {
        const usageElement = document.getElementById(`${type}Usage`);
        const progressElement = document.getElementById(`${type}Progress`);
        const detailElement = document.getElementById(`${type}Cores`) ||
                             document.getElementById(`${type}Details`);

        if (usageElement) this.animateValue(usageElement, percentage);
        if (progressElement) this.animateProgressBar(progressElement, percentage);
        if (detailElement) detailElement.textContent = detail;
    },

    /**
     * Animate a numeric value
     */
    animateValue(element, value) {
        if (!element) return;
        let start = parseFloat(element.textContent) || 0;
        let end = Math.round(value);
        let duration = 500;
        let startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            let progress = Math.min((timestamp - startTime) / duration, 1);
            let current = Math.round(start + (end - start) * progress);
            element.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    },

    /**
     * Animate a progress bar
     */
    animateProgressBar(element, value) {
        if (!element) return;
        element.style.setProperty('--progress-width', `${value}%`);
    },

    /**
     * Update system info grid
     */
    updateSystemInfo(info) {
        const grid = document.getElementById('systemInfoGrid');
        if (!grid) return;

        grid.innerHTML = '';
        for (const key in info) {
            const card = document.createElement('div');
            card.className = 'system-info-card';
            card.innerHTML = `<span class="info-label">${key.replace('_', ' ')}:</span> <span class="info-value">${info[key]}</span>`;
            grid.appendChild(card);
        }
    },

    /**
     * Add CPU data point to history and update graph
     */
    addCpuDataPoint(percentage) {
        const timestamp = Date.now();
        this.cpuHistory.push({ value: percentage, timestamp: timestamp });

        // Keep only the last MAX_DATA_POINTS
        if (this.cpuHistory.length > this.MAX_DATA_POINTS) {
            this.cpuHistory.shift();
        }

        this.updateCpuGraph();
    },

    /**
     * Get color based on CPU usage percentage
     */
    getCpuColor(percentage) {
        if (percentage <= 2) {
            return '#10B981'; // GOOD - Green
        } else if (percentage <= 20) {
            return '#F59E0B'; // STABLE - Yellow/Orange
        } else if (percentage <= 60) {
            return '#F97316'; // WARNING - Orange
        } else {
            return '#EF4444'; // CRITICAL - Red
        }
    },

    /**
     * Update CPU usage graph using Chart.js
     */
    updateCpuGraph() {
        const canvas = document.getElementById('cpuGraph');
        if (!canvas || this.cpuHistory.length === 0) return;

        const ctx = canvas.getContext('2d');

        // Prepare data for Chart.js
        const labels = this.cpuHistory.map((_, index) => {
            const secondsAgo = (this.cpuHistory.length - 1 - index) * (this.POLLING_INTERVAL / 1000);
            if (secondsAgo < 60) {
                return `${secondsAgo}s ago`;
            } else {
                return `${Math.floor(secondsAgo / 60)}m ago`;
            }
        });

        const data = this.cpuHistory.map(point => point.value);

        // Create or update chart
        if (!this.cpuChart) {
            this.cpuChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'CPU Usage',
                        data: data,
                        borderColor: '#10B981', // Default color
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Default fill color
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderWidth: 3,
                        shadowColor: 'rgba(0, 0, 0, 0.1)',
                        shadowBlur: 10,
                        segment: {
                            borderColor: function(context) {
                                const value = context.p1.parsed.y;
                                return this.getCpuColor(value);
                            }.bind(this),
                            backgroundColor: function(context) {
                                const value = context.p1.parsed.y;
                                const color = this.getCpuColor(value);
                                const r = parseInt(color.slice(1, 3), 16);
                                const g = parseInt(color.slice(3, 5), 16);
                                const b = parseInt(color.slice(5, 7), 16);
                                return `rgba(${r}, ${g}, ${b}, 0.1)`;
                            }.bind(this)
                        }
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 2.5,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'var(--color-card-background)',
                            titleColor: 'var(--color-text-primary)',
                            bodyColor: 'var(--color-text-primary)',
                            borderColor: 'var(--color-border)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                title: function(context) {
                                    return `Time: ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `CPU Usage: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color: 'var(--color-border)',
                                opacity: 0.3,
                                drawBorder: false
                            },
                            ticks: {
                                color: 'var(--color-text-secondary)',
                                font: {
                                    size: 11,
                                    weight: '500'
                                },
                                maxTicksLimit: 8,
                                padding: 10
                            },
                            border: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'var(--color-border)',
                                opacity: 0.3,
                                drawBorder: false
                            },
                            ticks: {
                                color: 'var(--color-text-secondary)',
                                font: {
                                    size: 11,
                                    weight: '500'
                                },
                                callback: function(value) {
                                    return value + '%';
                                },
                                padding: 10,
                                stepSize: 25
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    elements: {
                        point: {
                            hoverBorderWidth: 3
                        }
                    }
                }
            });
        } else {
            // Update existing chart data
            this.cpuChart.data.labels = labels;
            this.cpuChart.data.datasets[0].data = data;
            this.cpuChart.update('active'); // Smooth update with animation
        }
    },

    /**
     * Update memory usage pie chart using Chart.js
     */
    updateMemoryPieChart(memoryData) {
        const canvas = document.getElementById('memoryPieChart');
        const legend = document.getElementById('memoryLegend');
        const appsList = document.getElementById('appsList');

        if (!canvas || !legend || !appsList) return;

        const processes = memoryData.processes || [];
        if (processes.length === 0) return;

        // Clear previous content for legend and apps list
        legend.innerHTML = '';
        appsList.innerHTML = '';

        // Update top apps list (show top 10, excluding "Others" if it exists)
        const topApps = processes.filter(proc => proc.name !== 'Others').slice(0, 10);

        topApps.forEach((app, index) => {
            const appItem = document.createElement('div');
            appItem.className = 'app-item';

            const appName = document.createElement('div');
            appName.className = 'app-name';
            appName.textContent = app.name;

            const appStats = document.createElement('div');
            appStats.className = 'app-stats';

            const appMemory = document.createElement('div');
            appMemory.className = 'app-memory';
            appMemory.textContent = `${app.memory_mb.toFixed(1)} MB`;

            const appCpu = document.createElement('div');
            appCpu.className = 'app-cpu';
            appCpu.textContent = `${app.cpu_percent.toFixed(1)}%`;

            appStats.appendChild(appMemory);
            appStats.appendChild(appCpu);

            appItem.appendChild(appName);
            appItem.appendChild(appStats);

            appsList.appendChild(appItem);
        });

        const ctx = canvas.getContext('2d');

        // Prepare data for Chart.js
        const chartData = processes.map(process => process.percentage);
        const chartLabels = processes.map(process => process.name);

        // Create enhanced color scheme with gradients
        const createGradient = (ctx, color1, color2) => {
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            return gradient;
        };

        const enhancedColors = [
            ['#FF6B6B', '#FF4757'], // Red gradient
            ['#4ECDC4', '#26D0CE'], // Teal gradient
            ['#45B7D1', '#3498DB'], // Blue gradient
            ['#96CEB4', '#68C3A3'], // Green gradient
            ['#FFEAA7', '#FDCB6E'], // Yellow gradient
            ['#DDA0DD', '#BA68C8'], // Purple gradient
            ['#FFB142', '#FFA726'], // Orange gradient
            ['#74B9FF', '#0984E3'], // Light blue gradient
            ['#A29BFE', '#6C5CE7'], // Lavender gradient
            ['#FD79A8', '#E84393'], // Pink gradient
            ['#00B894', '#00A085'], // Mint gradient
            ['#E17055', '#D63031'], // Coral gradient
            ['#81ECEC', '#00CEC9'], // Cyan gradient
            ['#FDCB6E', '#E17055'], // Peach gradient
            ['#6C5CE7', '#A29BFE']  // Indigo gradient
        ];

        // Create or update chart
        if (!this.memoryChart) {
            const chartColors = processes.map((_, index) => {
                const [color1, color2] = enhancedColors[index % enhancedColors.length];
                return createGradient(ctx, color1, color2);
            });

            this.memoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        data: chartData,
                        backgroundColor: chartColors,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 2,
                        hoverBorderWidth: 4,
                        hoverBorderColor: 'rgba(255, 255, 255, 0.8)',
                        hoverOffset: 12,
                        shadowOffsetX: 0,
                        shadowOffsetY: 4,
                        shadowBlur: 12,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1,
                    animation: {
                        duration: 1500,
                        easing: 'easeOutQuart',
                        animateRotate: true,
                        animateScale: true
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                            borderWidth: 1,
                            cornerRadius: 12,
                            displayColors: true,
                            boxPadding: 8,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                title: function(context) {
                                    return context[0].label;
                                },
                                label: function(context) {
                                    const process = processes[context.dataIndex];
                                    return [
                                        `Memory: ${process.memory_mb.toFixed(1)} MB`,
                                        `CPU: ${process.cpu_percent.toFixed(1)}%`,
                                        `Usage: ${process.percentage}%`
                                    ];
                                },
                                labelColor: function(context) {
                                    return {
                                        borderColor: 'rgba(255, 255, 255, 0.8)',
                                        backgroundColor: chartColors[context.dataIndex]
                                    };
                                }
                            }
                        },
                        // Add center text plugin
                        centerText: {
                            display: true,
                            text: `Total\n${processes.reduce((sum, p) => sum + p.memory_mb, 0).toFixed(1)} MB`
                        }
                    },
                    cutout: '70%',
                    elements: {
                        arc: {
                            borderRadius: 8,
                            borderWidth: 2,
                            hoverBorderRadius: 12
                        }
                    },
                    onHover: function(event, elements) {
                        event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                    }
                }
            });
        } else {
            // Update existing chart data - need to recreate gradients with current context
            const chartColors = processes.map((_, index) => {
                const [color1, color2] = enhancedColors[index % enhancedColors.length];
                return createGradient(ctx, color1, color2);
            });

            this.memoryChart.data.labels = chartLabels;
            this.memoryChart.data.datasets[0].data = chartData;
            this.memoryChart.data.datasets[0].backgroundColor = chartColors;
            this.memoryChart.update('active');
        }

        // Create custom legend
        processes.forEach((process, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';

            const colorBox = document.createElement('div');
            colorBox.className = 'legend-color';
            colorBox.style.backgroundColor = this.memoryChartColors[index % this.memoryChartColors.length];

            const nameSpan = document.createElement('span');
            nameSpan.className = 'legend-name';
            nameSpan.textContent = process.name;

            const memorySpan = document.createElement('span');
            memorySpan.className = 'legend-memory';
            memorySpan.textContent = `${process.memory_mb.toFixed(1)} MB (${process.percentage}%)`;

            legendItem.appendChild(colorBox);
            legendItem.appendChild(nameSpan);
            legendItem.appendChild(memorySpan);

            legend.appendChild(legendItem);
        });
    },

    /**
     * Update CPU apps list
     */
    updateCpuAppsList(memoryData) {
        const cpuAppsList = document.getElementById('cpuAppsList');

        if (!cpuAppsList) return;

        // Clear previous content
        cpuAppsList.innerHTML = '';

        const processes = memoryData.processes || [];
        if (processes.length === 0) return;

        // Sort by CPU usage and get top 10 (excluding "Others" if it exists)
        const sortedByCpu = processes
            .filter(proc => proc.name !== 'Others')
            .sort((a, b) => b.cpu_percent - a.cpu_percent)
            .slice(0, 10);

        sortedByCpu.forEach((app, index) => {
            const appItem = document.createElement('div');
            appItem.className = 'cpu-app-item';

            const appName = document.createElement('div');
            appName.className = 'cpu-app-name';
            appName.textContent = app.name;

            const appStats = document.createElement('div');
            appStats.className = 'cpu-app-stats';

            const appMemory = document.createElement('div');
            appMemory.className = 'cpu-app-memory';
            appMemory.textContent = `${app.memory_mb.toFixed(1)} MB`;

            const appCpu = document.createElement('div');
            appCpu.className = 'cpu-app-cpu';
            appCpu.textContent = `${app.cpu_percent.toFixed(1)}%`;

            appStats.appendChild(appMemory);
            appStats.appendChild(appCpu);

            appItem.appendChild(appName);
            appItem.appendChild(appStats);

            cpuAppsList.appendChild(appItem);
        });
    },

    /**
     * Show content
     */
    showContent(container) {
        const content = document.getElementById('infoContent');
        if (content) {
            content.style.display = 'block';
        }
    },

    /**
     * Show error message
     */
    showError(msg) {
        // For now, just log to console. Could be enhanced to show in UI
        console.error('System Performance Error:', msg);
    }
};
