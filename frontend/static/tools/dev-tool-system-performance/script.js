/**
 * Dev Tool System Info - Frontend JavaScript
 * Handles loading and displaying system info and server stats
 */

// Prevent multiple script executions
if (window.systemInfoScriptLoaded && !window.isInitialLoad_systemInfo) {
    // Script already loaded and tool is active, skip initialization
} else {
    window.systemInfoScriptLoaded = true;

    // Clean up any existing polling from previous loads
    if (window.pollingIntervalId_systemInfo) {
        clearInterval(window.pollingIntervalId_systemInfo);
        window.pollingIntervalId_systemInfo = null;
    }

// Prevent multiple initialization
if (typeof window.isInitialLoad_systemInfo === 'undefined') {
    window.isInitialLoad_systemInfo = true;
}

// Polling management
window.pollingIntervalId_systemInfo = window.pollingIntervalId_systemInfo || null;

function startPolling() {
    // Clear any existing interval first
    stopPolling();
    
    // Start new polling interval
    window.pollingIntervalId_systemInfo = setInterval(() => {
        loadSystemInfo();
        loadMemoryUsage();
        loadCpuUsage();
    }, 3000);
}

function stopPolling() {
    if (window.pollingIntervalId_systemInfo) {
        clearInterval(window.pollingIntervalId_systemInfo);
        window.pollingIntervalId_systemInfo = null;
    }
}

// Cleanup function - called when tool is unloaded
function cleanupSystemInfoTool() {
    stopPolling();
    // Reset flags for next tool load
    window.isInitialLoad_systemInfo = true;
    window.systemInfoScriptLoaded = false;
}

// Set up cleanup when tool container is removed
function setupCleanupObserver() {
    // Find the tool container
    const toolContainer = document.querySelector('.tool-container[data-tool-name="dev-tool-system-performance"]');
    if (!toolContainer) return;
    
    // Create mutation observer to watch for removal
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node === toolContainer || node.contains(toolContainer)) {
                    cleanupSystemInfoTool();
                    observer.disconnect();
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Also clean up on page unload
    window.addEventListener('beforeunload', cleanupSystemInfoTool);
}
let cpuHistory = []; // Store CPU usage history for graphing
const MAX_DATA_POINTS = 60; // Keep 60 data points (3 minutes at 3-second intervals)

// CPU Graph functions
function addCpuDataPoint(percentage) {
    const timestamp = Date.now();
    cpuHistory.push({ value: percentage, timestamp: timestamp });

    // Keep only the last MAX_DATA_POINTS
    if (cpuHistory.length > MAX_DATA_POINTS) {
        cpuHistory.shift();
    }

    updateCpuGraph();
}

function updateCpuGraph() {
    const svg = document.getElementById('cpuGraph');
    if (!svg || cpuHistory.length === 0) return;

    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Clear previous content
    const gridGroup = svg.querySelector('#cpuGrid');
    const lineElement = svg.querySelector('#cpuLine');
    const areaElement = svg.querySelector('#cpuArea');
    const pointsGroup = svg.querySelector('#cpuDataPoints');

    // Draw grid
    drawGrid(gridGroup, width, height, padding);

    // Scale data to fit graph
    const maxValue = 100; // CPU percentage max
    const minValue = 0;

    // Create points for the line
    const points = cpuHistory.map((point, index) => {
        const x = padding.left + (index / Math.max(cpuHistory.length - 1, 1)) * graphWidth;
        const y = padding.top + (1 - point.value / maxValue) * graphHeight;
        return { x, y, value: point.value };
    });

    // Draw area fill
    if (points.length > 1) {
        const areaPoints = [
            { x: padding.left, y: height - padding.bottom },
            ...points,
            { x: points[points.length - 1].x, y: height - padding.bottom }
        ];

        const areaPath = areaPoints.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ') + ' Z';

        areaElement.setAttribute('points', areaPoints.map(p => `${p.x},${p.y}`).join(' '));
    }

    // Draw line
    if (points.length > 1) {
        const linePath = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');
        lineElement.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    }

    // Draw data points
    pointsGroup.innerHTML = '';
    points.forEach((point, index) => {
        if (index % 10 === 0 || index === points.length - 1) { // Show every 10th point and last point
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '3');
            circle.setAttribute('fill', 'var(--color-primary-accent)');
            circle.setAttribute('stroke', 'var(--color-card-background)');
            circle.setAttribute('stroke-width', '2');
            pointsGroup.appendChild(circle);
        }
    });
}

function drawGrid(gridGroup, width, height, padding) {
    gridGroup.innerHTML = '';

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Horizontal grid lines (percentage)
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i * graphHeight) / 4;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - padding.right);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', 'var(--color-border)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0.3');
        gridGroup.appendChild(line);

        // Add percentage labels
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', padding.left - 10);
        label.setAttribute('y', y + 4);
        label.setAttribute('text-anchor', 'end');
        label.setAttribute('font-size', '10px');
        label.setAttribute('fill', 'var(--color-text-secondary)');
        label.textContent = `${100 - (i * 25)}%`;
        gridGroup.appendChild(label);
    }

    // Vertical grid lines (time)
    for (let i = 0; i <= 4; i++) {
        const x = padding.left + (i * graphWidth) / 4;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', padding.top);
        line.setAttribute('x2', x);
        line.setAttribute('y2', height - padding.bottom);
        line.setAttribute('stroke', 'var(--color-border)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', '0.3');
        gridGroup.appendChild(line);
    }
}

// Load system information from server
async function loadSystemInfo() {
    // Check if required elements exist
    const infoContent = document.getElementById('infoContent');
    if (!infoContent) {
        return; // Tool not loaded yet
    }

    let wasInitialLoad = window.isInitialLoad_systemInfo;

    try {
        // Only show loading on initial load, not on polling updates
        if (window.isInitialLoad_systemInfo) {
            showLoading(true);
        }
        hideError();

        // Only hide content on initial load, not on polling updates
        if (window.isInitialLoad_systemInfo) {
            hideContent();
        }

        // Call the system info API
        const response = await fetch('/api/dev-tool-system-performance/info', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Failed to load system information');
        }
        displaySystemInfo(result.data);
        loadMemoryUsage(); // Load memory usage data for pie chart
        loadCpuUsage(); // Load CPU usage data for apps list
        window.isInitialLoad_systemInfo = false; // Mark that initial load is complete
        
        // Start polling after initial load is complete
        startPolling();
    } catch (error) {
        console.error('Error loading system info:', error);
        showError(error.message);
    } finally {
        // Only hide loading if it was shown (on initial load)
        if (wasInitialLoad) {
            showLoading(false);
        }
    }
}

// Display the system information and stats
function displaySystemInfo(data) {
    updateStatCard('cpu', data.system_stats.cpu.usage_percent, data.system_stats.cpu.core_count);
    updateStatCard('memory', data.system_stats.memory.usage_percent,
                   `${data.system_stats.memory.used_gb} / ${data.system_stats.memory.total_gb} GB`);
    updateStatCard('disk', data.system_stats.disk.usage_percent,
                   `${data.system_stats.disk.used_gb} / ${data.system_stats.disk.total_gb} GB`);

    // Add CPU data point to history for graphing
    addCpuDataPoint(data.system_stats.cpu.usage_percent);

    // Only update system info on initial load (it's static)
    if (window.isInitialLoad_systemInfo) {
        updateSystemInfo(data.system_info);
    }

    // Always show content when data is successfully loaded
    showContent(true);
}

function updateStatCard(type, percentage, detail) {
    const usageElement = document.getElementById(`${type}Usage`);
    const progressElement = document.getElementById(`${type}Progress`);
    const detailElement = document.getElementById(`${type}Cores`) ||
                         document.getElementById(`${type}Details`);

    if (usageElement) animateValue(usageElement, percentage);
    if (progressElement) animateProgressBar(progressElement, percentage);
    if (detailElement) detailElement.textContent = detail;
}

function animateValue(element, value) {
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
}

function animateProgressBar(element, value) {
    if (!element) return;
    // Use CSS custom property to animate the progress bar
    element.style.setProperty('--progress-width', `${value}%`);
}

function updateSystemInfo(info) {
    const grid = document.getElementById('systemInfoGrid');
    if (!grid) return;

    grid.innerHTML = '';
    for (const key in info) {
        const card = document.createElement('div');
        card.className = 'system-info-card';
        card.innerHTML = `<span class="info-label">${key.replace('_', ' ')}:</span> <span class="info-value">${info[key]}</span>`;
        grid.appendChild(card);
    }
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
}

// Memory Usage Pie Chart
let memoryChartColors = [
    'var(--color-primary-accent)',
    'var(--color-secondary-accent)',
    'var(--color-highlight-gold)',
    'var(--color-warning-error)',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
];

function loadMemoryUsage() {
    fetch('/api/dev-tool-system-performance/memory-usage')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMemoryPieChart(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading memory usage:', error);
        });
}

function loadCpuUsage() {
    fetch('/api/dev-tool-system-performance/memory-usage')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateCpuAppsList(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading CPU usage:', error);
        });
}

function updateMemoryPieChart(memoryData) {
    const svg = document.getElementById('memoryPieChart');
    const legend = document.getElementById('memoryLegend');
    const appsList = document.getElementById('appsList');
    
    if (!svg || !legend || !appsList) return;
    
    // Clear previous content
    svg.innerHTML = '';
    legend.innerHTML = '';
    appsList.innerHTML = '';
    
    const processes = memoryData.processes || [];
    if (processes.length === 0) return;
    
    // Update top apps list (show top 10, excluding "Others" if it exists)
    const topApps = processes.filter(proc => proc.name !== 'Others').slice(0, 10);
    
    topApps.forEach((app, index) => {
        const appItem = document.createElement('div');
        appItem.className = 'app-item';
        
        appItem.innerHTML = `
            <div class="app-name">${app.name}</div>
            <div class="app-stats">
                <div class="app-memory">${app.memory_mb.toFixed(1)} MB</div>
                <div class="app-cpu">${app.cpu_percent.toFixed(1)}%</div>
            </div>
        `;
        
        appsList.appendChild(appItem);
    });
    
    // Calculate pie chart (including "Others" for visualization)
    const centerX = 150;
    const centerY = 150;
    const radius = 120;
    
    let currentAngle = 0;
    
    processes.forEach((process, index) => {
        const percentage = process.percentage;
        const angle = (percentage / 100) * 360;
        
        if (percentage < 1) return; // Skip very small slices
        
        // Calculate path
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);
        
        const largeArcFlag = angle > 180 ? 1 : 0;
        
        const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');
        
        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', memoryChartColors[index % memoryChartColors.length]);
        path.setAttribute('stroke', 'var(--color-card-background)');
        path.setAttribute('stroke-width', '2');
        
        // Add hover effects
        path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '4');
        });
        path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', '2');
        });
        
        svg.appendChild(path);
        
        // Add legend item
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = memoryChartColors[index % memoryChartColors.length];
        
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
        
        currentAngle = endAngle;
    });
}

function updateCpuAppsList(memoryData) {
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
        
        appItem.innerHTML = `
            <div class="cpu-app-name">${app.name}</div>
            <div class="cpu-app-stats">
                <div class="cpu-app-memory">${app.memory_mb.toFixed(1)} MB</div>
                <div class="cpu-app-cpu">${app.cpu_percent.toFixed(1)}%</div>
            </div>
        `;
        
        cpuAppsList.appendChild(appItem);
    });
}

function hideError() {
    // Implement error hiding if needed
}
function showError(msg) {
    // Implement error display if needed
}
function hideContent() {
    const content = document.getElementById('infoContent');
    if (content) {
        content.style.display = 'none';
    }
}
function showContent(show) {
    const content = document.getElementById('infoContent');
    if (content) {
        content.style.display = show ? 'block' : 'none';
    }
}

// Auto-load info on page load
loadSystemInfo();

// Set up cleanup observer
setupCleanupObserver();

// End of script execution guard
}
