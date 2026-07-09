import React, { useState, createContext, useContext, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

let toastIdCounter = 0;

const generateId = () => `toast-${++toastIdCounter}-${Date.now()}`;

const TOAST_CONFIGS: Record<
  ToastType,
  { icon: React.ElementType; color: string; bgColor: string; borderColor: string }
> = {
  success: {
    icon: CheckCircle2,
    color: '#22c55e',
    bgColor: 'rgba(52, 199, 89, 0.08)',
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  error: {
    icon: XCircle,
    color: '#ff3b30',
    bgColor: 'rgba(255, 59, 48, 0.08)',
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  warning: {
    icon: AlertTriangle,
    color: '#ff9f0a',
    bgColor: 'rgba(255, 159, 10, 0.08)',
    borderColor: 'rgba(255, 159, 10, 0.25)',
  },
  info: {
    icon: Info,
    color: '#007aff',
    bgColor: 'rgba(0, 122, 255, 0.08)',
    borderColor: 'rgba(0, 122, 255, 0.25)',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = generateId();
    const toast: Toast = { ...toastData, id };
    setToasts((prev) => [...prev, toast]);

    const duration = toastData.duration ?? (toastData.type === 'error' ? 6000 : 4000);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const config = TOAST_CONFIGS[toast.type];
  const Icon = config.icon;
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`toast-item ${isExiting ? 'exiting' : ''}`}
      style={{
        background: config.bgColor,
        borderLeftColor: config.color,
        borderLeftWidth: '3px',
      }}
    >
      <div className="toast-icon-wrapper" style={{ color: config.color }}>
        <Icon size={18} />
      </div>

      <div className="toast-content">
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>

      {toast.action && (
        <button
          className="btn btn-primary btn-sm"
          onClick={toast.action.onClick}
          style={{ fontSize: '12px', padding: '4px 12px' }}
        >
          {toast.action.label}
        </button>
      )}

      <button
        className="icon-btn toast-close"
        onClick={handleClose}
        style={{ width: 22, height: 22, opacity: 0.6 }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
