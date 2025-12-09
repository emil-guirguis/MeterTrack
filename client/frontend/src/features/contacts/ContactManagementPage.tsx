import React from 'react';
import { EntityManagementPage, FormModal } from '@framework/shared/components';
import { ContactList } from './ContactList';
import { ContactForm } from './ContactForm';
import { useContactsEnhanced } from './contactsStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { Contact } from './contactConfig';

export const ContactManagementPage: React.FC = () => (
  <EntityManagementPage<Contact, ReturnType<typeof useContactsEnhanced>>
    title="Contact Management"
    entityName="contact"
    ListComponent={ContactList}
    FormComponent={ContactForm}
    useStore={useContactsEnhanced}
    LayoutComponent={AppLayoutWrapper}
    ModalComponent={FormModal}
  />
);
