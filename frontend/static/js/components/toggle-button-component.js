// toggle-button-component.js

(function () {
    class ToggleButtonComponent {
        constructor(
            container,
            on = false,
            onChange = null,
            onText = 'ON',
            offText = 'OFF',
            width = '160px',
            height = '36px',
            disabled = false,
            tooltip = ''
        ) {
            this.onChange = onChange;
            this._onText = (typeof onText === 'string') ? onText : 'ON';
            this._offText = (typeof offText === 'string') ? offText : 'OFF';

            this.wrapper = document.createElement('div');
            this.wrapper.className = 'framework-toggle-container';
            if (tooltip) this.wrapper.title = tooltip;

            this.input = document.createElement('input');
            this.input.type = 'checkbox';
            this.input.checked = !!on;
            this.input.disabled = !!disabled;
            this.input.className = 'framework-toggle-input';

            this.track = document.createElement('div');
            this.track.className = 'framework-toggle-track';
            this.track.style.width = width;
            this.track.style.height = height;

            // thumb size = height - 8px (4px top + 4px bottom)
            const h = parseInt(String(height), 10);
            this.track.style.setProperty(
                '--toggle-thumb-size',
                (!Number.isNaN(h) ? (h - 8) : 28) + 'px'
            );

            this.text = document.createElement('div');
            this.text.className = 'framework-toggle-text';

            this.thumb = document.createElement('div');
            this.thumb.className = 'framework-toggle-thumb';

            this.track.appendChild(this.text);
            this.track.appendChild(this.thumb);

            // Listener ONLY on track
            this.track.addEventListener('click', (e) => this.clicked(e));

            this.wrapper.appendChild(this.input);
            this.wrapper.appendChild(this.track);

            if (disabled) {
                this.wrapper.classList.add('framework-toggle-disabled');
            }

            this._render();
            container.appendChild(this.wrapper);
        }

        clicked(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            if (this.input.disabled) return;

            this.input.checked = !this.input.checked;
            this._render();

            if (typeof this.onChange === 'function') {
                this.onChange(this.input.checked);
            }
        }

        _render() {
            this.text.textContent = this.input.checked ? this._onText : this._offText;
        }

        isOn() { return this.input.checked; }

        setOn(v) {
            this.input.checked = !!v;
            this._render();
        }

        setDisabled(d) {
            this.input.disabled = !!d;
            this.wrapper.classList.toggle('framework-toggle-disabled', !!d);
        }

        setText(onText, offText) {
            if (typeof onText === 'string') this._onText = onText;
            if (typeof offText === 'string') this._offText = offText;
            this._render();
        }

        setSize(width, height) {
            if (width) this.track.style.width = width;
            if (height) {
                this.track.style.height = height;
                const h = parseInt(String(height), 10);
                this.track.style.setProperty(
                    '--toggle-thumb-size',
                    (!Number.isNaN(h) ? (h - 8) : 28) + 'px'
                );
            }
        }

        getElement() { return this.wrapper; }
    }

    window.ToggleButtonComponent = ToggleButtonComponent;
})();
