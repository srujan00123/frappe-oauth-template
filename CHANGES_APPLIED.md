# Changes Applied for Socket.IO Fix

## Summary

Changed Next.js app to be accessed via `http://emr.localhost:3000` instead of `http://localhost:3000` so that origin and host match for Socket.IO authentication.

## Files Modified

### 1. package.json
**Changed:** Added `-H 0.0.0.0` to serve on all network interfaces

```diff
  "scripts": {
-   "dev": "WATCHPACK_POLLING=true next dev",
+   "dev": "WATCHPACK_POLLING=true next dev -H 0.0.0.0",
    "build": "next build",
-   "start": "next start",
+   "start": "next start -H 0.0.0.0",
    "lint": "eslint"
  },
```

### 2. .env.local
**Changed:** Updated APP_URL to use `emr.localhost:3000`

```diff
  # Next.js Application URL
- NEXT_PUBLIC_APP_URL=http://localhost:3000
+ # Use emr.localhost so origin matches Frappe server for Socket.IO
+ NEXT_PUBLIC_APP_URL=http://emr.localhost:3000
```

### 3. OAuth Client (Frappe Database)
**Action Required:** Add redirect URI via Frappe UI or console

**Current redirect URIs:**
```
http://localhost:3000/auth/callback
```

**Need to add:**
```
http://emr.localhost:3000/auth/callback
```

## Files Created

### 1. emr_plus/api/mobile.py
**Purpose:** API endpoint to fetch sitename (similar to Raven mobile)

```python
@frappe.whitelist(allow_guest=True)
def get_site_info():
    """
    API to fetch site name for Socket.IO connection
    Required for OAuth apps that need to know the correct sitename for namespace
    """
    return {
        "sitename": frappe.local.site,
        "frappe_version": frappe.__version__,
    }
```

**API Endpoint:** `http://emr.localhost:8000/api/method/emr_plus.api.mobile.get_site_info`

## How It Works Now

### Before:
```
Browser: http://localhost:3000
  ↓
  Origin: http://localhost:3000
  ↓
Socket.IO Server (authenticate.js):
  - Extracts hostname from origin: "localhost"
  - Namespace from client: "emr.localhost"
  - Mismatch! ❌
```

### After:
```
Browser: http://emr.localhost:3000
  ↓
  Origin: http://emr.localhost:3000
  ↓
Socket.IO Server (authenticate.js):
  - Extracts hostname from origin: "emr.localhost"
  - Namespace from client: "emr.localhost"
  - Match! ✅
```

## Testing Steps

### 1. Update OAuth Client

Go to: `http://emr.localhost:8000/app/oauth-client/6mdq0reush`

Add redirect URI:
```
http://emr.localhost:3000/auth/callback
```

Click **Save**.

### 2. Restart Next.js Dev Server

```bash
cd /workspace/development/frappe-oauth-demo
npm run dev
```

Output should show:
```
- Local:        http://0.0.0.0:3000
- Network:      http://emr.localhost:3000
```

### 3. Access via emr.localhost

**Important:** Access the app via:
```
http://emr.localhost:3000
```

**NOT:**
```
http://localhost:3000  ❌ (Will have Socket.IO issues)
```

### 4. Login and Test

1. Navigate to: `http://emr.localhost:3000`
2. Click "Login with Frappe"
3. After login, go to: `http://emr.localhost:3000/realtime-test`
4. Check browser console:
   ```
   [Socket.IO Debug] Namespace: /emr.localhost
   [Socket.IO] Connected!  ✅
   ```

### 5. Test Event Reception

From Frappe Console:
```python
bench --site emr.localhost console
>>> import frappe
>>> frappe.publish_realtime(
...     event='custom_notification',
...     message={'message': 'Hello from matching origin!', 'type': 'success'},
...     room='website'
... )
```

The event should appear in the UI! 🎉

## Production Deployment

For production with Cloudflare tunnel:

1. **Deploy Next.js on same domain:**
   - Option A: Subdomain - `https://app.emr.commitx.in`
   - Option B: Path - `https://emr.commitx.in/app`

2. **Update .env.production:**
   ```env
   NEXT_PUBLIC_FRAPPE_SERVER_URL=https://emr.commitx.in
   NEXT_PUBLIC_SOCKETIO_PORT=
   NEXT_PUBLIC_APP_URL=https://emr.commitx.in  # or https://app.emr.commitx.in
   ```

3. **Configure reverse proxy** to route:
   - `/api/*` → Frappe backend
   - `/socket.io/*` → Socket.IO server
   - `/app/*` or `/` → Next.js app

Origin and host will naturally match in production!

## Why This Works

This approach matches **exactly** how Raven mobile app works:

**Raven Mobile (Production):**
- Mobile app connects to: `https://raven.frappe.cloud`
- Origin: `null` (mobile apps don't send origin)
- Host: `raven.frappe.cloud`
- Detected site: `raven.frappe.cloud` (from host, since origin is null)
- Namespace: `raven.frappe.cloud`
- **Match!** ✅

**Our Setup (Local Development):**
- Browser connects to: `http://emr.localhost:3000`
- Origin: `http://emr.localhost:3000` (browser sends this)
- Host: `emr.localhost:9000` (Socket.IO server)
- Detected site: `emr.localhost` (from origin)
- Namespace: `emr.localhost`
- **Match!** ✅

## Key Insight

Frappe's Socket.IO authentication uses origin header to determine site name. When client and server are on different hostnames (localhost vs emr.localhost), validation fails.

**Solution:** Use same hostname for both client and server. This is what production deployments naturally do, and what we now do for local development too!

## No Core Modifications Required

This solution requires **ZERO modifications** to Frappe core:
- ✅ No changes to `authenticate.js`
- ✅ No changes to `realtime.py` (only added API in custom app)
- ✅ Uses standard Frappe Socket.IO authentication
- ✅ Works exactly like Raven mobile app

The API in `emr_plus/api/mobile.py` is optional - just for future dynamic sitename fetching in production.
