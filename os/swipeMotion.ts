export type SwipeProfile = 'linear' | 'decelerate';

// Same arc-length curve as the firmware HID provider's decelerateProgress.
export function swipeProgress(t: number, profile: SwipeProfile): number {
  t = Math.max(0, Math.min(1, t));
  if (profile === 'linear') return t;
  if (t <= 0.4) return t * 5 / 3;
  const u = (1 - t) / 0.6;
  return 1 - u * u * u / 3;
}

export type MotionSample = { timeMs: number; progress: number };

// Estimate speed from the recent executed samples, not the profile name or
// its analytical endpoint derivative. A short decelerating gesture can still
// fling. This finite-window estimate is an approximation, not Android's full
// VelocityTracker (nor a calibrated iOS model).
export function releaseProgressVelocity(samples: readonly MotionSample[], windowMs = 100): number {
  if (samples.length < 2) return 0;
  const end = samples[samples.length - 1];
  const cutoff = Math.max(samples[0].timeMs, end.timeMs - windowMs);
  const elapsed = end.timeMs - cutoff;
  if (elapsed <= 0) return 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (b.timeMs >= cutoff && b.timeMs > a.timeMs) {
      const startProgress = a.progress + (b.progress - a.progress) * (cutoff - a.timeMs) / (b.timeMs - a.timeMs);
      return Math.max(0, (end.progress - startProgress) * 1000 / elapsed);
    }
  }
  return 0;
}
