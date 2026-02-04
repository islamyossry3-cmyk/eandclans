import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-orange-500',
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl p-4 min-w-[300px] max-w-md border-l-4 animate-slideIn"
      style={{ borderLeftColor: colors[type].replace('bg-', '') }}
    >
      <div className={`${colors[type]} text-white rounded-full p-1`}>
        {icons[type]}
      </div>
      <p className="flex-1 text-gray-900 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
