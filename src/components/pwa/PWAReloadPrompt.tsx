import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Wifi } from 'lucide-react';
import './PWAReloadPrompt.css';

const PWAReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates every 60 seconds
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = async () => {
    // 1. Clear all cookies to ensure absolute clean state (as requested)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // Also clear from subdomains if any
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    }

    // 2. Clear all Caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        console.error("Cache clear error:", e);
      }
    }

    // 3. Clear Session Storage
    sessionStorage.clear();

    // 4. Trigger Service Worker update (skips waiting and reloads)
    updateServiceWorker(true);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="pwa-toast-container">
      <div className={`pwa-toast ${needRefresh ? 'pwa-toast--update' : 'pwa-toast--offline'}`}>
        <div className="pwa-toast-glow" />
        
        <div className="pwa-icon-wrap">
          {needRefresh ? <RefreshCw size={22} className="pwa-spin-icon" /> : <Wifi size={22} />}
        </div>

        <div className="pwa-content">
          <span className="pwa-title">
            {needRefresh ? 'New Version Available' : 'Offline Ready'}
          </span>
          <span className="pwa-desc">
            {needRefresh 
              ? 'A newer build has been deployed. Update now for the latest experience.' 
              : 'Avishkar \'26 is cached and ready to work offline.'}
          </span>
        </div>

        <div className="pwa-actions">
          {needRefresh && (
            <button className="pwa-btn pwa-btn-reload" onClick={handleUpdate}>
              <RefreshCw size={14} />
              Update Now
            </button>
          )}
          <button className="pwa-btn pwa-btn-close" onClick={close} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAReloadPrompt;
