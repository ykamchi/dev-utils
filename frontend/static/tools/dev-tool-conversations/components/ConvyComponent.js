(function () {

  class ConvyComponent {
    constructor(container, options = {}) {
      if (!container) {
        throw new Error('ConvyComponent requires a container element');
      }

      this.container = container;
      this.options = options;
      this.reaction = options.reaction || null;

      this.wrapper = document.createElement('div');
    //   this.wrapper.style.width = '100%';
    //   this.wrapper.style.height = '100%';
      this.wrapper.style.display = 'flex';
      this.wrapper.style.alignItems = 'flex-start';
      this.wrapper.style.justifyContent = 'center';
      

      this.container.appendChild(this.wrapper);

      this.render();
    }


    // ===== Private =====

    _buildImagePath() {
      if (!this.reaction) {
        return null;
      }
      // reaction 'happy-1' -> convy-happy-1.png
      const fileName = `convy-${this.reaction}.png`;
      return `/static/tools/dev-tool-conversations/assets/convy/${fileName}`;
    }

    _applySize(img) {
      const { width, height, size } = this.options;

      if (size) {
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
        return;
      }

      if (width) {
        img.style.width = `${width}px`;
      } else {
        img.style.width = '100%';
      }

      if (height) {
        img.style.height = `${height}px`;
      } else {
        img.style.height = '100%';
      }
    }


    // ===== Public =====

    render() {
      this.wrapper.innerHTML = '';

      let imagePath = this._buildImagePath();
      let altText = this.reaction;
      if (!imagePath) {
        imagePath = '/static/tools/dev-tool-conversations/assets/convy/convy-base.png';
        altText = 'base';
      }

      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = altText;
      img.style.objectFit = 'contain';

      // Fallback to base image if not found
      img.onerror = () => {
        img.onerror = null;
        img.src = '/static/tools/dev-tool-conversations/assets/convy/convy-base.png';
      };

      this._applySize(img);

      this.wrapper.appendChild(img);
    }

    destroy() {
      if (this.wrapper && this.wrapper.parentNode) {
        this.wrapper.parentNode.removeChild(this.wrapper);
      }
      this.wrapper = null;
      this.container = null;
    }
  }


  window.conversations = window.conversations || {};
  window.conversations.ConvyComponent = ConvyComponent;

})();