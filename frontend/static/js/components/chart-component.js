// chart-component.js
// Requires Chart.js loaded globally as `Chart`

(function () {

    class ChartComponent {
        constructor(
            container,
            type,
            data,
            options = null,     // NULL -> use defaults by type
            width = '100%',
            height = '260px',
            title = null,
            tooltip = ''
        ) {
            if (!container)
                throw new Error('ChartComponent: missing container');

            if (!type)
                throw new Error('ChartComponent: missing type');

            if (!ChartComponent.TYPE_DEFAULTS[type])
                throw new Error('ChartComponent: unsupported type "' + type + '"');

            if (typeof Chart === 'undefined')
                throw new Error('ChartComponent: Chart.js not loaded');

            this.container = container;
            this.type = type;
            this.data = data || { labels: [], datasets: [] };
            this.options = options;

            /* Root */
            this.root = document.createElement('div');
            this.root.className = 'framework-chart-container';

            /* Title */
            if (title) {
                this.titleEl = document.createElement('div');
                this.titleEl.className = 'framework-chart-title';
                this.titleEl.textContent = title;
                this.root.appendChild(this.titleEl);
            }

            /* Wrapper */
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'framework-chart-wrapper';
            if (tooltip) this.wrapper.title = tooltip;

            this.wrapper.style.width =
                typeof width === 'number' ? `${width}px` : width;

            this.wrapper.style.height =
                typeof height === 'number' ? `${height}px` : height;

            /* Canvas */
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'framework-chart-canvas';

            this.wrapper.appendChild(this.canvas);
            this.root.appendChild(this.wrapper);
            this.container.appendChild(this.root);

            this.chart = null;

            /* ResizeObserver (popup-safe) */
            if (typeof ResizeObserver !== 'undefined') {
                this._ro = new ResizeObserver(() => {
                    if (this.chart) this.chart.resize();
                });
                this._ro.observe(this.wrapper);
            }

            // Defer to allow popup/layout to settle
            setTimeout(() => this._initChart(), 0);
        }

        /* ---------------- INTERNAL ---------------- */

        _initChart() {
            const rect = this.wrapper.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            if (this.chart) return;

            // Kill any previous instance on this canvas
            const existing = Chart.getChart(this.canvas);
            if (existing) existing.destroy();

            const typeDefaults =
                ChartComponent.TYPE_DEFAULTS[this.type];

            const finalOptions = this.options
                ? ChartComponent._deepMerge(typeDefaults, this.options)
                : typeDefaults;

            this.chart = new Chart(this.canvas, {
                type: this.type,
                data: this.data,
                options: finalOptions
            });
        }

        /* ---------------- API ---------------- */

        refresh() {
            if (!this.chart) {
                this._initChart();
                return;
            }
            this.chart.resize();
            this.chart.update();
        }

        setData(data) {
            if (!this.chart) return;
            this.chart.data = data;
            this.chart.update();
        }

        setOptions(options) {
            this.options = options;
            if (!this.chart) return;

            const typeDefaults =
                ChartComponent.TYPE_DEFAULTS[this.type];

            this.chart.options = options
                ? ChartComponent._deepMerge(typeDefaults, options)
                : typeDefaults;

            this.chart.update();
        }

        setType(type) {
            if (!type || type === this.type) return;

            if (!ChartComponent.TYPE_DEFAULTS[type])
                throw new Error('ChartComponent: unsupported type "' + type + '"');

            this.type = type;
            this._destroyChartOnly();
            this._initChart();
        }

        setSize(width, height) {
            if (width)
                this.wrapper.style.width =
                    typeof width === 'number' ? `${width}px` : width;

            if (height)
                this.wrapper.style.height =
                    typeof height === 'number' ? `${height}px` : height;

            this.refresh();
        }

        _destroyChartOnly() {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
        }

        destroy() {
            this._destroyChartOnly();

            if (this._ro) {
                this._ro.disconnect();
                this._ro = null;
            }

            if (this.root && this.root.parentNode) {
                this.root.parentNode.removeChild(this.root);
            }
        }

        getElement() { return this.root; }
        getChart() { return this.chart; }

        /* ---------------- HELPERS ---------------- */

        static _isPlainObject(v) {
            return v !== null && typeof v === 'object' && !Array.isArray(v);
        }

        static _deepMerge() {
            const out = {};
            for (let i = 0; i < arguments.length; i++) {
                const src = arguments[i];
                if (!ChartComponent._isPlainObject(src)) continue;

                Object.keys(src).forEach((k) => {
                    const sv = src[k];
                    const ov = out[k];

                    if (
                        ChartComponent._isPlainObject(sv) &&
                        ChartComponent._isPlainObject(ov)
                    ) {
                        out[k] = ChartComponent._deepMerge(ov, sv);
                    } else {
                        out[k] = sv;
                    }
                });
            }
            return out;
        }
    }

    /* ---------------- PUBLIC CONSTS (YOUR STYLE) ---------------- */

    window.ChartComponent = ChartComponent;

    window.ChartComponent.TYPE_LINE = 'line';
    window.ChartComponent.TYPE_BAR  = 'bar';
    window.ChartComponent.TYPE_PIE  = 'pie';

    window.ChartComponent.TYPE_DEFAULTS = {

        [window.ChartComponent.TYPE_LINE]: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 50 }
                }
            }
        },

        [window.ChartComponent.TYPE_BAR]: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        },

        [window.ChartComponent.TYPE_PIE]: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: { enabled: true }
            }
        }
    };

})();
