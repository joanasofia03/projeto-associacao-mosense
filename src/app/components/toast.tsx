import { useEffect } from 'react';

type ToastProps = {
  message: string;
  visible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
};

export default function Toast({ message, visible, onClose, type = 'success' }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? 'bg-[#A4B465]' : 'bg-[#D2665A]';
  const textColor = 'text-white';

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${backgroundColor} ${textColor}`}>
      {message}
    </div>
  );
}
