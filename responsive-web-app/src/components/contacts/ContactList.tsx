import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataList } from '../common/DataList';
import { FormModal } from '../common/FormModal';
import { useContactsEnhanced } from '../../store/entities/contactsStore';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
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
  const { checkPermission } = useAuth();
  const contacts = useContactsEnhanced();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.CONTACT_CREATE);
  const canUpdate = checkPermission(Permission.CONTACT_UPDATE);
  const canDelete = checkPermission(Permission.CONTACT_DELETE);

  // Load contacts on component mount
  useEffect(() => {
    contacts.fetchItems();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filters: Record<string, any> = {};
    
    if (categoryFilter) filters.category = categoryFilter;
    if (statusFilter) filters.status = statusFilter;
    if (industryFilter) filters.industry = industryFilter;
    if (businessTypeFilter) filters.businessType = businessTypeFilter;
    
    contacts.setFilters(filters);
    contacts.setSearch(searchQuery);
    contacts.fetchItems();
  }, [searchQuery, categoryFilter, statusFilter, industryFilter, businessTypeFilter]);

  // Define table columns
  const columns: ColumnDefinition<Contact>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Contact Name',
      sortable: true,
      render: (value, contact) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">{value}</div>
          <div className="table-cell__secondary">
            <span className={`badge badge--${contact.category === 'customer' ? 'primary' : 'secondary'}`}>
              {contact.category?.charAt(0).toUpperCase() + contact.category?.slice(1) || 'Unknown'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      label: 'Contact Person',
      sortable: true,
      render: (value, contact) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">{value}</div>
          <div className="table-cell__secondary">{contact.company || contact.role || contact.email}</div>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value) => (
        <a href={`tel:${value}`} className="contact-list__phone-link">
          {value}
        </a>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`status-indicator status-indicator--${value}`}>
          <span className={`status-dot status-dot--${value}`}></span>
          {value === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'address.city',
      label: 'Location',
      sortable: true,
      render: (_, contact) => (
        <div className="contact-list__location">
          <div>{contact.address_city}, {contact.address_state}</div>
          <div className="contact-list__zip">{contact.address_zip_code}</div>
        </div>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'industry',
      label: 'Industry',
      sortable: true,
      render: (value) => value || 'N/A',
      responsive: 'hide-tablet',
    },
    {
      key: 'businessType',
      label: 'Business Type',
      sortable: true,
      render: (value) => value || 'N/A',
      responsive: 'hide-tablet',
    },
    {
      key: 'tags',
      label: 'Tags',
      sortable: false,
      render: (value) => (
        <div className="contact-list__tags">
          {value && value.length > 0 ? (
            value.slice(0, 2).map((tag: string, index: number) => (
              <span key={index} className="badge badge--neutral">
                {tag}
              </span>
            ))
          ) : (
            <span className="contact-list__no-tags">No tags</span>
          )}
          {value && value.length > 2 && (
            <span className="contact-list__more-tags">+{value.length - 2}</span>
          )}
        </div>
      ),
      responsive: 'hide-mobile',
    },
  ], []);

  // Define bulk actions
  const bulkActions: BulkAction<Contact>[] = useMemo(() => {
    const actions: BulkAction<Contact>[] = [];

    if (canUpdate) {
      actions.push(
        {
          key: 'activate',
          label: 'Activate',
          icon: '✅',
          color: 'success',
          action: async (selectedContacts) => {
            const contactIds = selectedContacts.map(c => c.id);
            await contacts.bulkUpdateStatus(contactIds, 'active');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to activate the selected contacts?',
        },
        {
          key: 'deactivate',
          label: 'Deactivate',
          icon: '❌',
          color: 'warning',
          action: async (selectedContacts) => {
            const contactIds = selectedContacts.map(c => c.id);
            await contacts.bulkUpdateStatus(contactIds, 'inactive');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to deactivate the selected contacts?',
        }
      );
    }

    actions.push({
      key: 'export',
      label: 'Export CSV',
      icon: '📄',
      color: 'primary',
      action: async (selectedContacts) => {
        exportContactsToCSV(selectedContacts);
      },
    });

    return actions;
  }, [canUpdate, contacts]);

  // Handle contact actions
  const handleContactView = useCallback((contact: Contact) => {
    onContactSelect?.(contact);
  }, [onContactSelect]);

  const handleContactEdit = useCallback((contact: Contact) => {
    if (!canUpdate) return;
    onContactEdit?.(contact);
  }, [canUpdate, onContactEdit]);

  const handleContactDelete = useCallback(async (contact: Contact) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete contact "${contact.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      await contacts.deleteContact(contact.id);
    }
  }, [canDelete, contacts]);

  // Export functionality
  const exportContactsToCSV = useCallback((contactsToExport: Contact[]) => {
    const headers = [
      'Name', 'Type', 'Contact Person', 'Email', 'Phone', 'Status', 
      'Street', 'City', 'State', 'Zip Code', 'Country',
      'Business Type', 'Industry', 'Website', 'Tags', 'Notes', 'Created'
    ];
    const csvContent = [
      headers.join(','),
      ...contactsToExport.map(contact => [
        `"${contact.name}"`,
        contact.category,
        `"${contact.company || contact.role || ''}"`,
        contact.email,
        contact.phone,
        contact.status,
        `"${contact.address_street || ''}"`,
        `"${contact.address_city || ''}"`,
        contact.address_state || '',
        contact.address_zip_code || '',
        contact.address_country || '',
        contact.businessType || '',
        contact.industry || '',
        contact.website || '',
        contact.tags ? contact.tags.join(';') : '',
        contact.notes ? `"${contact.notes.replace(/"/g, '""')}"` : '',
        new Date(contact.createdat).toISOString(),
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllContacts = useCallback(() => {
    exportContactsToCSV(contacts.items);
    setShowExportModal(false);
  }, [contacts.items, exportContactsToCSV]);

  // Get unique values for filters
  const uniqueIndustries = useMemo(() => {
    const industries = contacts.items
      .map(c => c.industry)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return industries;
  }, [contacts.items]);

  const uniqueBusinessTypes = useMemo(() => {
    const types = contacts.items
      .map(c => c.businessType)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return types;
  }, [contacts.items]);

  const filters = (
    <>
      <div className="contact-list__search">
        <input
          type="text"
          placeholder="Search contacts by name, person, email, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="contact-list__search-input"
        />
      </div>

      <div className="contact-list__filter-group">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="contact-list__filter-select"
          aria-label="Filter by category"
        >
          <option value="">All Types</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="contact-list__filter-select"
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="contact-list__filter-select"
          aria-label="Filter by industry"
        >
          <option value="">All Industries</option>
          {uniqueIndustries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>

        <select
          value={businessTypeFilter}
          onChange={(e) => setBusinessTypeFilter(e.target.value)}
          className="contact-list__filter-select"
          aria-label="Filter by business type"
        >
          <option value="">All Business Types</option>
          {uniqueBusinessTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {(categoryFilter || statusFilter || industryFilter || businessTypeFilter || searchQuery) && (
          <button
            type="button"
            className="contact-list__clear-filters"
            onClick={() => {
              setCategoryFilter('');
              setStatusFilter('');
              setIndustryFilter('');
              setBusinessTypeFilter('');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </>
  );

  const headerActions = (
    <div className="data-table__header-actions-inline">
      <button
        type="button"
        className="contact-list__btn contact-list__btn--secondary"
        onClick={() => setShowExportModal(true)}
        aria-label="Export contacts to CSV"
      >
        📄 Export CSV
      </button>

      {canCreate && (
        <button
          type="button"
          className="contact-list__btn contact-list__btn--primary"
          onClick={onContactCreate}
          aria-label="Add a contact"
        >
          ➕ Add Contact
        </button>
      )}
    </div>
  );

  const stats = (
    <div className="list__stats">
      <div className="list__stat">
        <span className="list__stat-value">{contacts.customers.length}</span>
        <span className="list__stat-label">Customers</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{contacts.vendors.length}</span>
        <span className="list__stat-label">Vendors</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{contacts.activeContacts.length}</span>
        <span className="list__stat-label">Active Contacts</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{Object.keys(contacts.contactsByIndustry).length}</span>
        <span className="list__stat-label">Industries</span>
      </div>
    </div>
  );

  return (
    <div className="contact-list">
      <DataList
        title="Contacts"
        filters={filters}
        headerActions={headerActions}
        stats={stats}
        data={contacts.items}
        columns={columns}
        loading={contacts.list.loading}
        error={contacts.list.error || undefined}
        emptyMessage="No contacts found. Create your first contact to get started."
        onView={handleContactView}
        onEdit={canUpdate ? handleContactEdit : undefined}
        onDelete={canDelete ? handleContactDelete : undefined}
        onSelect={bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={bulkActions}
        pagination={{
          currentPage: contacts.list.page,
          pageSize: contacts.list.pageSize,
          total: contacts.list.total,
          onPageChange: (page) => {
            contacts.setPage(page);
            contacts.fetchItems();
          },
          onPageSizeChange: (size) => {
            contacts.setPageSize(size);
            contacts.fetchItems();
          },
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Export Modal */}
      <FormModal
        isOpen={showExportModal}
        title="Export Contacts"
        onClose={() => setShowExportModal(false)}
        onSubmit={exportAllContacts}
      >
        <div className="contact-list__export-content">
          <p>Export all contacts to CSV format?</p>
          <p className="contact-list__export-info">
            This will include: Name, Type, Contact Person, Email, Phone, Address, Business Info, and Created Date
          </p>
          <p className="contact-list__export-count">
            <strong>{contacts.items.length} contacts</strong> will be exported.
          </p>
        </div>
      </FormModal>
    </div>
  );
};