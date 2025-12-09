/**
 * Contact Form
 * 
 * Uses the dynamic schema-based BaseForm to render the contact form.
 * All validation, field rendering, and form management is handled by BaseForm.
 */

import React from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useContactsEnhanced } from './contactsStore';
import type { Contact } from './contactConfig';
import './ContactForm.css';

interface ContactFormProps {
  contact?: Contact;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const contacts = useContactsEnhanced();

  const fieldSections: Record<string, string[]> = {
    'Contact Information': ['name', 'company', 'role', 'email', 'phone'],
    'Address': ['street', 'street2', 'city', 'state', 'zip', 'country'],
    'Additional Information': ['active', 'notes'],
  };

  return (
    <BaseForm
      schemaName="contact"
      entity={contact}
      store={contacts}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="contact-form"
      fieldSections={fieldSections}
      loading={loading}
      fieldsToClean={['id', 'active', 'status', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags']}
    />
  );
};

export default ContactForm;
