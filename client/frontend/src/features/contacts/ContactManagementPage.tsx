import React from 'react';
import { EntityManagementPage } from '@framework/shared/components/EntityManagementPage';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import { FormModal } from '@framework/shared/components/FormModal';
import { useContactsEnhanced } from './contactsStore';
import AppLayout from '../../components/layout/AppLayout';
import type { Contact } from '../../types/entities';

export const ContactManagementPage: React.FC = () => (
  <EntityManagementPage<Contact, ReturnType<typeof useContactsEnhanced>>
    title="Contact Management"
    entityName="contact"
    ListComponent={ContactList}
    FormComponent={ContactForm}
    useStore={useContactsEnhanced}
    LayoutComponent={AppLayout}
    ModalComponent={FormModal}
  />
);
