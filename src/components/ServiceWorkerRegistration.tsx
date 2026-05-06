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
        console.log('AgentOS 已准备好离线使用');
      },
      onRegisteredSW(swUrl, registration) {
        console.log('Service Worker 已注册:', swUrl);
        
        if (registration) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        }
      },
      onRegisterError(error) {
        console.error('Service Worker 注册失败:', error);
      },
    });
    
    return () => {};
  }, []);

  return null;
}

export default ServiceWorkerRegistration;