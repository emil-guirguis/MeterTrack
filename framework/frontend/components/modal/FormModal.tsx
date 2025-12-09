import { Modal } from './Modal';

export interface FormModalProps<T = any> {
  isOpen: boolean;
  title: string;
  data?: T;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit?: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  showSaveButton?: boolean;
  saveLabel?: string;
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
  onSubmit,
  children,
  size = 'md',
  fullScreen = false,
  showSaveButton = false,
  saveLabel = 'Save',
}: FormModalProps<T>) {
  // Wrapper to handle form submission from modal save button
  const handleSave = () => {
    // The form inside will handle submission via its own submit handler
    // This is just a trigger for the modal's save button
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size={size}
      fullScreen={fullScreen}
      loading={loading}
      error={error}
      onSave={handleSave}
      showSaveButton={showSaveButton}
      saveLabel={saveLabel}
    >
      {children}
    </Modal>
  );
}
