# Socket.IO Local Development Solution

## The Problem

When connecting Socket.IO from `http://localhost:3000` (Next.js) to `http://emr.localhost:9000` (Frappe Socket.IO), the namespace validation fails because:

```javascript
// From authenticate.js - get_site_name()
else if (socket.request.headers.origin) {
    socket.site_name = get_hostname(socket.request.headers.origin);  // Returns "localhost"
}
```

- **Origin**: `http://localhost:3000` → extracted as `localhost`
- **Namespace**: `/emr.localhost` (from siteName prop)
- **Result**: `localhost` != `emr.localhost` → "Invalid namespace"

## Why Raven Mobile Works

Raven mobile app connects from a **mobile device** to a **remote server**:

- **Mobile apps don't send Origin headers** (or send `null`)
- Falls through to: `socket.site_name = get_hostname(socket.request.headers.host);`
- Host is `raven.frappe.cloud`, sitename is `raven.frappe.cloud`
- **Perfect match!**

## Solutions

### Solution 1: Deploy Next.js on Same Hostname (RECOMMENDED)

Run Next.js on the same hostname as Frappe:

**Before:**
- Frappe: `http://emr.localhost:8000`
- Next.js: `http://localhost:3000` ❌ (Different hostname)

**After:**
- Frappe: `http://emr.localhost:8000`
- Next.js: `http://emr.localhost:3000` ✅ (Same hostname)

**Steps:**

1. **Configure Next.js to listen on all interfaces:**

```bash
cd /workspace/development/frappe-oauth-demo
# Edit package.json
```

Update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "build": "next build",
    "start": "next start -H 0.0.0.0"
  }
}
```

2. **Update /etc/hosts (already done):**
```
127.0.0.1 emr.localhost
```

3. **Update OAuth Client redirect URI in Frappe:**
```
http://emr.localhost:3000/auth/callback
```

4. **Update .env.local:**
```env
NEXT_PUBLIC_FRAPPE_SERVER_URL=http://emr.localhost:8000
NEXT_PUBLIC_SOCKETIO_PORT=9000
NEXT_PUBLIC_APP_URL=http://emr.localhost:3000
```

5. **Update FrappeAuthContext.tsx:**
```typescript
const siteName = "emr.localhost";  // Hardcode for local dev
```

6. **Access the app:**
```
http://emr.localhost:3000
```

Now origin and host both match `emr.localhost`!

###  Solution 2: Use API to Fetch sitename (PRODUCTION)

For production deployments, fetch sitename dynamically:

```typescript
// Created API in emr_plus app
GET /api/method/emr_plus.api.mobile.get_site_info

// Response:
{
  "message": {
    "sitename": "emr.localhost",
    "frappe_version": "16.0.0-dev"
  }
}
```

**Implementation:**

```typescript
const [siteName, setSiteName] = useState<string | undefined>(undefined);

useEffect(() => {
  fetch(`${frappeServerUrl}/api/method/emr_plus.api.mobile.get_site_info`)
    .then(res => res.json())
    .then(data => {
      if (data.message?.sitename) {
        setSiteName(data.message.sitename);
      }
    });
}, [frappeServerUrl]);

// Only render FrappeProvider when siteName is available
{siteName && (
  <FrappeProvider siteName={siteName} ...>
    {children}
  </FrappeProvider>
)}
```

This works in production where origin matches host.

### Solution 3: Production Deployment

In production, deploy Next.js and Frappe on same domain:

**Option A: Subdomain**
- Frappe: `https://api.example.com`
- Next.js: `https://app.example.com`
- Socket.IO: `https://api.example.com/socket.io/`

**Option B: Path-based**
- Frappe: `https://example.com/api`
- Next.js: `https://example.com/` (root or `/app`)
- Socket.IO: `https://example.com/socket.io/`

With proper reverse proxy (Nginx/Cloudflare), everything is on same origin!

## Implementation Steps (Solution 1)

### 1. Update package.json

```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000"
  }
}
```

### 2. Update Frappe OAuth Client

Go to: `http://emr.localhost:8000/app/oauth-client/6mdq0reush`

Update Redirect URIs to include:
```
http://emr.localhost:3000/auth/callback
```

### 3. Update .env.local

```env
NEXT_PUBLIC_FRAPPE_SERVER_URL=http://emr.localhost:8000
NEXT_PUBLIC_SOCKETIO_PORT=9000
NEXT_PUBLIC_APP_URL=http://emr.localhost:3000
NEXT_PUBLIC_OAUTH_CLIENT_ID=6mdq0reush
OAUTH_CLIENT_SECRET=20afeef8c8
```

### 4. Update FrappeAuthContext.tsx

```typescript
const siteName = "emr.localhost";  // Matches both origin and host now!
```

### 5. Restart Next.js

```bash
npm run dev
```

### 6. Access via emr.localhost

Open: `http://emr.localhost:3000`

Login → Navigate to `/realtime-test`

Check console:
- Origin: `http://emr.localhost:3000`
- Host: `emr.localhost:9000`
- Detected site: `emr.localhost` (from origin)
- Namespace: `/emr.localhost`
- **MATCH!** ✅

### 7. Test Events

```python
bench --site emr.localhost console
>>> import frappe
>>> frappe.publish_realtime(
...     event='custom_notification',
...     message={'message': 'Hello!', 'type': 'success'},
...     room='website'
... )
```

Event should appear in UI! 🎉

## Files Created/Modified

### Created:
1. `/workspace/development/frappe-bench/apps/emr_plus/emr_plus/api/mobile.py`
   - API endpoint to fetch sitename (like Raven mobile)

### To Modify:
1. `/workspace/development/frappe-oauth-demo/package.json`
   - Add `-H 0.0.0.0` to dev script

2. `/workspace/development/frappe-oauth-demo/.env.local`
   - Change APP_URL to `http://emr.localhost:3000`

3. Frappe OAuth Client in database
   - Add `http://emr.localhost:3000/auth/callback` to redirect URIs

## Summary

**The key insight:** Frappe's Socket.IO authentication uses the **origin header** to determine the site name. When origin and host don't match (localhost vs emr.localhost), validation fails.

**Solution:** Make origin and host match by:
- **Local dev**: Access Next.js via `emr.localhost:3000` (same hostname as Frappe)
- **Production**: Deploy on same domain (naturally matches)

This is exactly how Raven mobile works - mobile apps don't have cross-origin issues because they don't send origin headers, and origin/host naturally match in production deployments!
