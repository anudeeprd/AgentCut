import '@testing-library/jest-dom';

// Polyfill mock HTMLMediaElement & Canvas methods for jsdom environment
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.HTMLMediaElement.prototype.load = () => {};

  window.HTMLCanvasElement.prototype.getContext = () =>
    ({
      drawImage: () => {},
      clearRect: () => {},
      fillRect: () => {},
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

  // Polyfill MediaRecorder & Canvas.captureStream for jsdom testing
  if (!(window.HTMLCanvasElement.prototype as any).captureStream) {
    (window.HTMLCanvasElement.prototype as any).captureStream = () => ({
      getVideoTracks: () => [{ stop: () => {} }],
      getAudioTracks: () => [{ stop: () => {} }],
      getTracks: () => [{ stop: () => {} }],
    });
  }

  if (typeof (window as any).MediaRecorder === 'undefined') {
    (window as any).MediaRecorder = class MockMediaRecorder {
      static isTypeSupported(type: string) {
        return type.startsWith('video/webm');
      }
      mimeType: string = 'video/webm';
      ondataavailable: ((e: any) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      state: string = 'inactive';

      constructor(_stream?: any, options?: any) {
        if (options && options.mimeType) {
          this.mimeType = options.mimeType;
        }
      }

      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        if (this.ondataavailable) {
          this.ondataavailable({
            data: new Blob(['mock-video-bytes'], { type: this.mimeType }),
          });
        }
        if (this.onstop) {
          this.onstop();
        }
      }
    };
  }

  if (typeof (window as any).MediaStream === 'undefined') {
    (window as any).MediaStream = class MockMediaStream {
      tracks: any[] = [];
      constructor(tracks: any[] = []) {
        this.tracks = tracks;
      }
      getTracks() {
        return this.tracks;
      }
      getVideoTracks() {
        return this.tracks;
      }
      getAudioTracks() {
        return [];
      }
    };
  }

  // Polyfill URL.createObjectURL & URL.revokeObjectURL for jsdom
  if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = () => 'blob:mock-url';
  }
  if (typeof URL.revokeObjectURL === 'undefined') {
    URL.revokeObjectURL = () => {};
  }

  // Polyfill document.fonts for jsdom
  if (typeof (document as any).fonts === 'undefined') {
    (document as any).fonts = {
      load: async (_font: string) => Promise.resolve([]),
      check: (_font: string) => true,
      ready: Promise.resolve(),
    };
  }
}

