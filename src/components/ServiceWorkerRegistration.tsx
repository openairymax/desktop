import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('新版本可用，是否立即更新？')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        void 0;
      },
      onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(_error: Error) {
        void 0;
      },
    });
  }, []);

  return null;
}

export default ServiceWorkerRegistration;
