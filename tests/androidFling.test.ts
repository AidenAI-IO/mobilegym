import { describe, expect, it } from 'vitest';
import {
  androidFlingDistance,
  androidFlingDurationMs,
  androidFlingProgress,
  ppiForDpr,
} from '../os/androidFling';

const DPR = 3;
const PPI = ppiForDpr(DPR);
const TRAVEL_CSS = 320;

/** Coasting distance in CSS px for a fixed finger travel released after `ms`. */
function flingCssForSwipe(travelCss: number, ms: number): number {
  const velocityCss = travelCss / (ms / 1000);
  return androidFlingDistance(velocityCss * DPR, PPI) / DPR;
}

describe('Android fling physics', () => {
  it('coasts further the faster the finger is released', () => {
    const fast = flingCssForSwipe(TRAVEL_CSS, 120);
    const medium = flingCssForSwipe(TRAVEL_CSS, 300);
    const slow = flingCssForSwipe(TRAVEL_CSS, 2400);

    expect(fast).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(slow);
    // A slow drag barely coasts past the finger.
    expect(slow).toBeLessThan(30);
    // A fast flick flies well past a one-screen swipe.
    expect(fast).toBeGreaterThan(500);
  });

  it('makes the coast depend on release velocity, not a fixed multiplier', () => {
    // The previous model added the same distance for every duration, which is
    // exactly why a simulated one-screen swipe never felt like a real one.
    const distances = [120, 300, 600, 1200, 2400].map((ms) => flingCssForSwipe(TRAVEL_CSS, ms));
    expect(new Set(distances.map((d) => Math.round(d))).size).toBe(distances.length);
  });

  it('shortens the coasting duration as the release slows', () => {
    expect(androidFlingDurationMs(8000, PPI)).toBeGreaterThan(androidFlingDurationMs(400, PPI));
    expect(androidFlingDurationMs(400, PPI)).toBeGreaterThan(0);
  });

  it('returns no coast without a usable velocity', () => {
    expect(androidFlingDistance(0, PPI)).toBe(0);
    expect(androidFlingDistance(Number.NaN, PPI)).toBe(0);
    expect(androidFlingDistance(4000, 0)).toBe(0);
    expect(androidFlingDurationMs(0, PPI)).toBe(0);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0, -0.015])(
    'returns no coast with unusable friction %s',
    (friction) => {
      expect(androidFlingDistance(4000, PPI, friction)).toBe(0);
      expect(androidFlingDurationMs(4000, PPI, friction)).toBe(0);
    },
  );

  it('advances within each sampled interval without jumping at its boundary', () => {
    expect(androidFlingProgress(0.205)).toBeGreaterThan(androidFlingProgress(0.201));
    expect(androidFlingProgress(0.209)).toBeGreaterThan(androidFlingProgress(0.205));
    expect(androidFlingProgress(0.21) - androidFlingProgress(0.21 - 1e-8)).toBeLessThan(1e-6);
  });

  it('approaches the final position continuously and clamps at completion', () => {
    const nearEnd = androidFlingProgress(1 - 1e-8);
    expect(Number.isFinite(nearEnd)).toBe(true);
    expect(nearEnd).toBeLessThanOrEqual(1);
    expect(1 - nearEnd).toBeLessThan(1e-8);
    expect(androidFlingProgress(1)).toBe(1);
    expect(androidFlingProgress(1.1)).toBe(1);
    expect(androidFlingProgress(-0.1)).toBe(0);
  });

  it('walks the spline position curve from 0 to 1, decelerating', () => {
    expect(androidFlingProgress(0)).toBe(0);
    expect(androidFlingProgress(1)).toBe(1);
    // Deceleration means most of the distance is covered early.
    expect(androidFlingProgress(0.5)).toBeGreaterThan(0.5);
    expect(androidFlingProgress(0.5)).toBeLessThan(1);
  });
});
