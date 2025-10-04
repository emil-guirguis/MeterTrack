import React, { useState } from 'react';
import { ContactList } from '../../components/contacts/ContactList';
import { ContactForm } from '../../components/contacts/ContactForm';
import { ContactDetail } from '../../components/contacts/ContactDetail';
import type { Contact } from '../../types/entities';
import AppLayout from '../../components/layout/AppLayout';
import './ContactManagementPage.css';

export const ContactManagementPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setEditingContact(null);
    setShowForm(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <AppLayout title="Contact Management">
      <div className="contact-management-page">
        <h1>Contact Management</h1>
        <ContactList
          onContactSelect={handleSelect}
          onContactEdit={handleEdit}
          onContactCreate={handleCreate}
        />
        {showForm && (
          <ContactForm
            contact={editingContact || undefined}
            onCancel={handleFormClose}
            onSubmit={async () => {}}
          />
        )}
        {selectedContact && !showForm && (
          <ContactDetail contact={selectedContact} onClose={() => setSelectedContact(null)} />
        )}
      </div>
    </AppLayout>
  );
};
