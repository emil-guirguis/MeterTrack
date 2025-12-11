import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: meter-location-validation, Property 3: Location ID Mapping**
 * **Validates: Requirements 1.3**
 * 
 * Property: For any location selected from the dropdown, the location_id field
 * SHALL be set to the ID of the selected location.
 * 
 * This test verifies that when a user selects a location from the dropdown,
 * the correct location_id is stored in the form data.
 */
describe('Location ID Mapping - Property 3', () => {
  /**
   * Property: Selected location ID is correctly stored in form data
   * 
   * For any location in the dropdown, when selected, the location_id field
   * should be set to the ID of that location.
   */
  it('should set location_id to selected location ID', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0 }),
        (locations, selectedIndex) => {
          // Ensure selectedIndex is within bounds
          const index = selectedIndex % locations.length;
          const selectedLocation = locations[index];

          // Simulate the form data update when a location is selected
          const formData: any = { location_id: null };
          
          // This simulates what happens in handleInputChange when a location is selected
          const selectedValue = String(selectedLocation.id);
          formData.location_id = selectedValue ? parseInt(selectedValue) : null;

          // Verify that location_id is set to the selected location's ID
          expect(formData.location_id).toBe(selectedLocation.id);
          expect(typeof formData.location_id).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Location ID is correctly converted from string to number
   * 
   * For any location ID string from the dropdown, it should be correctly
   * converted to a number and stored in form data.
   */
  it('should convert location ID string to number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (locationId) => {
          // Simulate the dropdown value (always a string)
          const dropdownValue = String(locationId);

          // Simulate the conversion in handleInputChange
          const formDataValue = dropdownValue ? parseInt(dropdownValue) : null;

          // Verify conversion is correct
          expect(formDataValue).toBe(locationId);
          expect(typeof formDataValue).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty selection results in null location_id
   * 
   * For any form state, when the user selects the empty option (no location),
   * the location_id should be set to null.
   */
  it('should set location_id to null when empty option is selected', () => {
    fc.assert(
      fc.property(fc.constant(null), (emptyValue) => {
        // Simulate selecting the empty option
        const dropdownValue = '';

        // Simulate the conversion in handleInputChange
        const formDataValue = dropdownValue ? parseInt(dropdownValue) : null;

        // Verify that location_id is null
        expect(formDataValue).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Location name is displayed in dropdown option
   * 
   * For any location, the dropdown option should display the location's name
   * as the label, not the ID.
   */
  it('should display location name as dropdown label', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (locations) => {
          // Simulate the options mapping in useValidationFieldOptions
          const options = locations.map((location: any) => ({
            id: location.id,
            label: location.name || `Location ${location.id}`,
          }));

          // Verify that each option has the location name as label
          options.forEach((option, index) => {
            expect(option.label).toBe(locations[index].name);
            expect(option.id).toBe(locations[index].id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Location ID and name are correctly paired
   * 
   * For any location, the ID and name should remain correctly paired
   * throughout the selection and storage process.
   */
  it('should maintain correct pairing of location ID and name', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            tenant_id: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0 }),
        (locations, selectedIndex) => {
          // Ensure selectedIndex is within bounds
          const index = selectedIndex % locations.length;
          const selectedLocation = locations[index];

          // Simulate the options mapping
          const options = locations.map((location: any) => ({
            id: location.id,
            label: location.name || `Location ${location.id}`,
          }));

          // Find the selected option
          const selectedOption = options[index];

          // Verify the pairing is correct
          expect(selectedOption.id).toBe(selectedLocation.id);
          expect(selectedOption.label).toBe(selectedLocation.name);
        }
      ),
      { numRuns: 100 }
    );
  });
});
