import { Modal } from './Modal';

export interface FormModalProps<T = any> {
  isOpen: boolean;
  title: string;
  data?: T;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
}

/**
 * FormModal - A specialized modal component for forms
 * Wraps the framework Modal component with form-specific props
 * Provides consistent modal behavior for all forms in the application
 */
export function FormModal<T = any>({
  isOpen,
  title,
  loading = false,
  error,
  onClose,
  children,
  size = 'md',
  fullScreen = false,
}: FormModalProps<T>) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size={size}
      fullScreen={fullScreen}
      loading={loading}
      error={error}
    >
      {children}
    </Modal>
  );
}
