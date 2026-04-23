declare module 'virtual:pwa-register/react' {
  type RegisterSWOptions = {
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: unknown) => void;
  };

  type RegisterSWReturn = {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  };

  export function useRegisterSW(options?: RegisterSWOptions): RegisterSWReturn;
}
