# Design Document: Meter Location Validation

## Overview

Replace the free-text location field in the meter form with a location dropdown that validates against the location module. Update both frontend and backend to use location IDs and ensure referential integrity.

## Architecture

```
MeterForm → Location Dropdown (fetches from locationStore) → Backend Validation → Database FK Constraint
```

## Components and Interfaces

### 1. Frontend Changes

#### MeterForm.tsx Updates

**Current State:**
```typescript
<input
  type="text"
  id="location"
  value={formData.location || ''}
  onChange={(e) => handleInputChange('location', e.target.value)}
/>
```

**New Implementation:**
```typescript
import { useLocation } from '../../store/entities/locationStore';

// In component:
const locations = useLocation();

useEffect(() => {
  locations.fetchItems();
}, []);

// Replace text input with dropdown:
<select
  id="location_id"
  value={formData.location_id || ''}
  onChange={(e) => handleInputChange('location_id', e.target.value)}
  className={errors.location_id ? 'form-control form-control--error' : 'form-control'}
  disabled={locations.loading}
>
  <option value="">Select Location</option>
  {locations.items
    .filter(loc => loc.status === 'active')
    .map(location => (
      <option key={location.id} value={location.id}>
        {location.name} - {location.address?.city || ''}
      </option>
    ))}
</select>

{locations.items.length === 0 && !locations.loading && (
  <div className="form-info-banner">
    <span>No locations available. Please create a location first.</span>
    <a href="/locations">Manage Locations</a>
  </div>
)}

{meter?.location_id && !locations.items.find(l => l.id === meter.location_id) && (
  <div className="form-warning-banner">
    <span>The associated location is no longer available. Please select a new location.</span>
  </div>
)}
```

#### CreateMeterRequest Type Update

```typescript
// types/meter.ts
export interface CreateMeterRequest {
  meterId: string;
  serialNumber: string;
  device: string;
  model: string;
  device_id: string;
  location_id: string;  // Changed from location: string
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  // ... other fields
}
```

### 2. Backend Changes

#### Database Schema

**Current meters table:**
```sql
location_location VARCHAR(255),
location_floor VARCHAR(50),
location_room VARCHAR(50),
location_description TEXT
```

**Add foreign key constraint:**
```sql
ALTER TABLE meters 
ADD COLUMN location_id UUID REFERENCES location(id) ON DELETE RESTRICT;

-- Migrate existing data if needed
-- UPDATE meters SET location_id = (SELECT id FROM location WHERE name = meters.location_location LIMIT 1);
```

#### Meter Model Updates (models/Meter.js)

**Add location_id field:**
```javascript
class Meter {
  constructor(meterData = {}) {
    // ... existing fields
    this.location_id = meterData.location_id;
    this.location_name = meterData.location_name;  // From JOIN
    this.location_city = meterData.location_city;  // From JOIN
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT m.*, 
             l.name as location_name,
             l.address_city as location_city
      FROM meters m
      LEFT JOIN location l ON m.location_id = l.id
      WHERE 1=1
    `;
    // ... rest of query
  }
}
```

#### Routes Updates (routes/meters.js)

**Add validation:**
```javascript
router.post('/', [
  // ... existing validations
  body('location_id')
    .notEmpty().withMessage('Location is required')
    .isUUID().withMessage('Invalid location ID')
    .custom(async (value) => {
      const location = await Location.findById(value);
      if (!location) {
        throw new Error('Location not found');
      }
      if (location.status !== 'active') {
        throw new Error('Location must be active');
      }
      return true;
    }),
], requirePermission('meter:create'), async (req, res) => {
  // ... create meter with location_id
});
```

### 3. Data Migration Strategy

For existing meters with free-text location data:

1. **Option A: Manual Migration** - Admin reviews and maps existing meters to locations
2. **Option B: Automatic Matching** - Script attempts to match location_location text to location.name
3. **Option C: Default Location** - Create a "Legacy/Unmapped" location for existing meters

**Recommended: Option B with fallback to C**

```javascript
// Migration script
async function migrateLocations() {
  const meters = await Meter.findAll();
  const locations = await Location.findAll();
  
  for (const meter of meters) {
    if (!meter.location_id && meter.location_location) {
      // Try to find matching location
      const match = locations.find(l => 
        l.name.toLowerCase() === meter.location_location.toLowerCase()
      );
      
      if (match) {
        await meter.update({ location_id: match.id });
      } else {
        // Create or use default "Unmapped" location
        const unmapped = await Location.findOrCreate({ name: 'Unmapped Location' });
        await meter.update({ location_id: unmapped.id });
      }
    }
  }
}
```

## Error Handling

1. **Location not found**: Return 400 with clear message
2. **Inactive location**: Return 400 with message to select active location
3. **Location fetch fails**: Show retry button in form
4. **No locations available**: Show link to create location

## Testing Strategy

1. Test location dropdown loads active locations only
2. Test form validation requires location selection
3. Test backend validates location ID exists and is active
4. Test meter creation with valid location ID
5. Test meter update with different location ID
6. Test error handling for invalid location ID
7. Test warning display for orphaned location references
8. Test migration script with sample data
