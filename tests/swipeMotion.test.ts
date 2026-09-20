import { describe, expect, it } from 'vitest';
import { releaseProgressVelocity, swipeProgress, type SwipeProfile } from '../os/swipeMotion';
import { androidFlingDistance } from '../os/androidFling';

const samples = (profile: SwipeProfile, ms: number, steps = Math.ceil(ms / 16)) =>
  Array.from({ length: steps + 1 }, (_, i) => ({
    timeMs: ms * i / steps, progress: swipeProgress(i / steps, profile),
  }));

describe('swipe motion and release velocity', () => {
  it('moves monotonically, preserves distance, and continues moving throughout the tail', () => {
    const trajectory = samples('decelerate', 600);
    expect(trajectory[0].progress).toBe(0);
    expect(trajectory.at(-1)?.progress).toBe(1);
    for (let i = 1; i < trajectory.length; i++) {
      expect(trajectory[i].progress).toBeGreaterThan(trajectory[i - 1].progress);
    }
    expect(swipeProgress(.4, 'decelerate')).toBeCloseTo(2 / 3, 12);
    expect(swipeProgress(.7, 'decelerate')).toBeCloseTo(23 / 24, 12);
    expect(swipeProgress(.9, 'decelerate')).toBeCloseTo(647 / 648, 12);
  });

  it('preserves linear speed even with uneven sample spacing', () => {
    expect(releaseProgressVelocity([
      { timeMs: 0, progress: 0 }, { timeMs: 413, progress: 413 / 600 },
      { timeMs: 553, progress: 553 / 600 }, { timeMs: 600, progress: 1 },
    ])).toBeCloseTo(1000 / 600, 12);
  });

  it('reduces finite-window release speed without disabling fling', () => {
    const linear = 560 * releaseProgressVelocity(samples('linear', 600));
    const slow = 560 * releaseProgressVelocity(samples('decelerate', 600));
    expect(slow).toBeGreaterThan(0);
    expect(slow).toBeLessThan(linear / 20);
    expect(androidFlingDistance(slow, 160)).toBeGreaterThan(0);
    expect(androidFlingDistance(slow, 160)).toBeLessThan(androidFlingDistance(linear, 160) / 100);
  });

  it('still predicts substantial residual velocity for short or undersampled swipes', () => {
    const fast = releaseProgressVelocity(samples('decelerate', 120));
    const slow = releaseProgressVelocity(samples('decelerate', 600));
    expect(fast).toBeGreaterThan(slow * 20);
    expect(releaseProgressVelocity([{ timeMs: 0, progress: 0 }, { timeMs: 600, progress: 1 }])).toBeCloseTo(1000 / 600);
  });
});
