import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAReloadPrompt.css';

const PWAReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="pwa-toast-container">
      <div className="pwa-toast">
        <div className="pwa-message">
          {offlineReady ? (
            <span>App ready to work offline</span>
          ) : (
            <span>New content available, click on reload button to update.</span>
          )}
        </div>
        <div className="pwa-actions">
          {needRefresh && (
            <button className="pwa-btn pwa-btn-reload" onClick={() => updateServiceWorker(true)}>
              Reload
            </button>
          )}
          <button className="pwa-btn pwa-btn-close" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAReloadPrompt;
