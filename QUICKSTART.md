# Quick Start Guide

Follow these steps to test the Frappe OAuth demo application.

## Prerequisites

- ✅ Frappe server running at `http://emr.localhost:8080`
- ✅ Node.js 18+ installed
- ✅ Administrator access to Frappe

## Step 1: Create OAuth Client in Frappe

1. **Open Frappe in your browser:**
   ```
   http://emr.localhost:8080
   ```

2. **Log in as Administrator**

3. **Navigate to OAuth Client:**
   - Click the search bar (Ctrl+K or Cmd+K)
   - Type: `OAuth Client`
   - Click "OAuth Client" doctype

4. **Create New OAuth Client:**
   - Click the "+ Add OAuth Client" button
   - Fill in the following details:

   ```
   App Name: Frappe OAuth Demo
   Scopes: all openid
   Redirect URIs: http://localhost:3000/auth/callback
   Default Redirect URI: http://localhost:3000/auth/callback
   Grant Type: Authorization Code
   Response Type: Code
   Token Endpoint Auth Method: Client Secret Basic
   Skip Authorization: ☐ (unchecked - leave it unchecked for testing)
   ```

5. **Save the document** (Ctrl+S or Cmd+S)

6. **Copy your credentials:**
   - **Client ID**: This is the document name (auto-generated)
   - **Client Secret**: Auto-generated, shown in the form

   **Important**: Keep these credentials handy!

## Step 2: Configure Environment Variables

1. **Open the .env.local file:**
   ```bash
   cd /workspace/development/frappe-oauth-demo
   nano .env.local  # or use your preferred editor
   ```

2. **Update with your OAuth credentials:**
   ```env
   # Frappe Server Configuration
   NEXT_PUBLIC_FRAPPE_SERVER_URL=http://emr.localhost:8080

   # OAuth Client Configuration (paste your values here)
   NEXT_PUBLIC_OAUTH_CLIENT_ID=your_actual_client_id_from_frappe
   OAUTH_CLIENT_SECRET=your_actual_client_secret_from_frappe

   # Next.js Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Save the file**

## Step 3: Install Dependencies (if not done already)

```bash
cd /workspace/development/frappe-oauth-demo
npm install
```

## Step 4: Start the Development Server

```bash
npm run dev
```

You should see:
```
   ▲ Next.js 15.5.4
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.3s
```

## Step 5: Test the OAuth Flow

1. **Open your browser:**
   ```
   http://localhost:3000
   ```

2. **You should see:**
   - Landing page with "Frappe OAuth Demo" title
   - Features grid
   - "Get Started" button

3. **Click "Get Started" or "Sign in with Frappe"**

4. **OAuth Flow:**
   - You'll be redirected to Frappe at `http://emr.localhost:8080`
   - Frappe login page appears (if not logged in)
   - Log in with your Frappe credentials
   - **Authorization screen appears** asking to allow access
   - You'll see scopes like: "Full Name", "Email", "User Image", "Roles"
   - Click **"Allow"**

5. **Callback & Success:**
   - You'll be redirected to `http://localhost:3000/auth/callback`
   - Brief loading screen: "Completing authentication..."
   - Redirected to `http://localhost:3000/dashboard`

6. **Dashboard View:**
   - Your user information (name, email, sub)
   - Your roles from Frappe
   - Decoded ID token (JWT)
   - Profile picture (if set in Frappe)

## Step 6: Test Features

### View User Information
- Check the **User Information** card
- Verify your name, email, and sub (subject ID) are correct

### Check Roles
- Look at the **Assigned Roles** card
- You should see your Frappe roles (e.g., "System Manager", "Administrator")
- These roles can be used for authorization in your app

### Inspect ID Token
- Scroll down to **Decoded ID Token**
- This is the JWT containing your user claims
- Includes: sub, name, email, roles, iss, aud, exp, iat

### Test Logout
- Click **Sign Out** button
- You'll be redirected to home page
- Tokens are cleared from localStorage

### Test Re-authentication
- Click "Get Started" again
- If you checked "Skip Authorization" in OAuth Client, you'll be logged in immediately
- Otherwise, you'll see the authorization screen again

## Troubleshooting

### Error: "Invalid redirect_uri"

**Problem**: Redirect URI mismatch

**Solution**:
1. Check your OAuth Client in Frappe
2. Verify Redirect URIs includes: `http://localhost:3000/auth/callback`
3. Make sure there are no trailing slashes
4. Restart your Next.js dev server after changes

### Error: "Invalid client_id"

**Problem**: Client ID doesn't match

**Solution**:
1. Copy the exact Client ID from your OAuth Client document in Frappe
2. Paste it into `.env.local` as `NEXT_PUBLIC_OAUTH_CLIENT_ID`
3. Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

### Error: "Failed to fetch"

**Problem**: Can't connect to Frappe server

**Solution**:
1. Verify Frappe is running: `http://emr.localhost:8080`
2. Check CORS settings in Frappe
3. Add to your Frappe site's `site_config.json`:
   ```json
   {
     "allow_cors": "*"
   }
   ```
4. Or specify your Next.js origin:
   ```json
   {
     "allow_cors": "http://localhost:3000"
   }
   ```
5. Restart your Frappe server:
   ```bash
   bench restart
   ```

### Authorization Screen Doesn't Appear

**Problem**: Immediately redirected without authorization

**Solution**:
- This happens if "Skip Authorization" is checked in OAuth Client
- OR if you previously authorized and the token is still active
- To test authorization flow:
  1. Go to OAuth Bearer Token in Frappe
  2. Find your active token
  3. Delete it or set status to "Revoked"
  4. Try logging in again

### CORS Errors in Browser Console

**Problem**: Browser blocks requests to Frappe

**Solution**:
1. Add CORS configuration to Frappe (see "Failed to fetch" above)
2. Alternatively, use the OAuth Settings doctype in Frappe:
   - Go to OAuth Settings
   - Set "Allowed Public Client Origins": `http://localhost:3000`
   - Save

### Roles Not Showing Up

**Problem**: Roles array is empty in dashboard

**Solution**:
1. Check your user in Frappe has roles assigned
2. Go to User doctype → Your user → Roles table
3. Add roles (e.g., System User, System Manager)
4. Log out and log in again

## Testing Checklist

- [ ] Home page loads at http://localhost:3000
- [ ] Click "Get Started" redirects to Frappe login
- [ ] Can log in to Frappe
- [ ] Authorization screen shows requested scopes
- [ ] Click "Allow" redirects back to app
- [ ] Dashboard shows user information
- [ ] User name and email are correct
- [ ] Roles are displayed
- [ ] ID token is shown and decoded
- [ ] Profile picture displays (if set)
- [ ] Sign out button works
- [ ] Can sign in again

## Next Steps

Once the OAuth flow is working:

1. **Customize the UI** - Update pages in `app/` directory
2. **Add Role-Based Features** - Use `userInfo.roles` for authorization
3. **Use frappe-react-sdk** - Call Frappe APIs from your components
4. **Add More Routes** - Create new protected pages
5. **Setup Google Sign-In** - See [GOOGLE_SIGNIN_SETUP.md](GOOGLE_SIGNIN_SETUP.md)

## Example: Using frappe-react-sdk in a Component

Once authenticated, you can use Frappe APIs:

```typescript
import { useFrappeGetDocList } from "frappe-react-sdk";

function PatientList() {
  const { data, error, isLoading } = useFrappeGetDocList("Patient", {
    fields: ["name", "patient_name", "sex", "dob"],
    filters: [["status", "=", "Active"]],
    limit: 20,
  });

  if (isLoading) return <div>Loading patients...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((patient) => (
        <li key={patient.name}>
          {patient.patient_name} - {patient.sex}
        </li>
      ))}
    </ul>
  );
}
```

The Bearer token is automatically included in all API requests!

## Development Tips

- **Hot Reload**: Changes to files in `app/`, `lib/`, or `contexts/` auto-reload
- **Check Browser Console**: F12 → Console tab for any errors
- **Check Network Tab**: F12 → Network tab to see OAuth requests
- **Clear Tokens**: localStorage can be cleared via Browser DevTools → Application → Local Storage
- **Frappe Logs**: Check Frappe logs for backend errors: `bench logs`

## Resources

- Main README: [README.md](README.md)
- Google Sign-In: [GOOGLE_SIGNIN_SETUP.md](GOOGLE_SIGNIN_SETUP.md)
- frappe-react-sdk: https://github.com/The-Commit-Company/frappe-react-sdk
- Frappe OAuth Docs: https://docs.frappe.io/framework/user/en/guides/integration/rest_api/oauth-2
