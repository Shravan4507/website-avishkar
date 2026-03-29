import { useEffect, useRef } from 'react';

/**
 * Detects a shake gesture on mobile devices using the DeviceMotion API.
 * Calls `onShake` when a sharp shake is detected.
 * Only active on mobile viewports with DeviceMotion support.
 */
export function useShakeDetector(onShake: () => void, enabled = true) {
  const lastShake = useRef(0);
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (!enabled) return;

    // Only run on mobile-ish viewports
    const isMobile = window.innerWidth < 900;
    const hasMotion = 'DeviceMotionEvent' in window;
    if (!isMobile || !hasMotion) return;

    const THRESHOLD = 25; // acceleration magnitude to trigger
    const COOLDOWN = 2000; // ms between triggers

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const dx = Math.abs(acc.x - lastAccel.current.x);
      const dy = Math.abs(acc.y - lastAccel.current.y);
      const dz = Math.abs(acc.z - lastAccel.current.z);

      lastAccel.current = { x: acc.x, y: acc.y, z: acc.z };

      const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (magnitude > THRESHOLD) {
        const now = Date.now();
        if (now - lastShake.current > COOLDOWN) {
          lastShake.current = now;
          onShake();
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onShake, enabled]);
}
