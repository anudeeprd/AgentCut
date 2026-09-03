import '@testing-library/jest-dom';

// Polyfill mock HTMLMediaElement & Canvas methods for jsdom environment
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.HTMLMediaElement.prototype.load = () => {};

  window.HTMLCanvasElement.prototype.getContext = () =>
    ({
      drawImage: () => {},
      filter: '',
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      fillText: () => {},
      font: '',
      fillStyle: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    } as any);

  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,mock';

  Object.defineProperty(globalThis.Image.prototype, 'naturalWidth', {
    get() {
      return 1920;
    },
  });

  Object.defineProperty(globalThis.Image.prototype, 'naturalHeight', {
    get() {
      return 1080;
    },
  });

  Object.defineProperty(globalThis.Image.prototype, 'src', {
    set(src) {
      this._src = src;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    },
    get() {
      return this._src;
    },
  });
}
