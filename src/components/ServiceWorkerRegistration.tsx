import { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { logger } from '../utils/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('新版本可用，是否立即更新？')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        logger.info('PWA 已可离线使用');
      },
      onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error: Error) {
        // PWA 注册失败不影响应用主流程，记录日志
        logger.warn('PWA ServiceWorker 注册失败', error);
      },
    });
  }, []);

  return null;
}

export default ServiceWorkerRegistration;
