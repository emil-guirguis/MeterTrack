# Export/Email Buttons on Dashboard Card - Fix Complete

## Problem
User reported that export and email buttons were not visible on the dashboard card (Monthly Energy Consumption card) despite being implemented in the meter-reading-export feature.

## Root Cause
The export/email buttons were implemented in `DetailedReadingsView.tsx`, but this component was **not being used** in the dashboard flow. The dashboard uses a different component hierarchy:

1. `DashboardPage.tsx` (client wrapper)
2. `FrameworkDashboardPage` (framework component)
3. `DashboardCard` (displays aggregated data)
4. `ExpandedCardModal` (shows expanded view when clicking expand button)

The `DetailedReadingsView` was a standalone component that wasn't integrated into the dashboard.

## Solution
Integrated export and email functionality directly into the `ExpandedCardModal` component, which is the modal that opens when users click the expand button on a dashboard card.

### Changes Made

#### 1. `framework/frontend/dashboards/components/ExpandedCardModal.tsx`
- Added `useState` import for tracking export state
- Added `handleExport()` function that:
  - Generates CSV from the data items
  - Properly escapes CSV values
  - Creates a blob and triggers browser download
  - Uses meter element name for filename
- Added `handleEmail()` function that:
  - Generates CSV filename
  - Creates mailto URL with subject and body
  - Opens default email client
- Added two new buttons in the metadata section:
  - **Export Button** (green): Downloads CSV file
  - **Email Button** (blue): Opens email client with pre-filled subject

#### 2. `framework/frontend/dashboards/components/ExpandedCardModal.css`
- Added `.expanded-card-modal__export-btn` styles:
  - Green background (#4CAF50)
  - Hover effect with darker green
  - Disabled state styling
- Added `.expanded-card-modal__email-btn` styles:
  - Blue background (#2196F3)
  - Hover effect with darker blue
  - Disabled state styling

### How It Works

1. User clicks the expand button (↗️) on a dashboard card
2. `ExpandedCardModal` opens showing the visualization
3. In the metadata bar, user sees:
   - Time frame info
   - Visualization type
   - Refresh button
   - **⬇️ Export button** (NEW)
   - **✉️ Email button** (NEW)
4. Clicking Export downloads a CSV file
5. Clicking Email opens the default email client with pre-filled subject

### Button States

**Export Button:**
- Enabled: When data is available
- Disabled: When data is loading, empty, or export is in progress
- Shows "⬇️ Exporting..." during export

**Email Button:**
- Enabled: When data is available
- Disabled: When data is loading or empty

### File Paths
- `framework/frontend/dashboards/components/ExpandedCardModal.tsx`
- `framework/frontend/dashboards/components/ExpandedCardModal.css`

## Testing
To verify the fix:

1. Navigate to the Dashboard page
2. Click the expand button (↗️) on any dashboard card
3. The expanded modal should open
4. In the metadata bar, you should see:
   - ⬇️ Export button (green)
   - ✉️ Email button (blue)
5. Click Export to download CSV
6. Click Email to open email client

## Notes
- The export/email functionality is now part of the framework component, making it available to all dashboard cards
- The CSV export uses the same format as the meter-reading-export feature
- The email functionality opens the default email client with pre-filled subject line
- Buttons are properly disabled when no data is available
