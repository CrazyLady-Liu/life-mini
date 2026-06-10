import { useEffect } from 'react';
import { XCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

const typeConfig: Record<ToastType, { icon: typeof Info; bgColor: string; textColor: string; borderColor: string }> = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
};

export default function Toast({
  message,
  type = 'info',
  isOpen,
  onClose,
  duration = 2000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg',
          config.bgColor,
          config.borderColor
        )}
      >
        <Icon className={cn('w-5 h-5 flex-shrink-0', config.textColor)} />
        <span className={cn('text-sm font-medium', config.textColor)}>{message}</span>
      </div>
    </div>
  );
}
