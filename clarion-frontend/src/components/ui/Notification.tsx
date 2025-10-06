import { CheckCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NotificationProps {
  show: boolean;
  onDismiss: () => void;
  message: string;
  duration?: number;
}

const Notification = ({ show, onDismiss, message }: NotificationProps) => {
  if (!show) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-5 right-5 z-50 flex items-center gap-4 p-4 rounded-lg shadow-lg bg-gray-medium border border-gray-light',
      'animate-in slide-in-from-bottom-5 fade-in-0 duration-300'
    )}>
      <CheckCircle className='w-6 h-6 text-accent-green flex-shrink-0' />
      <p className='text-sm font-medium text-text-primary'>{message}</p>
      <button onClick={onDismiss} className='p-1 rounded-md hover:bg-gray-light/50 text-text-secondary'>
        <X size={16} />
      </button>
    </div>
  );
};

export default Notification;