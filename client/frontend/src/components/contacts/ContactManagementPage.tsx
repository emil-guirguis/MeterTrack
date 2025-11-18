import React from 'react';
import { EntityManagementPage } from '../../../../../framework/frontend/shared/components/EntityManagementPage';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import { FormModal } from '../../../../../framework/frontend/shared/components/FormModal';
import { useContactsEnhanced } from '../../store/entities/contactsStore';
import AppLayout from '../layout/AppLayout';
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
