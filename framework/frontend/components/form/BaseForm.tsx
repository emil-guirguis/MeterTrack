import React from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import type { SidebarSectionProps } from '../sidebar/Sidebar';
import './BaseForm.css';

export interface BaseFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  sidebarSections?: SidebarSectionProps[];
  sidebarChildren?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
}

/**
 * Base Form Component
 * 
 * Provides a consistent form layout with:
 * - Main content area for form fields
 * - Right sidebar for actions and metadata
 * - Collapsible action sections
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <BaseForm
 *   onSubmit={handleSubmit}
 *   sidebarSections={[
 *     {
 *       title: 'Actions',
 *       actions: [
 *         { label: 'Save', onClick: handleSave },
 *         { label: 'Cancel', onClick: handleCancel },
 *       ]
 *     }
 *   ]}
 * >
 *   Form fields go here
 * </BaseForm>
 * ```
 */
export const BaseForm: React.FC<BaseFormProps> = ({
  children,
  onSubmit,
  className = '',
  sidebarSections = [],
  sidebarChildren,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  isDisabled = false,
}) => {
  const formClassName = className ? `base-form ${className}` : 'base-form';

  // Build sidebar sections with actions always included
  const allSidebarSections: SidebarSectionProps[] = [
    {
      title: 'Actions',
      content: (
        <div className="base-form__actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || isDisabled}
              className="base-form__btn base-form__btn--secondary"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isDisabled}
            className="base-form__btn base-form__btn--primary"
          >
            {isSubmitting ? (
              <>
                <span className="base-form__spinner" />
                {submitLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      ),
      collapsible: true,
      defaultCollapsed: false,
    },
    ...sidebarSections,
  ];

  return (
    <form onSubmit={onSubmit} className={formClassName}>
      <div className="base-form__main">
        {children}
      </div>

      <Sidebar sections={allSidebarSections}>
        {sidebarChildren}
      </Sidebar>
    </form>
  );
};

export default BaseForm;
