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
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory && memory < 3) return true;

  // 4. Check for low CPU cores
  const cores = navigator.hardwareConcurrency;
  
  // Only extremely restricted devices are considered low-spec.
  if (isMobile && cores && cores <= 2) return true;
  if (!isMobile && cores && cores <= 2) return true;

  return false;
};

export const getOptimalDPR = (): number => {
  if (isLowSpecDevice()) return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
};
