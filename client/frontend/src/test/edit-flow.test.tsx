import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactManagementPage } from '../components/contacts';
import { BrowserRouter } from 'react-router-dom';

// Mock the stores and services
vi.mock('../store/entities/contactsStore', () => ({
  useContactsEnhanced: () => ({
    items: [
      {
        id: '1',
        name: 'Test Contact 1',
        email: 'test1@example.com',
        phone: '555-0001',
        category: 'customer',
        status: 'active',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
      },
      {
        id: '2',
        name: 'Test Contact 2',
        email: 'test2@example.com',
        phone: '555-0002',
        category: 'vendor',
        status: 'active',
        address: '456 Oak Ave',
        city: 'Test Town',
        state: 'TT',
        zip: '67890',
        country: 'US',
      },
      {
        id: '3',
        name: 'Test Contact 3',
        email: 'test3@example.com',
        phone: '555-0003',
        category: 'customer',
        status: 'inactive',
        address: '789 Pine Rd',
        city: 'Test Village',
        state: 'TV',
        zip: '11111',
        country: 'US',
      },
    ],
    loading: false,
    error: null,
    fetchItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    bulkUpdateStatus: vi.fn(),
  }),
}));

vi.mock('../components/contacts/ContactList', () => ({
  ContactList: ({ onContactEdit, onContactCreate }: any) => (
    <div data-testid="contact-list">
      <button onClick={() => onContactEdit({
        id: '1',
        name: 'Test Contact 1',
        email: 'test1@example.com',
        phone: '555-0001',
        category: 'customer',
        status: 'active',
      })}>
        Edit Contact 1
      </button>
      <button onClick={() => onContactEdit({
        id: '2',
        name: 'Test Contact 2',
        email: 'test2@example.com',
        phone: '555-0002',
        category: 'vendor',
        status: 'active',
      })}>
        Edit Contact 2
      </button>
      <button onClick={onContactCreate}>Create Contact</button>
    </div>
  ),
}));

vi.mock('../features/contacts/ContactForm', () => ({
  ContactForm: ({ contact, onCancel }: any) => (
    <div data-testid="contact-form">
      <div data-testid="form-mode">{contact ? 'edit' : 'create'}</div>
      {contact && (
        <>
          <div data-testid="contact-id">{contact.id}</div>
          <div data-testid="contact-name">{contact.name}</div>
          <div data-testid="contact-email">{contact.email}</div>
        </>
      )}
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../components/common/FormModal', () => ({
  FormModal: ({ isOpen, title, children }: any) => (
    isOpen ? (
      <div data-testid="form-modal" role="dialog">
        <h2 data-testid="modal-title">{title}</h2>
        {children}
      </div>
    ) : null
  ),
}));

describe('Edit Flow End-to-End Tests', () => {
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <ContactManagementPage />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open modal with populated form when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    // Click edit button for first contact
    const editButton = screen.getByText('Edit Contact 1');
    await user.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    // Verify modal title
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit Contact');

    // Verify form is in edit mode
    expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');

    // Verify form is populated with contact data
    expect(screen.getByTestId('contact-id')).toHaveTextContent('1');
    expect(screen.getByTestId('contact-name')).toHaveTextContent('Test Contact 1');
    expect(screen.getByTestId('contact-email')).toHaveTextContent('test1@example.com');
  });

  it('should update form data when editing different contacts', async () => {
    const user = userEvent.setup();
    renderPage();

    // Edit first contact
    await user.click(screen.getByText('Edit Contact 1'));
    await waitFor(() => {
      expect(screen.getByTestId('contact-name')).toHaveTextContent('Test Contact 1');
    });

    // Close modal
    await user.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
    });

    // Edit second contact
    await user.click(screen.getByText('Edit Contact 2'));
    await waitFor(() => {
      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    // Verify form shows second contact's data (not first)
    expect(screen.getByTestId('contact-id')).toHaveTextContent('2');
    expect(screen.getByTestId('contact-name')).toHaveTextContent('Test Contact 2');
    expect(screen.getByTestId('contact-email')).toHaveTextContent('test2@example.com');
  });

  it('should show empty form when create button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    // Click create button
    await user.click(screen.getByText('Create Contact'));

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    });

    // Verify modal title
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create New Contact');

    // Verify form is in create mode
    expect(screen.getByTestId('form-mode')).toHaveTextContent('create');

    // Verify no contact data is shown
    expect(screen.queryByTestId('contact-id')).not.toBeInTheDocument();
  });

  it('should properly switch between edit and create modes', async () => {
    const user = userEvent.setup();
    renderPage();

    // Edit a contact
    await user.click(screen.getByText('Edit Contact 1'));
    await waitFor(() => {
      expect(screen.getByTestId('contact-name')).toHaveTextContent('Test Contact 1');
    });

    // Close and create new
    await user.click(screen.getByText('Cancel'));
    await user.click(screen.getByText('Create Contact'));

    await waitFor(() => {
      expect(screen.getByTestId('form-mode')).toHaveTextContent('create');
    });

    // Verify no stale data
    expect(screen.queryByTestId('contact-id')).not.toBeInTheDocument();
  });

  it('should handle rapid contact switching', async () => {
    const user = userEvent.setup();
    renderPage();

    // Rapidly switch between contacts
    await user.click(screen.getByText('Edit Contact 1'));
    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('1');
    });

    await user.click(screen.getByText('Cancel'));
    await user.click(screen.getByText('Edit Contact 2'));
    
    await waitFor(() => {
      expect(screen.getByTestId('contact-id')).toHaveTextContent('2');
    });

    // Verify correct contact is shown
    expect(screen.getByTestId('contact-name')).toHaveTextContent('Test Contact 2');
  });
});
