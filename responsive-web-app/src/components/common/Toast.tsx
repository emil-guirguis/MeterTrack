import React, { useEffect } from 'react';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);
  return (
    <div className={`toast toast--${type}`}>
      <span className="toast__message">{message}</span>
      {onClose && (
        <button className="toast__close" onClick={onClose} aria-label="Close">&times;</button>
      )}
    </div>
  );
};

export default Toast;
