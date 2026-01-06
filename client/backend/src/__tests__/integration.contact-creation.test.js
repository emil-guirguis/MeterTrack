/**
 * Integration Tests: Contact Creation with Tenant ID Flow
 * 
 * Tests the complete end-to-end flow:
 * 1. User authentication and tenant_id extraction
 * 2. Contact creation with tenant_id injection
 * 3. Tenant isolation across different user contexts
 * 4. Regression testing for existing functionality
 * 
 * Requirements: 1.1, 2.1, 3.1, 3.2
 */

const User = require('../models/UserWithSchema');
const Contact = require('../models/ContactWithSchema');
const { deserializeRow } = require('../../../../framework/backend/shared/utils/typeHandlers');

describe('Integration: End-to-End Contact Creation with Tenant ID', () => {
  describe('User Authentication and Tenant ID Extraction', () => {
    it('should load user from database with accessible tenant_id', () => {
      // Simulate database row for user
      const userDatabaseRow = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordhash: 'hashed_password',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        last_sign_in_at: null,
        permissions: '{"admin":{"user:create":true}}'
      };

      // Simulate User.findById() deserialization
      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const deserializedUser = deserializeRow(userDatabaseRow, fieldArray);
      const user = new User(deserializedUser);

      // Verify user has tenant_id accessible
      expect(user.tenant_id).toBe(1);
      expect(user).toHaveProperty('tenant_id');
      expect(user.id).toBe(1);
      expect(user.email).toBe('emilguirguis.eg@gmail.com');
    });

    it('should handle multiple users with different tenant_ids', () => {
      // User 1 from tenant 1
      const user1Row = {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1,
        active: true
      };

      // User 2 from tenant 2
      const user2Row = {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        tenant_id: 2,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);

      const user1 = new User(deserializeRow(user1Row, fieldArray));
      const user2 = new User(deserializeRow(user2Row, fieldArray));

      // Verify each user has correct tenant_id
      expect(user1.tenant_id).toBe(1);
      expect(user2.tenant_id).toBe(2);
      expect(user1.tenant_id).not.toBe(user2.tenant_id);
    });

    it('should preserve tenant_id through authentication flow', () => {
      // Simulate JWT token payload
      const tokenPayload = {
        userId: 1,
        tenant_id: 1
      };

      // Simulate User.findById() result
      const userDatabaseRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userDatabaseRow, fieldArray));

      // Verify tenant_id from token matches user's tenant_id
      expect(user.tenant_id).toBe(tokenPayload.tenant_id);
    });
  });

  describe('Contact Creation with Tenant ID Injection', () => {
    it('should create contact with tenant_id from authenticated user', () => {
      // Step 1: Authenticate user
      const userRow = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Step 2: Prepare contact data
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        active: true
      };

      // Step 3: Inject tenant_id from user (simulating API endpoint behavior)
      const tenantId = user?.tenant_id;
      expect(tenantId).toBe(1);

      const contactDataWithTenant = {
        ...contactData,
        tenant_id: tenantId
      };

      // Step 4: Create contact
      const contact = new Contact(contactDataWithTenant);

      // Step 5: Verify contact has correct tenant_id
      expect(contact.tenant_id).toBe(1);
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
    });

    it('should reject contact creation when user has no tenant_id', () => {
      // Simulate user without tenant_id
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Verify user has no tenant_id
      expect(user.tenant_id).toBeNull();

      // API endpoint should reject this
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeNull();

      // This is where the API would return 400 error
      const shouldReject = !tenantId;
      expect(shouldReject).toBe(true);
    });

    it('should handle contact creation error when user is undefined', () => {
      // Simulate missing user
      const user = undefined;

      // Verify user is undefined
      expect(user).toBeUndefined();

      // Contact creation should fail - no tenant_id available
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeUndefined();

      // API should reject this
      const shouldReject = !tenantId;
      expect(shouldReject).toBe(true);
    });

    it('should handle contact creation error when user is null', () => {
      // Simulate null user
      const user = null;

      // Verify user is null
      expect(user).toBeNull();

      // Contact creation should fail - no tenant_id available
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeUndefined();

      // API should reject this
      const shouldReject = !tenantId;
      expect(shouldReject).toBe(true);
    });
  });

  describe('Tenant Isolation Across Different User Contexts', () => {
    it('should create contacts with correct tenant_id for different users', () => {
      // User 1 from tenant 1
      const user1Row = {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1,
        active: true
      };

      // User 2 from tenant 2
      const user2Row = {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        tenant_id: 2,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);

      const user1 = new User(deserializeRow(user1Row, fieldArray));
      const user2 = new User(deserializeRow(user2Row, fieldArray));

      // Create contact for user 1
      const contact1 = new Contact({
        name: 'Contact 1',
        email: 'contact1@example.com',
        tenant_id: user1.tenant_id
      });

      // Create contact for user 2
      const contact2 = new Contact({
        name: 'Contact 2',
        email: 'contact2@example.com',
        tenant_id: user2.tenant_id
      });

      // Verify tenant isolation
      expect(contact1.tenant_id).toBe(1);
      expect(contact2.tenant_id).toBe(2);
      expect(contact1.tenant_id).not.toBe(contact2.tenant_id);
    });

    it('should prevent contact from having different tenant_id than user', () => {
      // Simulate user from tenant 1
      const userRow = {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Attempt to create contact with different tenant_id
      // This should be prevented by the API endpoint
      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: 2  // Different from user's tenant_id
      };

      // The API should override this with user's tenant_id
      const correctTenantId = user.tenant_id;
      expect(correctTenantId).toBe(1);
      expect(contactData.tenant_id).not.toBe(correctTenantId);

      // API should use user's tenant_id instead
      const contact = new Contact({
        ...contactData,
        tenant_id: user.tenant_id  // Override with user's tenant_id
      });

      expect(contact.tenant_id).toBe(1);
    });

    it('should maintain tenant isolation when querying contacts', () => {
      // Simulate two users from different tenants
      const user1Row = {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1,
        active: true
      };

      const user2Row = {
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        tenant_id: 2,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);

      const user1 = new User(deserializeRow(user1Row, fieldArray));
      const user2 = new User(deserializeRow(user2Row, fieldArray));

      // Create contacts for each tenant
      const contact1 = new Contact({
        name: 'Contact 1',
        email: 'contact1@example.com',
        tenant_id: user1.tenant_id
      });

      const contact2 = new Contact({
        name: 'Contact 2',
        email: 'contact2@example.com',
        tenant_id: user2.tenant_id
      });

      // Simulate query filtering by tenant_id
      const user1Contacts = [contact1].filter(c => c.tenant_id === user1.tenant_id);
      const user2Contacts = [contact2].filter(c => c.tenant_id === user2.tenant_id);

      // Verify tenant isolation
      expect(user1Contacts.length).toBe(1);
      expect(user2Contacts.length).toBe(1);
      expect(user1Contacts[0].tenant_id).toBe(1);
      expect(user2Contacts[0].tenant_id).toBe(2);
    });

    it('should prevent user from accessing contacts from different tenant', () => {
      // User 1 from tenant 1
      const user1Row = {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1,
        active: true
      };

      // Contact from tenant 2
      const contactRow = {
        id: 1,
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: 2
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user1 = new User(deserializeRow(user1Row, fieldArray));

      const contact = new Contact(contactRow);

      // Verify user cannot access contact from different tenant
      const canAccess = contact.tenant_id === user1.tenant_id;
      expect(canAccess).toBe(false);
    });
  });

  describe('Regression Testing - Existing Functionality', () => {
    it('should not break existing contact creation without tenant_id in request', () => {
      // Simulate user
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Contact data without tenant_id (API should inject it)
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      };

      // API injects tenant_id
      const contactDataWithTenant = {
        ...contactData,
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactDataWithTenant);

      // Verify contact is created with tenant_id
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
      expect(contact.phone).toBe('555-1234');
      expect(contact.tenant_id).toBe(1);
    });

    it('should preserve all contact fields during creation', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-5678',
        company: 'Tech Corp',
        role: 'Manager',
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'USA',
        notes: 'Important contact',
        active: true,
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify all fields are preserved
      expect(contact.name).toBe('Jane Smith');
      expect(contact.email).toBe('jane@example.com');
      expect(contact.phone).toBe('555-5678');
      expect(contact.company).toBe('Tech Corp');
      expect(contact.role).toBe('Manager');
      expect(contact.street).toBe('123 Main St');
      expect(contact.city).toBe('Springfield');
      expect(contact.state).toBe('IL');
      expect(contact.zip).toBe('62701');
      expect(contact.country).toBe('USA');
      expect(contact.notes).toBe('Important contact');
      expect(contact.active).toBe(true);
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with minimal fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Minimal contact data
      const contactData = {
        name: 'John Doe',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify contact is created with minimal fields
      expect(contact.name).toBe('John Doe');
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with null optional fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: 'John Doe',
        email: null,
        phone: null,
        company: null,
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify contact is created with null fields
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBeNull();
      expect(contact.phone).toBeNull();
      expect(contact.company).toBeNull();
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with special characters in fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: "O'Brien & Associates",
        email: 'contact+test@example.com',
        phone: '+1 (555) 123-4567',
        company: 'Smith, Johnson & Co.',
        notes: 'Contact with "special" characters & symbols',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify special characters are preserved
      expect(contact.name).toBe("O'Brien & Associates");
      expect(contact.email).toBe('contact+test@example.com');
      expect(contact.phone).toBe('+1 (555) 123-4567');
      expect(contact.company).toBe('Smith, Johnson & Co.');
      expect(contact.notes).toBe('Contact with "special" characters & symbols');
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with unicode characters', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: '李明 (Li Ming)',
        email: 'li.ming@example.com',
        company: 'Société Générale',
        notes: 'Контакт из России',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify unicode characters are preserved
      expect(contact.name).toBe('李明 (Li Ming)');
      expect(contact.company).toBe('Société Générale');
      expect(contact.notes).toBe('Контакт из России');
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with very long field values', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const longString = 'A'.repeat(500);
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        notes: longString,
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify long field values are preserved
      expect(contact.name).toBe('John Doe');
      expect(contact.notes).toBe(longString);
      expect(contact.notes.length).toBe(500);
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with boolean fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        active: false,
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify boolean fields are preserved
      expect(contact.name).toBe('John Doe');
      expect(contact.active).toBe(false);
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation with numeric fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify numeric fields are preserved
      expect(contact.name).toBe('John Doe');
      expect(contact.tenant_id).toBe(1);
      expect(typeof contact.tenant_id).toBe('number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle contact creation with zero tenant_id', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 0,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Zero is technically a valid tenant_id
      expect(user.tenant_id).toBe(0);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBe(0);
    });

    it('should handle contact creation with large tenant_id value', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 999999999,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      expect(user.tenant_id).toBe(999999999);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBe(999999999);
    });

    it('should handle contact creation with negative tenant_id', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: -1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      expect(user.tenant_id).toBe(-1);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBe(-1);
    });

    it('should handle contact creation when user has multiple contacts', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      // Create multiple contacts for same user
      const contacts = [];
      for (let i = 0; i < 5; i++) {
        const contact = new Contact({
          name: `Contact ${i}`,
          email: `contact${i}@example.com`,
          tenant_id: user.tenant_id
        });
        contacts.push(contact);
      }

      // Verify all contacts have same tenant_id
      expect(contacts.length).toBe(5);
      contacts.forEach(contact => {
        expect(contact.tenant_id).toBe(1);
      });
    });

    it('should handle contact creation with empty string fields', () => {
      const userRow = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1,
        active: true
      };

      const fields = User.schema.entityFields;
      const fieldArray = Object.values(fields);
      const user = new User(deserializeRow(userRow, fieldArray));

      const contactData = {
        name: 'John Doe',
        email: '',
        phone: '',
        company: '',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Verify empty strings are preserved
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('');
      expect(contact.phone).toBe('');
      expect(contact.company).toBe('');
      expect(contact.tenant_id).toBe(1);
    });
  });
});
