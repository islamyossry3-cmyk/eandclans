import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-gradient-to-br from-gray-800 via-gray-900 to-stone-900 rounded-[2rem] border-4 border-amber-600 shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-gradient-to-r from-stone-800 via-stone-900 to-gray-900 border-b-4 border-amber-700 px-6 py-4 flex items-center justify-between shadow-lg">
          <h2 className="text-2xl font-bold text-amber-300 uppercase tracking-wider drop-shadow-lg">{title}</h2>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-amber-200 transition-colors p-2 rounded-2xl hover:bg-amber-900/30"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 bg-gradient-to-b from-stone-900/50 to-stone-950/50">{children}</div>
      </div>
    </div>
  );
}
