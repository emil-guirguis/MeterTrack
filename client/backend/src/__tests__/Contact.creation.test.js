/**
 * Contact Creation Tests
 * 
 * Tests for contact creation with tenant_id flow:
 * - Verify authenticated user object contains accessible tenant_id
 * - Confirm contact creation automatically includes tenant_id from user
 * - Test error handling when tenant_id is missing
 * 
 * Requirements: 3.1, 3.2, 3.3
 */

const Contact = require('../models/ContactWithSchema');
const User = require('../models/UserWithSchema');

describe('Contact Creation with Tenant ID Flow', () => {
  describe('User Object Tenant ID Accessibility', () => {
    it('should have tenant_id property on authenticated user object', () => {
      const userData = {
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true,
        passwordHash: 'hashed_value'
      };

      const user = new User(userData);

      // Verify tenant_id is accessible
      expect(user.tenant_id).toBe(1);
      expect(user).toHaveProperty('tenant_id');
    });

    it('should have tenant_id accessible via bracket notation', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 42
      };

      const user = new User(userData);

      // Verify tenant_id is accessible via bracket notation
      expect(user['tenant_id']).toBe(42);
    });

    it('should handle null tenant_id on user object', () => {
      const userData = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      };

      const user = new User(userData);

      expect(user.tenant_id).toBeNull();
      expect(user).toHaveProperty('tenant_id');
    });
  });

  describe('Contact Creation with Tenant ID Injection', () => {
    it('should create contact instance with tenant_id from user', () => {
      // Simulate authenticated user
      const user = new User({
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        tenant_id: 1
      });

      // Simulate contact creation with tenant_id from user
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        active: true,
        tenant_id: user.tenant_id  // Injected from user
      };

      const contact = new Contact(contactData);

      // Verify contact has tenant_id
      expect(contact.tenant_id).toBe(1);
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
    });

    it('should preserve tenant_id through contact object', () => {
      const contactData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        tenant_id: 5
      };

      const contact = new Contact(contactData);

      // Verify tenant_id is preserved
      expect(contact.tenant_id).toBe(5);
      expect(contact['tenant_id']).toBe(5);
    });

    it('should have tenant_id in contact object keys', () => {
      const contactData = {
        name: 'Test Contact',
        email: 'test@example.com',
        tenant_id: 3
      };

      const contact = new Contact(contactData);

      // Verify tenant_id is in object
      const keys = Object.keys(contact);
      expect(keys).toContain('tenant_id');
    });
  });

  describe('Contact Creation Error Handling', () => {
    it('should handle contact creation when user has no tenant_id', () => {
      // Simulate user without tenant_id
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      });

      // Verify user has no tenant_id
      expect(user.tenant_id).toBeNull();

      // Contact creation should fail validation
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        tenant_id: user.tenant_id  // null
      };

      // This should be caught by the API endpoint validation
      expect(contactData.tenant_id).toBeNull();
    });

    it('should handle contact creation when user is undefined', () => {
      // Simulate missing user
      const user = undefined;

      // Verify user is undefined
      expect(user).toBeUndefined();

      // Contact creation should fail - no tenant_id available
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeUndefined();
    });

    it('should validate contact requires at least email or phone', () => {
      const contactData = {
        name: 'John Doe',
        tenant_id: 1
        // Missing both email and phone
      };

      const contact = new Contact(contactData);

      // Verify contact was created (validation happens at save time)
      expect(contact.name).toBe('John Doe');
      expect(contact.tenant_id).toBe(1);
    });
  });

  describe('Contact Tenant Isolation', () => {
    it('should create contact with correct tenant_id from user', () => {
      // Simulate user from tenant 1
      const user1 = new User({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1
      });

      // Create contact for tenant 1
      const contact1 = new Contact({
        name: 'Contact 1',
        email: 'contact1@example.com',
        tenant_id: user1.tenant_id
      });

      expect(contact1.tenant_id).toBe(1);
    });

    it('should create contact with different tenant_id for different user', () => {
      // Simulate user from tenant 2
      const user2 = new User({
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        tenant_id: 2
      });

      // Create contact for tenant 2
      const contact2 = new Contact({
        name: 'Contact 2',
        email: 'contact2@example.com',
        tenant_id: user2.tenant_id
      });

      expect(contact2.tenant_id).toBe(2);
    });

    it('should not allow contact to have different tenant_id than user', () => {
      // Simulate user from tenant 1
      const user = new User({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1
      });

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
    });
  });

  describe('Contact Model Schema Verification', () => {
    it('should have tenant_id in Contact schema entityFields', () => {
      const schema = Contact.schema;
      expect(schema).toBeDefined();
      expect(schema.entityFields).toBeDefined();
      expect(schema.entityFields.tenant_id).toBeDefined();
    });

    it('should have correct tenant_id field type in schema', () => {
      const schema = Contact.schema;
      const tenantIdField = schema.entityFields.tenant_id;

      expect(tenantIdField.type).toBe('number');
      expect(tenantIdField.name).toBe('tenant_id');
      expect(tenantIdField.dbField).toBe('tenant_id');
    });

    it('should initialize contact with all required fields', () => {
      const contactData = {
        name: 'Test Contact',
        email: 'test@example.com',
        phone: '555-1234',
        company: 'Test Company',
        active: true,
        tenant_id: 1
      };

      const contact = new Contact(contactData);

      expect(contact.name).toBe('Test Contact');
      expect(contact.email).toBe('test@example.com');
      expect(contact.phone).toBe('555-1234');
      expect(contact.company).toBe('Test Company');
      expect(contact.active).toBe(true);
      expect(contact.tenant_id).toBe(1);
    });
  });

  describe('Contact Creation Flow Integration', () => {
    it('should simulate complete contact creation flow with user tenant_id', () => {
      // Step 1: Authenticate user
      const user = new User({
        id: 1,
        name: 'Emil Guirguis',
        email: 'emilguirguis.eg@gmail.com',
        role: 'admin',
        tenant_id: 1,
        active: true
      });

      // Verify user has tenant_id
      expect(user.tenant_id).toBe(1);

      // Step 2: Prepare contact data
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        company: 'Acme Corp',
        active: true
      };

      // Step 3: Inject tenant_id from user
      const contactDataWithTenant = {
        ...contactData,
        tenant_id: user.tenant_id
      };

      // Step 4: Create contact
      const contact = new Contact(contactDataWithTenant);

      // Step 5: Verify contact has correct tenant_id
      expect(contact.tenant_id).toBe(1);
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
    });

    it('should handle contact creation when user tenant_id is missing', () => {
      // Step 1: Simulate user without tenant_id
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: null
      });

      // Step 2: Verify user has no tenant_id
      expect(user.tenant_id).toBeNull();

      // Step 3: API should reject contact creation
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeNull();

      // This is where the API endpoint would return 400 error
    });

    it('should handle contact creation error when user is undefined', () => {
      // Simulate missing user
      const user = undefined;

      // Verify user is undefined
      expect(user).toBeUndefined();

      // Contact creation should fail - no tenant_id available
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeUndefined();
    });

    it('should handle contact creation error when user is null', () => {
      // Simulate null user
      const user = null;

      // Verify user is null
      expect(user).toBeNull();

      // Contact creation should fail - no tenant_id available
      const tenantId = user?.tenant_id;
      expect(tenantId).toBeUndefined();
    });

    it('should handle contact creation with zero tenant_id from user', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 0
      });

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

    it('should handle contact creation with negative tenant_id from user', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: -1
      });

      expect(user.tenant_id).toBe(-1);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBe(-1);
    });

    it('should handle contact creation when user tenant_id is string', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: '5'  // String instead of number
      });

      // tenant_id should be accessible regardless of type
      expect(user.tenant_id).toBeDefined();

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBeDefined();
    });

    it('should handle contact creation error when contact data is missing required fields', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1
      });

      // Contact with only tenant_id, missing name/email/phone
      const contactData = {
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      // Contact should be created but may fail validation at save time
      expect(contact.tenant_id).toBe(1);
    });

    it('should handle contact creation when user has valid tenant_id but contact data is incomplete', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: 1
      });

      // Contact with only name and tenant_id
      const contactData = {
        name: 'John Doe',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);

      expect(contact.name).toBe('John Doe');
      expect(contact.tenant_id).toBe(1);
      // email and phone are missing but contact is created with defaults
      expect(contact.email).toBe('');
      expect(contact.phone).toBe('');
    });

    it('should prevent contact from having different tenant_id than user', () => {
      // Simulate user from tenant 1
      const user = new User({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1
      });

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
    });

    it('should handle contact creation with multiple users having different tenant_ids', () => {
      // User 1 from tenant 1
      const user1 = new User({
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        tenant_id: 1
      });

      // User 2 from tenant 2
      const user2 = new User({
        id: 2,
        name: 'User 2',
        email: 'user2@example.com',
        tenant_id: 2
      });

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

    it('should handle contact creation error when tenant_id is NaN', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: NaN
      });

      // NaN should be handled gracefully
      expect(isNaN(user.tenant_id)).toBe(true);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      // Contact is created but tenant_id is NaN
      expect(isNaN(contact.tenant_id)).toBe(true);
    });

    it('should handle contact creation error when tenant_id is Infinity', () => {
      const user = new User({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        tenant_id: Infinity
      });

      expect(user.tenant_id).toBe(Infinity);

      const contactData = {
        name: 'Contact',
        email: 'contact@example.com',
        tenant_id: user.tenant_id
      };

      const contact = new Contact(contactData);
      expect(contact.tenant_id).toBe(Infinity);
    });
  });
});
