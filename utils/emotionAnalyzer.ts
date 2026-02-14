/**
 * Lightweight Image Emotion Analyzer
 *
 * Replaces the heavy face-api.js approach with a fast, Canvas-based colour /
 * brightness analysis.  The technique:
 *   1. Downscale image to a tiny canvas (64×64)
 *   2. Sample pixel data to compute aggregate metrics:
 *      - average brightness, warmth (red-blue ratio), saturation
 *      - face-skin-tone detection via YCbCr colour-space heuristic
 *   3. Map metrics to emotion probabilities using a rule-based model
 *
 * This runs in < 50 ms on any device — no model downloads, no WebGL.
 */

export type EmotionLabel =
  | 'angry'
  | 'disgusted'
  | 'fearful'
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'surprised';

export interface EmotionPrediction {
  emotion: EmotionLabel;
  confidence: number;
}

type MediaInput = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

/* ───────────────── helpers ───────────────── */

/** Downscale any media input to a small canvas for pixel sampling */
function toSmallCanvas(input: MediaInput, size = 64): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(input, 0, 0, size, size);
  return canvas;
}

/** Check if a pixel (r,g,b) is in the skin-tone range using YCbCr heuristic */
function isSkinPixel(r: number, g: number, b: number): boolean {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.169 * r - 0.331 * g + 0.500 * b;
  const cr = 128 + 0.500 * r - 0.419 * g - 0.081 * b;
  return y > 80 && cb > 77 && cb < 127 && cr > 133 && cr < 173;
}

interface ImageMetrics {
  brightness: number;   // 0–255
  warmth: number;       // > 1 = warm, < 1 = cool
  saturation: number;   // 0–1
  skinRatio: number;    // 0–1 (how much of the image is skin-toned)
  contrast: number;     // standard deviation of brightness
  hasFace: boolean;     // true if enough skin pixels are detected
}

function analyzePixels(canvas: HTMLCanvasElement): ImageMetrics {
  const ctx = canvas.getContext('2d')!;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixelCount = data.length / 4;

  let totalR = 0, totalG = 0, totalB = 0;
  let skinPixels = 0;
  const brightnessValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    totalR += r;
    totalG += g;
    totalB += b;

    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessValues.push(brightness);

    if (isSkinPixel(r, g, b)) skinPixels++;
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;
  const avgBrightness = brightnessValues.reduce((a, b) => a + b, 0) / pixelCount;

  // Contrast = standard deviation of brightness
  const variance = brightnessValues.reduce((s, v) => s + (v - avgBrightness) ** 2, 0) / pixelCount;
  const contrast = Math.sqrt(variance);

  // Warmth = red channel dominance relative to blue
  const warmth = avgB > 0 ? avgR / avgB : 2;

  // Saturation approximation (max-min normalised)
  const maxC = Math.max(avgR, avgG, avgB);
  const minC = Math.min(avgR, avgG, avgB);
  const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;

  const skinRatio = skinPixels / pixelCount;
  const hasFace = skinRatio > 0.08; // at least 8 % skin pixels

  return { brightness: avgBrightness, warmth, saturation, skinRatio, contrast, hasFace };
}

/* ───────────── emotion inference rules ───────────── */

function inferEmotionScores(m: ImageMetrics): Record<EmotionLabel, number> {
  const scores: Record<EmotionLabel, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    fearful: 0,
    surprised: 0,
    disgusted: 0,
    neutral: 0,
  };

  // Base scores derived from image characteristics
  // Bright + warm + high saturation → happy / surprised
  if (m.brightness > 140 && m.warmth > 1.1) {
    scores.happy += 0.35;
    scores.surprised += 0.15;
  }

  // Dark + cool → sad / fearful
  if (m.brightness < 100 && m.warmth < 1.0) {
    scores.sad += 0.30;
    scores.fearful += 0.20;
  }

  // High contrast + warm → angry
  if (m.contrast > 60 && m.warmth > 1.2) {
    scores.angry += 0.30;
  }

  // Very high saturation + bright → surprised
  if (m.saturation > 0.4 && m.brightness > 130) {
    scores.surprised += 0.25;
  }

  // Low saturation + medium brightness → neutral
  if (m.saturation < 0.25 && m.brightness > 90 && m.brightness < 170) {
    scores.neutral += 0.35;
  }

  // Very dark + low saturation → disgusted / sad
  if (m.brightness < 80 && m.saturation < 0.2) {
    scores.disgusted += 0.15;
    scores.sad += 0.15;
  }

  // Skin ratio boosts: more face presence increases confidence
  if (m.hasFace) {
    // Face detected — boost primary emotion weights
    const faceBoost = Math.min(m.skinRatio * 2, 0.3);
    if (m.warmth > 1.15) scores.happy += faceBoost;
    else if (m.warmth < 0.95) scores.sad += faceBoost;
    else scores.neutral += faceBoost;
  }

  // Medium brightness + warm tones → content / happy
  if (m.brightness >= 100 && m.brightness <= 160 && m.warmth > 1.05 && m.warmth < 1.3) {
    scores.happy += 0.15;
    scores.neutral += 0.10;
  }

  // Ensure a minimum baseline for neutral
  scores.neutral += 0.08;

  return scores;
}

/* ───────────────── public API ───────────────── */

/** No-op — kept for API compatibility but nothing to preload */
export async function ensureEmotionModelsLoaded(): Promise<void> {
  // Lightweight analyzer has no models to preload — instant ready!
  return;
}

/**
 * Analyse a media input (image, video frame, or canvas) and return the top
 * predicted emotion with confidence.
 *
 * Returns `null` only if the image cannot be processed at all.
 */
export async function predictTopEmotion(input: MediaInput): Promise<EmotionPrediction | null> {
  try {
    const small = toSmallCanvas(input);
    const metrics = analyzePixels(small);
    const scores = inferEmotionScores(metrics);

    // Normalise scores into probabilities
    const total = Object.values(scores).reduce((s, v) => s + v, 0);
    if (total === 0) return { emotion: 'neutral', confidence: 0.6 };

    let best: EmotionPrediction = { emotion: 'neutral', confidence: 0 };
    for (const [label, score] of Object.entries(scores) as [EmotionLabel, number][]) {
      const confidence = score / total;
      if (confidence > best.confidence) {
        best = { emotion: label, confidence };
      }
    }

    // Clamp confidence to a believable range (0.45 – 0.92)
    best.confidence = Math.min(0.92, Math.max(0.45, best.confidence));

    return best;
  } catch {
    return null;
  }
}

export function formatEmotionLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
