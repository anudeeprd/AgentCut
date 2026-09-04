import { describe, it, expect, afterEach } from 'vitest';
import {
  getSupportedVideoFormatInfo,
  exportVideoComposition,
} from '../services/videoExport';
import { getAgentCutToolDefinitions } from '../webmcp/registerTools';
import { editorStore } from '../store/editorStore';
import { VideoProject } from '../types/editor';

describe('Video Format Negotiation (MP4 preference & WebM fallback)', () => {
  const originalIsTypeSupported = (window as any).MediaRecorder?.isTypeSupported;

  const sampleProject: VideoProject = {
    id: 'proj-format-test',
    source: {
      fileName: 'sample.mp4',
      duration: 10,
      width: 1920,
      height: 1080,
      objectUrl: 'blob:sample',
    },
    aspectRatio: '9:16',
    trim: { start: 2, end: 5 },
    playbackRate: 1,
    volume: 100,
    muted: false,
    playhead: 2,
    isPlaying: false,
    clips: [{ id: 'c1', start: 0, end: 10 }],
    textLayers: [],
    keyframes: [],
    history: [],
    future: [],
  };

  afterEach(() => {
    if ((window as any).MediaRecorder) {
      (window as any).MediaRecorder.isTypeSupported = originalIsTypeSupported;
    }
  });

  // Test 1: MP4 chosen when supported
  it('chooses MP4 candidate first when browser MediaRecorder supports it', () => {
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/mp4');
    };

    const info = getSupportedVideoFormatInfo();
    expect(info.format).toBe('mp4');
    expect(info.extension).toBe('.mp4');
    expect(info.mimeType).toContain('video/mp4');
  });

  // Test 2: MP4 filename gets .mp4
  it('assigns .mp4 extension to download filename when MP4 is selected', async () => {
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/mp4');
    };

    const res = await exportVideoComposition(sampleProject, {
      triggerDownload: false,
    });

    expect(res.success).toBe(true);
    expect(res.format).toBe('mp4');
    expect(res.fileName.endsWith('.mp4')).toBe(true);
    expect(res.fileName).toMatch(/^agentcut-export-\d+\.mp4$/);
  });

  // Test 3: MP4 Blob gets correct MIME
  it('creates Blob with exact selected MP4 MIME type', async () => {
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/mp4');
    };

    const res = await exportVideoComposition(sampleProject, {
      triggerDownload: false,
    });

    expect(res.blob).toBeDefined();
    expect(res.blob?.type).toContain('video/mp4');
    expect(res.mimeType).toContain('video/mp4');
  });

  // Test 4: WebM used when MP4 unsupported
  it('falls back safely to WebM when MP4 recording is unsupported', () => {
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/webm');
    };

    const info = getSupportedVideoFormatInfo();
    expect(info.format).toBe('webm');
    expect(info.extension).toBe('.webm');
    expect(info.mimeType).toContain('video/webm');
  });

  // Test 5: Fallback filename gets .webm
  it('assigns .webm extension to download filename when WebM is selected', async () => {
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/webm');
    };

    const res = await exportVideoComposition(sampleProject, {
      triggerDownload: false,
    });

    expect(res.success).toBe(true);
    expect(res.format).toBe('webm');
    expect(res.fileName.endsWith('.webm')).toBe(true);
    expect(res.fileName).toMatch(/^agentcut-export-\d+\.webm$/);
    expect(res.blob?.type).toContain('video/webm');
  });

  // Test 6: export_video structured result reports actual format
  it('reports actual format and mimeType in WebMCP export_video result', async () => {
    // 6a: Test when MP4 supported
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/mp4');
    };

    editorStore.loadVideo(sampleProject.source!);

    const tools = getAgentCutToolDefinitions();
    const exportTool = tools.find((t) => t.name === 'export_video')!;

    const resMp4 = await exportTool.execute({});
    expect(resMp4.success).toBe(true);
    expect(resMp4.format).toBe('mp4');
    expect(resMp4.mimeType).toContain('video/mp4');
    expect(resMp4.fileName.endsWith('.mp4')).toBe(true);
    expect(resMp4.renderedOutput).toBe(true);
    expect(resMp4.includesEdits).toBe(true);

    // 6b: Test fallback when MP4 unsupported
    (window as any).MediaRecorder.isTypeSupported = (mime: string) => {
      return mime.startsWith('video/webm');
    };

    const resWebm = await exportTool.execute({});
    expect(resWebm.success).toBe(true);
    expect(resWebm.format).toBe('webm');
    expect(resWebm.mimeType).toContain('video/webm');
    expect(resWebm.fileName.endsWith('.webm')).toBe(true);
    expect(resWebm.renderedOutput).toBe(true);
    expect(resWebm.includesEdits).toBe(true);
  });

  // Test 7: Tool count remains exactly 29
  it('preserves exact total tool count of 29 (11 image, 18 video)', () => {
    const tools = getAgentCutToolDefinitions();
    expect(tools.length).toBe(29);

    const imageTools = tools.filter((t) => t.name.includes('image'));
    const videoTools = tools.filter((t) => t.name.includes('video') || t.name === 'get_timeline');

    expect(imageTools.length).toBe(11);
    expect(videoTools.length).toBe(18);
  });
});
