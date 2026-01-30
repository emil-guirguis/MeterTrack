# Framework DataTable Empty State Fix

## Problem
The DataTable component was returning early with only an empty message when there was no data, which meant:
- The table headers were not displayed
- The action pane (sidebar) was not visible
- The grid structure was completely hidden

## Solution
Modified the DataTable component to always display the table structure, even when empty:

### Changes Made

#### 1. Removed Early Return for Empty State
**Before:**
```typescript
// Empty state
if (!data || data.length === 0) {
  return (
    <div className="data-table__empty">
      <p>{emptyMessage}</p>
    </div>
  );
}
```

**After:**
```typescript
// Check if data is empty
const isEmpty = !data || data.length === 0;
```

#### 2. Mobile View - Show Empty State in Cards Container
The mobile view now shows the empty message within the cards container instead of returning early:
```typescript
<div className="data-table__cards">
  {isEmpty ? (
    <div className="data-table__empty">
      <p>{emptyMessage}</p>
    </div>
  ) : (
    sortedData.map((item, index) => (
      // ... render cards
    ))
  )}
</div>
```

#### 3. Desktop View - Show Empty State in Table Body
The desktop table now displays the table headers and shows the empty message in a table row:
```typescript
<tbody className="data-table__body">
  {isEmpty ? (
    <tr className="data-table__row data-table__row--empty">
      <td 
        colSpan={
          (onSelect ? 1 : 0) + 
          visibleColumns.length + 
          (onView || onEdit || onDelete ? 1 : 0)
        }
        className="data-table__cell data-table__cell--empty"
      >
        <div className="data-table__empty">
          <p>{emptyMessage}</p>
        </div>
      </td>
    </tr>
  ) : (
    sortedData.map((item, index) => (
      // ... render rows
    ))
  )}
</tbody>
```

## Benefits

✅ **Table Headers Always Visible**
- Users can see the column structure even with no data
- Provides context about what data will be displayed

✅ **Action Pane Always Visible**
- The sidebar with actions (Create button, etc.) is always displayed
- Users can create new records even when the list is empty
- Filters remain accessible

✅ **Consistent Layout**
- The page layout remains consistent whether data exists or not
- No layout shift when data is added/removed

✅ **Better UX**
- Users understand the structure of the data
- Clear call-to-action (Create button) is always visible
- Empty state message is still displayed in context

## Files Modified
- `framework/frontend/components/datatable/DataTable.tsx`

## Impact
This change affects all modules using the BaseList component:
- Reports
- Meters
- Contacts
- Users
- Locations
- Templates
- Any other module using BaseList

All modules will now display:
1. Filter section (always visible)
2. Table headers (always visible)
3. Empty state message (when no data)
4. Action pane/sidebar (always visible)

## Testing
Test the following scenarios:
1. ✅ Empty list - verify table headers and sidebar are visible
2. ✅ List with data - verify data displays correctly
3. ✅ Create action - verify create button is accessible from empty state
4. ✅ Filters - verify filters work on empty list
5. ✅ Mobile view - verify empty state displays correctly on mobile
6. ✅ Responsive - verify layout adjusts correctly

## Completion Status
✅ COMPLETE - Framework DataTable now displays grid structure even when empty
