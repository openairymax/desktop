import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsStandalone(standalone);

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        void outcome;
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      maxWidth: '400px',
      width: 'calc(100% - 40px)',
    }}>
      <div style={{
        flex: 1,
      }}>
        <div style={{
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}>
          安装 AgentRT
        </div>
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
        }}>
          将应用添加到主屏幕，获得更好的体验
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={handleDismiss}
          style={{
            padding: '8px 16px',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          稍后
        </button>
        <button
          onClick={handleInstall}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--info-color))',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}
        >
          安装
        </button>
      </div>
    </div>
  );
}

export default PWAPrompt;
