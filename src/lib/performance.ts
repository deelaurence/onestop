export type PerformanceTier = 'high' | 'reduced';

export function getPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'high';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'reduced';
  }

  const coarseTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallScreen = window.matchMedia('(max-width: 768px)').matches;
  const lowCores =
    navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = nav.deviceMemory !== undefined && nav.deviceMemory <= 4;

  if (coarseTouch || (smallScreen && (lowCores || lowMemory))) {
    return 'reduced';
  }

  return 'high';
}

export function initPerformanceProfile(): PerformanceTier {
  const tier = getPerformanceTier();
  document.documentElement.dataset.perf = tier;

  const syncPaused = () => {
    document.documentElement.dataset.paused = document.hidden ? 'true' : 'false';
  };
  syncPaused();
  document.addEventListener('visibilitychange', syncPaused);

  return tier;
}

export function isReducedPerformance(): boolean {
  return document.documentElement.dataset.perf === 'reduced';
}

export function prefersFinePointer(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
