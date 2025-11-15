import React, { useState } from 'react';
import { ContactList } from '../../components/contacts/ContactList';
import { ContactForm } from '../../components/contacts/ContactForm';
import { FormModal } from '../../components/common/FormModal';
import type { Contact } from '../../types/entities';
import AppLayout from '../../components/layout/AppLayout';
import './ContactManagementPage.css';
import { ContactDetail } from '../../components/contacts';

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
    setSelectedContact(null); // Clear selected contact when editing
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
        
        {/* Form Modal */}
        <FormModal
          isOpen={showForm}
          title={editingContact ? 'Edit Contact' : 'Create New Contact'}
          onClose={handleFormClose}
          onSubmit={() => {}} // ContactForm handles its own submission
          size="lg"
        >
          <ContactForm
            contact={editingContact || undefined}
            onCancel={handleFormClose}
            onSubmit={async () => {}}
          />
        </FormModal>

        {selectedContact && !showForm && (
          <ContactDetail contact={selectedContact} onClose={() => setSelectedContact(null)} />
        )}
      </div>
    </AppLayout>
  );
};
