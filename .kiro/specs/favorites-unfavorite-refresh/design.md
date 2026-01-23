# Favorites Unfavorite Refresh - Design

## Architecture Overview

The fix involves updating the `handleFavoritesStarClick` callback in SidebarMetersSection to synchronize the meterElements state when a favorite is removed.

## Component Interaction Flow

```
FavoritesSection (star click)
    ↓
handleFavoritesStarClick (SidebarMetersSection)
    ↓
1. Call favoritesService.removeFavoriteById()
2. Update favorites state (remove from array)
3. Update meterElements state (set is_favorited to false)
    ↓
MetersList re-renders with updated element state
    ↓
MeterElementItem shows unfilled star icon
```

## Implementation Details

### handleFavoritesStarClick Enhancement

**Current behavior:**
```typescript
const handleFavoritesStarClick = useCallback(
  async (favoriteId: number, meterId: string, elementId: string) => {
    try {
      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);

      // Remove favorite from database
      await favoritesService.removeFavoriteById(favoriteId, parseInt(tenantId));

      // Update favorites list
      setFavorites((prev) =>
        prev.filter((fav) => !(fav.id1 === meterIdNum && fav.id2 === elementIdNum))
      );
    } catch (err) {
      // error handling
    }
  },
  [tenantId]
);
```

**Enhanced behavior:**
```typescript
const handleFavoritesStarClick = useCallback(
  async (favoriteId: number, meterId: string, elementId: string) => {
    try {
      const meterIdNum = parseInt(meterId);
      const elementIdNum = parseInt(elementId);

      // Remove favorite from database
      await favoritesService.removeFavoriteById(favoriteId, parseInt(tenantId));

      // Update favorites list
      setFavorites((prev) =>
        prev.filter((fav) => !(fav.id1 === meterIdNum && fav.id2 === elementIdNum))
      );

      // Update meterElements to reflect unfavorited status
      setMeterElements((prev) => {
        const updated = { ...prev };
        if (updated[meterIdNum]) {
          updated[meterIdNum] = updated[meterIdNum].map((el) =>
            el.meter_element_id === elementIdNum
              ? { ...el, is_favorited: false }
              : el
          );
        }
        return updated;
      });
    } catch (err) {
      // error handling
    }
  },
  [tenantId]
);
```

## State Management

### Before Unfavorite
```
meterElements[1] = [
  { meter_element_id: 10, is_favorited: true, ... },
  { meter_element_id: 11, is_favorited: false, ... }
]
```

### After Unfavorite
```
meterElements[1] = [
  { meter_element_id: 10, is_favorited: false, ... },  // Updated
  { meter_element_id: 11, is_favorited: false, ... }
]
```

## Correctness Properties

### Property 1: Favorite Removal Synchronization
**Validates: Requirements 1.1, 1.2**

When a favorite is removed from the FavoritesSection:
1. The favorite is deleted from the database
2. The favorites array is updated to remove the item
3. The meterElements state is updated to set is_favorited to false
4. The MetersList component re-renders with the updated state
5. The star icon in MeterElementItem changes from filled to outlined

### Property 2: State Consistency
**Validates: Requirements 1.2**

After removing a favorite:
- The element's is_favorited property in meterElements matches the favorites array
- If an element is not in the favorites array, its is_favorited should be false
- If an element is in the favorites array, its is_favorited should be true

## Testing Strategy

### Unit Tests
- Test that handleFavoritesStarClick updates meterElements correctly
- Test that the element's is_favorited property is set to false
- Test that other elements in the same meter are not affected
- Test error handling when removal fails

### Property-Based Tests
- Property: For any removed favorite, the corresponding element's is_favorited becomes false
- Property: Removing a favorite doesn't affect other elements' favorite status
- Property: The favorites array and meterElements state remain consistent

## Edge Cases

1. **Multiple elements in same meter**: Only the removed element should be updated
2. **Last favorite in meter**: Meter should still display with unfilled stars
3. **Concurrent operations**: If multiple favorites are removed quickly, each should update correctly
4. **Error during removal**: If removal fails, meterElements should not be updated
