export const CURATED_FONTS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Bebas Neue',
  'Playfair Display',
  'DM Serif Display',
  'Caveat',
  'Pacifico',
] as const;

export type CuratedFontFamily = (typeof CURATED_FONTS)[number];

export const DEFAULT_FONT: CuratedFontFamily = 'Inter';

export function isValidFont(font: unknown): font is CuratedFontFamily {
  return typeof font === 'string' && (CURATED_FONTS as readonly string[]).includes(font);
}

export const WEBMCP_FONT_SCHEMA = {
  type: 'string',
  enum: [...CURATED_FONTS],
  description:
    'Font family for the text layer. Use bold display fonts such as Bebas Neue for poster headlines, serif fonts such as Playfair Display for editorial styling, and Caveat/Pacifico for handwritten or expressive text.',
};

/**
 * Defensive asynchronous font loader that safely attempts to load a font through document.fonts.load,
 * returning the font family name if successful or falling back safely to Inter if loading fails.
 */
export async function ensureFontLoadedSafely(
  fontFamily: string = DEFAULT_FONT,
  weight: string = 'normal',
  fontSize: number = 16
): Promise<string> {
  const targetFont = fontFamily || DEFAULT_FONT;
  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') {
    return targetFont;
  }

  try {
    const fontSpec = `${weight} ${fontSize}px "${targetFont}"`;
    await document.fonts.load(fontSpec);
    return targetFont;
  } catch (err) {
    console.warn(`[AgentCut Fonts] Failed to load font "${targetFont}", falling back safely to ${DEFAULT_FONT}:`, err);
    return DEFAULT_FONT;
  }
}

/**
 * Preload multiple fonts asynchronously, returning a mapping of requested font to resolved font (or Inter on failure).
 */
export async function preloadFontsSafely(
  fonts: (string | undefined)[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const uniqueFonts = Array.from(new Set(fonts.filter(Boolean))) as string[];

  if (typeof document === 'undefined' || !document.fonts || typeof document.fonts.load !== 'function') {
    for (const f of uniqueFonts) {
      resolved.set(f, f);
    }
    return resolved;
  }

  await Promise.all(
    uniqueFonts.map(async (f) => {
      try {
        await document.fonts.load(`16px "${f}"`);
        resolved.set(f, f);
      } catch (err) {
        console.warn(`[AgentCut Fonts] Failed to preload font "${f}", falling back safely to ${DEFAULT_FONT}:`, err);
        resolved.set(f, DEFAULT_FONT);
      }
    })
  );

  return resolved;
}
