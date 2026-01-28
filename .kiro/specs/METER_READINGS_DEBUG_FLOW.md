# Meter Readings Debug Flow

## Complete Click-to-Display Flow

```
USER CLICKS FAVORITE
        ↓
FavoritesSection.handleFavoriteItemClick()
  - Logs: [FavoritesSection] ===== FAVORITE CLICKED =====
  - Calls: onItemClick(meterId, elementId)
        ↓
SidebarMetersSection.handleFavoritesItemClick()
  - Logs: [SidebarMetersSection] ===== FAVORITE ITEM CLICK HANDLER =====
  - Calls: onMeterElementSelect(meterId, elementId)
        ↓
AppLayoutWrapper.onMeterElementSelect()
  - Logs: [AppLayoutWrapper] ===== METER ELEMENT SELECT =====
  - Sets context: setSelectedMeter, setSelectedElement
  - Navigates: /meter-readings?meterId=X&elementId=Y
        ↓
MeterReadingManagementPage renders
  - Logs: [MeterReadingManagementPage] ===== EFFECT TRIGGERED =====
  - Parses URL params: meterId, elementId
  - Calls: store.fetchItems({tenantId, meterId, meterElementId})
        ↓
meterReadingsStore.fetchItems()
  - Logs: [MeterReadingsStore] ===== FETCH ITEMS CALLED =====
  - Builds query string: tenantId=X&meterId=Y&meterElementId=Z
  - Logs: [MeterReadingsStore] ===== QUERY STRING =====
  - Fetches: GET /api/meterreadings?tenantId=X&meterId=Y&meterElementId=Z
        ↓
Backend: meterReadings.js
  - Logs: [MeterReadings] Request: {tenantId, meterId, meterElementId}
  - Logs: [MeterReadings] ===== EXECUTING QUERY =====
  - Executes: SELECT * FROM meter_reading WHERE tenant_id=$1 AND meter_id=$2 AND meter_element_id=$3
  - Logs: [MeterReadings] ===== QUERY RESULT =====
  - Returns: {success: true, data: {items: [...], total, page, pageSize}}
        ↓
meterReadingsStore receives response
  - Logs: [MeterReadingsStore] Response status: 200
  - Logs: [MeterReadingsStore] ===== RESPONSE DATA =====
  - Stores items in state
        ↓
MeterReadingList renders
  - Filters data by selectedMeter and selectedElement
  - Passes to SimpleMeterReadingGrid
        ↓
SimpleMeterReadingGrid displays data
  - Renders columns: meter_id, meter_element_id, created_at, power, energy, etc.
  - Shows 20 rows per page
        ↓
USER SEES METER READINGS
```

## Debug Checkpoints

| Component | Log Prefix | What to Check |
|-----------|-----------|---------------|
| FavoritesSection | `[FavoritesSection]` | Is click being detected? Are meterId/elementId correct? |
| SidebarMetersSection | `[SidebarMetersSection]` | Is callback being called? Are values passed correctly? |
| AppLayoutWrapper | `[AppLayoutWrapper]` | Is navigation URL correct? Are query params set? |
| MeterReadingManagementPage | `[MeterReadingManagementPage]` | Are URL params parsed? Is effect triggered? |
| meterReadingsStore | `[MeterReadingsStore]` | Is query string correct? Is API URL correct? |
| Backend | `[MeterReadings]` | Is SQL query correct? Are results returned? |

## Common Issues

### Logs stop at FavoritesSection
- Favorite item not clickable
- Click handler not attached
- Check: Is the favorite item rendering?

### Logs stop at SidebarMetersSection
- onItemClick callback not being called
- Check: Is FavoritesSection passing correct props?

### Logs stop at AppLayoutWrapper
- onMeterElementSelect callback not being called
- Check: Is SidebarMetersSection passing correct props?

### Logs stop at MeterReadingManagementPage
- URL navigation not working
- Check: Is AppLayoutWrapper calling navigate()?

### Logs stop at meterReadingsStore
- useEffect not being triggered
- Check: Are URL params being parsed correctly?

### Response status is not 200
- Backend API error
- Check: Backend terminal for error logs

### Response data is empty
- Backend query returning no rows
- Check: Are query parameters correct?
- Check: Does data exist in database?

## Files Involved

1. **FavoritesSection.tsx** - Favorite click handler
2. **SidebarMetersSection.tsx** - Favorite item click callback
3. **AppLayoutWrapper.tsx** - Navigation and context
4. **MeterReadingManagementPage.tsx** - URL parsing and fetch
5. **meterReadingsStore.ts** - API call and data storage
6. **meterReadings.js** - Backend endpoint
7. **SimpleMeterReadingGrid.tsx** - Grid display
