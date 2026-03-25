/* 
  Avishkar '26 Performance Engine
  Optimized for low-spec devices and smooth cinematic transitions.
*/

export const isLowSpecDevice = (): boolean => {
  // 1. Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

  // 2. Check for low memory (if supported)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 4) return true;

  // 3. Check for low CPU cores
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 4) return true;

  // 4. Mobile check (often lower spec than desktops)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile && cores <= 4) return true;

  return false;
};

export const getOptimalDPR = (): number => {
  if (isLowSpecDevice()) return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
};
