import React from 'react';
import { DataList } from '@framework/lists/components/DataList';
import { useContactsEnhanced } from '../../store/entities/contactsStore';
import { useBaseList } from '@framework/lists/hooks/useBaseList';
import type { Contact } from '../../types/entities';
import { Permission } from '../../types/auth';
import {
  contactColumns,
  contactFilters,
  contactStats,
  createContactBulkActions,
  contactExportConfig,
} from '../../config/contactConfig';
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';
import './ContactList.css';
import '../common/ListStats.css';
import '../common/TableCellStyles.css';

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactCreate?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onContactSelect,
  onContactEdit,
  onContactCreate,
}) => {
  const contacts = useContactsEnhanced();
  

  
  // Wrap bulkUpdateStatus to match expected signature
  const bulkUpdateStatusWrapper = async (ids: string[], status: string) => {
    await contacts.bulkUpdateStatus(ids, status as 'active' | 'inactive');
  };

  // Custom delete handler for contacts
  const handleContactDelete = (contact: Contact) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Contact',
      message: `Delete contact "${contact.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await contacts.deleteItem(contact.id);
        await contacts.fetchItems();
      }
    });
  };
  
  // Initialize base list hook with contact configuration
  const baseList = useBaseList<Contact, any>({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.CONTACT_CREATE,
      update: Permission.CONTACT_UPDATE,
      delete: Permission.CONTACT_DELETE,
    },
    columns: contactColumns,
    filters: contactFilters,
    stats: contactStats,
    bulkActions: createContactBulkActions(
      { bulkUpdateStatus: bulkUpdateStatusWrapper },
      (items) => baseList.handleExport(items)
    ),
    export: contactExportConfig,
    onEdit: onContactEdit,
    onCreate: onContactCreate,
  });

  

  // Safety check - ensure data is always an array
  const safeData = Array.isArray(baseList.data) ? baseList.data : [];
  
  // Debug: Check data structure
  console.log('ContactList data:', {
    dataLength: safeData.length,
    firstItem: safeData[0],
    columns: baseList.columns,
  });

  return (
    <div className="contact-list">
      <DataList
        title="Contacts"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={safeData}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No contacts found. Create your first contact to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleContactDelete}
        onSelect={baseList.bulkActions.length > 0 && onContactSelect ? (items) => onContactSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
