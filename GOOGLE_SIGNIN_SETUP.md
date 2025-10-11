# Google Sign-In Setup Guide

This guide explains how to add Google Sign-In to your Frappe OAuth application.

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌────────────┐
│   Next.js   │         │   Frappe Server  │         │   Google   │
│     App     │         │   (with OAuth)   │         │   OAuth    │
└─────────────┘         └──────────────────┘         └────────────┘
       │                         │                          │
       │  1. Click "Sign in"     │                          │
       ├────────────────────────>│                          │
       │                         │                          │
       │  2. Redirect to login   │                          │
       │<────────────────────────┤                          │
       │                         │                          │
       │  3. User clicks         │                          │
       │     "Sign in with       │  4. Google OAuth flow    │
       │      Google" button     ├─────────────────────────>│
       │                         │                          │
       │                         │  5. User authenticates   │
       │                         │<─────────────────────────┤
       │                         │                          │
       │                         │  6. Frappe creates/      │
       │                         │     logs in user         │
       │                         │                          │
       │  7. OAuth authorization │                          │
       │<────────────────────────┤                          │
       │                         │                          │
       │  8. Exchange code for   │                          │
       │     tokens              │                          │
       ├────────────────────────>│                          │
       │                         │                          │
       │  9. Access token +      │                          │
       │     User info (roles)   │                          │
       │<────────────────────────┤                          │
       │                         │                          │
```

## Method 1: Google Sign-In via Frappe (Recommended)

### Advantages
- ✅ No code changes to your Next.js app
- ✅ Frappe handles Google authentication
- ✅ Users are automatically created in Frappe
- ✅ Existing OAuth flow works unchanged
- ✅ User roles managed in Frappe
- ✅ Centralized user management

### Step-by-Step Setup

#### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Navigate to https://console.cloud.google.com/

2. **Create or Select Project**
   - Click project dropdown → "New Project"
   - Name: "Frappe OAuth App" (or your choice)
   - Click "Create"

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External (or Internal for Workspace)
   - Click "Create"
   - Fill in required fields:
     - App name: "Your App Name"
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com
   - Click "Save and Continue"
   - Scopes: Add `userinfo.email` and `userinfo.profile`
   - Click "Save and Continue"
   - Test users (for development): Add your test emails
   - Click "Save and Continue"

5. **Create OAuth Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: "Frappe Social Login"
   - Authorized redirect URIs:
     ```
     http://your-frappe-server.com/api/method/frappe.integrations.oauth2_logins.custom/google
     https://your-frappe-server.com/api/method/frappe.integrations.oauth2_logins.custom/google
     ```
     **Important**: Include both http (dev) and https (prod)
   - Click "Create"
   - **Save your Client ID and Client Secret**

#### Step 2: Configure Frappe Social Login

1. **Log in to Frappe**
   - Open your Frappe instance
   - Log in as Administrator

2. **Open Social Login Key**
   - Search for "Social Login Key" in the awesome bar
   - Click "New"

3. **Configure Google Provider**
   ```
   Social Login Provider: Google
   Client ID: [Paste your Google Client ID]
   Client Secret: [Paste your Google Client Secret]
   Enable Social Login: ✓ (checked)
   ```

4. **Advanced Settings (Optional)**
   - Base URL: Leave default or specify your domain
   - Icon: Google icon (default)
   - Sign Up Enabled: ✓ (to allow new user registration)

5. **Save**

#### Step 3: Test the Integration

1. **Logout from Frappe**
   - Log out from your Frappe instance

2. **Visit Login Page**
   - You should now see "Sign in with Google" button

3. **Test Google Login**
   - Click "Sign in with Google"
   - Authenticate with your Google account
   - Grant permissions
   - You'll be logged into Frappe

4. **Check User Creation**
   - Go to User doctype
   - Your Google email should be there
   - Default role: System User (you can assign more roles)

#### Step 4: Use with Your Next.js App

**No changes needed!** Your Next.js OAuth app will work as before:

1. User clicks "Sign in with Frappe" in your Next.js app
2. Redirects to Frappe authorization page
3. User can choose:
   - Standard Frappe login
   - **Google Sign-In** (new!)
4. After authentication, normal OAuth flow continues
5. Your app receives access token with user info and roles

### Testing the Full Flow

```bash
# Start your Next.js app
cd /workspace/development/frappe-oauth-demo
npm run dev

# Visit http://localhost:3000
# Click "Sign in with Frappe"
# On Frappe login page, click "Sign in with Google"
# After Google auth, authorize the OAuth app
# You'll be redirected back to dashboard with Google user info
```

## Method 2: Direct Google Sign-In in Next.js

If you want the Google Sign-In button directly in your Next.js app (more complex):

### Setup

1. **Install Dependencies**
   ```bash
   npm install @react-oauth/google
   ```

2. **Create Google Auth Component**

   Create `components/GoogleSignIn.tsx`:
   ```typescript
   "use client";

   import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
   import { useRouter } from 'next/navigation';

   const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
   const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL!;

   export function GoogleSignIn() {
     const router = useRouter();

     const handleSuccess = async (credentialResponse: any) => {
       try {
         // Send Google credential to your Frappe backend
         const response = await fetch(
           `${FRAPPE_URL}/api/method/your_app.api.auth.google_login`,
           {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               credential: credentialResponse.credential,
             }),
           }
         );

         const data = await response.json();

         if (data.message.success) {
           // Get OAuth tokens from Frappe
           // Store and redirect to dashboard
           router.push('/dashboard');
         }
       } catch (error) {
         console.error('Google login failed:', error);
       }
     };

     return (
       <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
         <GoogleLogin
           onSuccess={handleSuccess}
           onError={() => console.log('Login Failed')}
           theme="outline"
           size="large"
           text="signin_with"
         />
       </GoogleOAuthProvider>
     );
   }
   ```

3. **Add to Login Page**

   Update `app/login/page.tsx`:
   ```typescript
   import { GoogleSignIn } from "@/components/GoogleSignIn";

   // ... in your JSX:
   <div className="mt-6">
     <GoogleSignIn />
   </div>
   ```

4. **Create Frappe Backend Method**

   In your Frappe app, create `your_app/api/auth.py`:
   ```python
   import frappe
   import requests
   from google.oauth2 import id_token
   from google.auth.transport import requests as google_requests

   @frappe.whitelist(allow_guest=True)
   def google_login(credential):
       """Validate Google credential and log in user"""
       try:
           # Verify Google token
           idinfo = id_token.verify_oauth2_token(
               credential,
               google_requests.Request(),
               frappe.conf.google_client_id
           )

           # Get user info
           email = idinfo['email']
           given_name = idinfo.get('given_name', '')
           family_name = idinfo.get('family_name', '')

           # Check if user exists
           if not frappe.db.exists('User', email):
               # Create new user
               user = frappe.get_doc({
                   'doctype': 'User',
                   'email': email,
                   'first_name': given_name,
                   'last_name': family_name,
                   'enabled': 1,
                   'send_welcome_email': 0
               })
               user.insert(ignore_permissions=True)
               frappe.db.commit()

           # Log in user
           frappe.local.login_manager.login_as(email)

           # Generate OAuth token for the user
           # Return token to Next.js app

           return {
               'success': True,
               'user': email,
           }

       except Exception as e:
           frappe.log_error(f"Google login failed: {str(e)}")
           return {'success': False, 'error': str(e)}
   ```

5. **Update Environment Variables**

   Add to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

### Disadvantages of Method 2
- ❌ Requires custom Frappe backend code
- ❌ More complex token management
- ❌ Need to maintain Google auth logic
- ❌ Additional security considerations
- ❌ Duplicates authentication logic

## Recommended Approach

**Use Method 1** (Google Sign-In via Frappe Social Login):
- Simpler setup
- No code changes needed
- Leverages Frappe's built-in functionality
- Centralized user management
- Better security

Your OAuth app continues to work exactly as designed, with the added benefit that users can sign in with Google on Frappe's login page.

## Troubleshooting

### "Redirect URI mismatch" Error

**Problem**: Google shows "redirect_uri_mismatch" error

**Solution**:
1. Verify the redirect URI in Google Console exactly matches:
   ```
   http://your-frappe-server.com/api/method/frappe.integrations.oauth2_logins.custom/google
   ```
2. Check for:
   - Trailing slashes (should not have any)
   - HTTP vs HTTPS
   - Subdomain spelling
   - Port numbers (if using non-standard ports)

### Google Sign-In Button Not Showing

**Problem**: Don't see "Sign in with Google" on Frappe login page

**Solution**:
1. Check Social Login Key is enabled
2. Clear browser cache and cookies
3. Verify `Enable Social Login` is checked
4. Check Frappe error logs: `bench --site [sitename] logs`

### User Not Created in Frappe

**Problem**: Google login works but user isn't in Frappe

**Solution**:
1. Check "Sign Up Enabled" in Social Login Key
2. Verify user email permissions
3. Check Frappe error logs for user creation failures
4. Ensure required user fields are set

### OAuth Flow Fails After Google Login

**Problem**: Google login works but OAuth authorization fails

**Solution**:
1. Ensure OAuth Client is properly configured
2. Check user has access to the OAuth Client (allowed roles)
3. Verify redirect URIs in OAuth Client match your app
4. Check browser console for errors

## Additional Resources

- [Frappe Social Login Documentation](https://docs.frappe.io/framework/user/en/guides/integration/using_oauth#social-login)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Best Practices](https://developers.google.com/identity/sign-in/web/sign-in)
