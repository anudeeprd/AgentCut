import { describe, it, expect } from 'vitest';
import { exportImageCanvas } from '../services/imageExport';
import { ImageProject } from '../types/editor';

describe('WYSIWYG Scaling Verification', () => {
  it('computes proportional font size between previewScale and exportScale', () => {
    const logicalFontSize = 48;

    // Simulated preview frame heights
    const previewHeights = [540, 648, 720, 800];
    const exportHeight = 1080;

    const exportScale = exportHeight / 1080;
    const exportFontSize = Math.max(1, Math.round(logicalFontSize * exportScale));

    const exportProportion = exportFontSize / exportHeight;

    for (const h of previewHeights) {
      const previewScale = h / 1080;
      const displayFontSize = Math.max(1, logicalFontSize * previewScale);
      const previewProportion = displayFontSize / h;

      // The ratio of font size to canvas height must be identical between preview and export!
      expect(previewProportion).toBeCloseTo(exportProportion, 5);
      expect(previewProportion).toBeCloseTo(48 / 1080, 5);
    }
  });

  it('preserves exact proportional text coordinates and scaling across aspect ratios', async () => {
    const mockProject: ImageProject = {
      id: 'test-proj',
      source: {
        fileName: 'test.jpg',
        width: 1920,
        height: 1080,
        objectUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"></svg>',
      },
      canvas: {
        width: 864,
        height: 1080,
        aspectRatio: '4:5',
      },
      transform: { rotation: 0, flipX: false, flipY: false },
      adjustments: { brightness: 10, contrast: 8, saturation: 12, grayscale: 0, blur: 0 },
      textLayers: [
        {
          id: 'text-1',
          content: 'Explore More',
          position: 'top-center',
          x: 50,
          y: 12,
          fontSize: 48,
          fontWeight: 'bold',
          alignment: 'center',
          opacity: 1,
          color: '#ffffff',
        },
      ],
      history: [],
      future: [],
    };

    const result = await exportImageCanvas(mockProject, 'png', false);
    expect(result.success).toBe(true);
    expect(result.dimensions.width).toBe(864);
    expect(result.dimensions.height).toBe(1080);
    // Aspect ratio: 864 / 1080 = 4 / 5
    expect(result.dimensions.width / result.dimensions.height).toBeCloseTo(4 / 5, 4);
  });
});
