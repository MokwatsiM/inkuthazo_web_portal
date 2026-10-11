/** True when running as an installed app (home-screen launch). */
export const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  // iOS Safari
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIos = (): boolean =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
