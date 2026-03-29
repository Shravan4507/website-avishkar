/* 
  Avishkar '26 Performance Engine
  Optimized for low-spec devices and smooth cinematic transitions.
*/

export const isLowSpecDevice = (): boolean => {
  // 1. Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

  // 2. Mobile detection (often more resource constrained)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 3. Check for low memory (if supported)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory <= 4) return true;

  // 4. Check for low CPU cores
  const cores = navigator.hardwareConcurrency;
  
  // If we are on mobile, 4 cores or less is low-spec.
  // On desktop, 4 cores is usually sufficient for WebGL unless memory is also low.
  if (isMobile && cores && cores <= 4) return true;
  
  // Only highly restricted devices (e.g. 2 cores or less) are low-spec on desktop
  if (!isMobile && cores && cores <= 2) return true;

  return false;
};

export const getOptimalDPR = (): number => {
  if (isLowSpecDevice()) return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
};
