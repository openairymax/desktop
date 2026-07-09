import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, HelpCircle } from 'lucide-react';

export type ModalType = 'confirm' | 'danger' | 'info' | 'success' | 'warning';

export interface ModalOptions {
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

interface ModalContextValue {
  showModal: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
};

const MODAL_CONFIGS: Record<
  ModalType,
  { icon: React.ElementType; color: string; bg: string; borderColor: string }
> = {
  confirm: {
    icon: HelpCircle,
    color: '#007aff',
    bg: 'rgba(0,122,255,0.08)',
    borderColor: 'rgba(0,122,255,0.25)',
  },
  danger: {
    icon: XCircle,
    color: '#ff3b30',
    bg: 'rgba(255,59,48,0.08)',
    borderColor: 'rgba(255,59,48,0.25)',
  },
  info: {
    icon: Info,
    color: '#007aff',
    bg: 'rgba(0,122,255,0.08)',
    borderColor: 'rgba(0,122,255,0.25)',
  },
  success: {
    icon: CheckCircle2,
    color: '#34c759',
    bg: 'rgba(52,199,89,0.08)',
    borderColor: 'rgba(52,199,89,0.25)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#ff9f0a',
    bg: 'rgba(255,159,10,0.08)',
    borderColor: 'rgba(255,159,10,0.25)',
  },
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modal, setModal] = useState<
    (ModalOptions & { id: number; resolve: (value: boolean) => void }) | null
  >(null);

  const showModal = useCallback((options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Date.now();
      setModal({ ...options, id, resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (modal) {
      modal.resolve(true);
      setModal(null);
    }
  };

  const handleCancel = useCallback(() => {
    if (modal) {
      modal.resolve(false);
      setModal(null);
    }
  }, [modal]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modal) handleCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modal, handleCancel]);

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      {modal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', padding: '28px 32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-lg)',
                background: MODAL_CONFIGS[modal.type || 'confirm'].bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
              }}
            >
              {React.createElement(MODAL_CONFIGS[modal.type || 'confirm'].icon, {
                size: 22,
                color: MODAL_CONFIGS[modal.type || 'confirm'].color,
              })}
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 700,
                margin: '0 0 10px',
                letterSpacing: '-0.022em',
              }}
            >
              {modal.title}
            </h2>

            {/* Message */}
            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.55',
                color: 'var(--text-secondary)',
                margin: '0 0 24px',
              }}
            >
              {modal.message}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                style={{ minWidth: '88px' }}
              >
                {modal.cancelText || '取消'}
              </button>
              <button
                className={`btn ${modal.variant === 'danger' ? 'btn-danger' : modal.variant === 'warning' ? 'btn-warning' : 'btn-primary'}`}
                onClick={handleConfirm}
                style={{ minWidth: '88px' }}
              >
                {modal.confirmText || (modal.type === 'danger' ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
