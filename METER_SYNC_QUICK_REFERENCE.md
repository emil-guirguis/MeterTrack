# Meter Sync - Quick Reference Card

## 🎯 What You're Debugging

The **Meter Sync** process reads meters from the **REMOTE** database (Client System) and syncs them to the **LOCAL** database (Sync System).

---

## 🔴 Three Debugger Breakpoints

| # | Location | File | What Happens |
|---|----------|------|--------------|
| 1️⃣ | API Endpoint | `sync/mcp/src/api/server.ts` | Frontend request received |
| 2️⃣ | Sync Operation | `sync/mcp/src/sync-service/meter-sync-agent.ts` | Main sync logic starts |
| 3️⃣ | Remote Query | `sync/mcp/src/sync-service/meter-sync-agent.ts` | REMOTE database queried |

---

## 🚀 How to Debug

### 1. Start Debugger
```
VS Code → Run → "Debug Sync Backend"
```

### 2. Trigger Sync
```
Sync Frontend (http://localhost:3003)
→ Remote Meter Sync card
→ Click "Trigger Meter Sync" button
```

### 3. Debugger Breaks
- **Debugger #1** - API receives request
- **Debugger #2** - Sync operation starts
- **Debugger #3** - Remote database query

### 4. Inspect & Continue
- Use debugger console to inspect variables
- Press F5 to continue to next breakpoint

---

## 📊 Data Flow

```
Frontend Button Click
    ↓
POST /api/local/meter-sync-trigger
    ↓
MeterSyncAgent.triggerSync()
    ↓
MeterSyncAgent.performSync()
    ↓
getRemoteMeters() → Query REMOTE database
    ↓
Compare remote vs local
    ↓
INSERT/UPDATE/DELETE in LOCAL database
    ↓
Return results to frontend
```

---

## 🗄️ Databases

| Database | Purpose | Connection | Used By |
|----------|---------|-----------|---------|
| **REMOTE** | Client System | `remotePool` | `getRemoteMeters()` |
| **LOCAL** | Sync System | `syncPool` | `performSync()` |

---

## 📝 What Gets Synced

**From REMOTE:**
- meter.id → meter_id
- meter.name → name
- meter.ip → ip
- meter.port → port
- meter.active → active
- meter_element.element → element

**Operations:**
- ➕ INSERT new meters
- 🔄 UPDATE changed meters
- ➖ DELETE/DEACTIVATE removed meters

---

## 🔍 Key Variables to Watch

### Debugger #1
```
this.meterSyncAgent  // The sync agent
this.database        // Local database
```

### Debugger #2
```
this.tenant_id       // Tenant being synced
remoteMeters         // Meters from REMOTE
localMeters          // Meters from LOCAL
```

### Debugger #3
```
tenantId             // Tenant ID
query                // SQL query
result.rows          // Meters from REMOTE database
```

---

## 📂 Key Files

```
sync/frontend/src/components/MeterSyncCard.tsx
    ↓ (calls)
sync/frontend/src/api/services.ts
    ↓ (POST to)
sync/mcp/src/api/server.ts
    ↓ (calls)
sync/mcp/src/sync-service/meter-sync-agent.ts
    ↓ (uses)
sync/mcp/src/database/connection-pools.ts
```

---

## ✅ Checklist

- [ ] Debugger statements are compiled (they are!)
- [ ] Start "Debug Sync Backend" in VS Code
- [ ] Open Sync Frontend at http://localhost:3003
- [ ] Click "Trigger Meter Sync" button
- [ ] Debugger breaks at #1, #2, #3
- [ ] Inspect variables at each breakpoint
- [ ] Press F5 to continue

---

## 🎓 Understanding the Flow

1. **User clicks button** → Frontend sends POST request
2. **API receives request** → Debugger #1 breaks
3. **Sync starts** → Debugger #2 breaks
4. **Remote query** → Debugger #3 breaks
5. **Comparison** → Meters compared
6. **Sync** → Local database updated
7. **Response** → Results sent to frontend

---

## 💡 Tips

- Use `console.log()` in debugger console to inspect objects
- Hover over variables to see their values
- Use "Step Over" (F10) to step through code
- Use "Step Into" (F11) to dive into function calls
- Use "Continue" (F5) to jump to next breakpoint

---

## 🐛 Common Issues

**Debugger not breaking?**
- Make sure you're running "Debug Sync Backend" (not just running the server)
- Make sure the compiled code has the debugger statements (it does!)
- Check that the request is actually being sent (check browser console)

**Can't see variables?**
- Make sure you're at a breakpoint (red dot on line)
- Use the debugger console to inspect: `this.tenant_id`, `remoteMeters`, etc.
- Hover over variable names to see their values

**Sync not working?**
- Check the console logs for errors
- Make sure both databases are running
- Make sure tenant_id is configured
- Check that remote database has meters

---

## 📞 Need Help?

Check these files for more details:
- `METER_SYNC_DEBUGGING_GUIDE.md` - Detailed flow diagram
- `METER_SYNC_FLOW_DIAGRAM.md` - Visual flow with all details
- `METER_SYNC_DEBUGGER_SUMMARY.md` - Complete summary

---

**Ready to debug? Start the debugger and click the button!** 🚀
