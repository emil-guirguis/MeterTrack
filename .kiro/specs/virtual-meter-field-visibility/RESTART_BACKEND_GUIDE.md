# ⚠️ CRITICAL: Backend Restart Required

## The Problem

You're not seeing any changes because **the backend server is still running the old schema**. The schema changes are in the code, but the backend needs to be restarted to load them.

## The Solution

### Step 1: Stop the Backend Server

**Option A: Using Terminal**
```bash
# Navigate to backend directory
cd client/backend

# Stop the server (Ctrl+C)
# Press Ctrl+C in the terminal where the backend is running
```

**Option B: Using Windows Batch Script**
```bash
# Run the stop script
./stop-dev.bat
```

**Option C: Using PowerShell Script**
```powershell
# Run the stop script
./stop-dev.ps1
```

### Step 2: Restart the Backend Server

**Option A: Using npm**
```bash
cd client/backend
npm start
```

**Option B: Using Windows Batch Script**
```bash
./start-dev.bat
```

**Option C: Using PowerShell Script**
```powershell
./start-dev.ps1
```

### Step 3: Wait for Backend to Start

You should see output like:
```
[Backend] Server running on port 5000
[Backend] Database connected
```

### Step 4: Clear Browser Cache

**Option A: Hard Refresh**
- Windows: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

**Option B: Clear Cache in DevTools**
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cache Storage"
4. Delete all caches
5. Refresh the page

**Option C: Clear All Browser Data**
1. Open browser settings
2. Go to Privacy/History
3. Clear browsing data
4. Select "All time"
5. Check "Cookies and other site data"
6. Click "Clear data"

### Step 5: Test the Changes

1. Navigate to **Meters** page
2. Click **Add Meter**
3. Select **Virtual Meter**
4. **Verify these fields are NOT visible:**
   - Serial Number
   - Device
   - Network section (IP Address, Port)
5. **Verify these fields ARE visible:**
   - Name
   - Location
   - Active
   - Installation Date
   - Notes

## Verification Checklist

- [ ] Backend server has been stopped
- [ ] Backend server has been restarted
- [ ] Backend is running on the correct port (5000)
- [ ] Browser cache has been cleared
- [ ] Hard refresh has been done (Ctrl+Shift+R)
- [ ] Virtual meter form hides device fields
- [ ] Physical meter form shows device fields
- [ ] No console errors (F12 > Console)

## Troubleshooting

### Backend Won't Start

**Error: Port already in use**
```bash
# Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

**Error: Module not found**
```bash
# Reinstall dependencies
cd client/backend
npm install
npm start
```

### Changes Still Not Visible

**Step 1: Verify Backend is Running**
- Check that backend is running on port 5000
- Open http://localhost:5000/api/schema/meter in browser
- You should see the schema JSON with `visibleFor` properties

**Step 2: Verify Schema Has visibleFor**
- In the JSON response, search for `"visibleFor"`
- You should see:
  - `"visibleFor": ["physical"]` for Serial Number
  - `"visibleFor": ["physical"]` for Device
  - `"visibleFor": ["physical"]` for Network section

**Step 3: Verify Frontend is Loading Schema**
- Open DevTools (F12)
- Go to Network tab
- Look for request to `/api/schema/meter`
- Check the response includes `visibleFor` properties

**Step 4: Check Browser Console**
- Open DevTools (F12)
- Go to Console tab
- Look for any errors
- Check for `[BaseForm]` logs showing meterType being passed

### Schema Endpoint Not Responding

**Check if schema route is registered:**
```bash
# In backend logs, you should see:
# [SCHEMA ROUTES] ✅ All models loaded successfully
```

**If not, restart backend:**
```bash
cd client/backend
npm start
```

## What Changed

### Backend (MeterWithSchema.js)
```javascript
// Serial Number field
field({
  name: 'serial_number',
  // ... other properties
  visibleFor: ['physical'],  // NEW
})

// Device field
field({
  name: 'device_id',
  // ... other properties
  visibleFor: ['physical'],  // NEW
})

// Network section
section({
  name: 'Network',
  order: 2,
  visibleFor: ['physical'],  // NEW
  fields: [
    // IP and Port fields
  ],
})
```

### Frontend (useFormTabs.ts)
- Added section filtering based on `visibleFor`
- Added field filtering based on `visibleFor`
- Respects meter type passed from MeterForm

## How It Works

1. **Backend** serves schema with `visibleFor` properties
2. **Frontend** fetches schema from `/api/schema/meter`
3. **useFormTabs** hook filters sections and fields based on `visibleFor` and `meterType`
4. **BaseForm** renders only visible fields and sections
5. **MeterForm** passes `meterType` to BaseForm

## Next Steps

Once you've restarted the backend and verified the changes:

1. Test adding a virtual meter
2. Test adding a physical meter
3. Test editing existing meters
4. Test form submission
5. Run any automated tests

## Support

If you continue to have issues:

1. Check backend logs for errors
2. Verify schema endpoint is responding correctly
3. Check browser console for JavaScript errors
4. Verify MeterWithSchema.js has the `visibleFor` properties
5. Verify useFormTabs.ts has the filtering logic
6. Try a complete restart of both frontend and backend

## Files Modified

- `client/backend/src/models/MeterWithSchema.js` - Added `visibleFor` properties
- `framework/frontend/components/form/hooks/useFormTabs.ts` - Added filtering logic

## Important Notes

- **Backend must be restarted** for schema changes to take effect
- **Browser cache must be cleared** for frontend to fetch new schema
- **Hard refresh** (Ctrl+Shift+R) is recommended
- The schema is cached by the frontend, so clearing cache is important
