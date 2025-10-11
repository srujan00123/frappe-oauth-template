# Frappe Next.js OAuth Template

A production-ready Next.js 15 template for building applications with Frappe Framework using OAuth 2.0 authentication. Includes complete integration with frappe-react-sdk for seamless API access.

## Features

- ✅ **OAuth 2.0 Authorization Code Flow with PKCE** (S256) for enhanced security
- ✅ **OpenID Connect** for user identity information
- ✅ **Role-Based Access Control** - User roles from Frappe included in authentication
- ✅ **Automatic Token Refresh** with secure storage and expiration handling
- ✅ **TypeScript** for type safety and better DX
- ✅ **frappe-react-sdk** integration for seamless Frappe API calls
- ✅ **Tailwind CSS** for modern, responsive UI
- ✅ **Next.js 15 App Router** with server and client components

## How OAuth Works in Frappe

Frappe Framework has built-in support for OAuth 2.0 and OpenID Connect. Here's how it works:

### 1. Authorization Flow

1. User clicks "Sign in with Frappe"
2. App redirects to Frappe authorization endpoint with:
   - `client_id` - Your OAuth client ID
   - `redirect_uri` - Where to send the user after authorization
   - `response_type=code` - Request an authorization code
   - `scope=all openid` - Request all scopes and OpenID Connect
   - `code_challenge` - PKCE challenge for security
   - `code_challenge_method=S256` - SHA-256 hashing
   - `state` - Random value for CSRF protection

3. User authorizes the app in Frappe
4. Frappe redirects back with authorization code
5. App exchanges code for tokens using:
   - Authorization code
   - PKCE code verifier
   - Client credentials

6. App receives:
   - `access_token` - For API requests
   - `refresh_token` - For getting new access tokens
   - `id_token` - JWT with user information
   - `expires_in` - Token expiration time

### 2. User Roles

Frappe includes user roles in the authentication response in two ways:

1. **ID Token (JWT)** - Decoded to show user info including roles
2. **UserInfo Endpoint** - `/api/method/frappe.integrations.oauth2.openid_profile`

Both include the `roles` array from Frappe's user management system.

### 3. Token Management

- Access tokens are stored in `localStorage`
- Refresh tokens are used to get new access tokens when expired
- PKCE parameters are stored in `sessionStorage` during the flow
- Tokens are automatically refreshed 60 seconds before expiration

## Setup Instructions

### Prerequisites

- Node.js 18+
- A Frappe instance (local or cloud)
- Basic understanding of OAuth 2.0

### 1. Create an OAuth Client in Frappe

1. Log in to your Frappe instance as an Administrator
2. Go to **OAuth Client** doctype
3. Create a new OAuth Client with these settings:

```
App Name: Frappe OAuth Demo
Scopes: all openid
Redirect URIs: http://localhost:3000/auth/callback
Default Redirect URI: http://localhost:3000/auth/callback
Grant Type: Authorization Code
Response Type: Code
Token Endpoint Auth Method: Client Secret Basic (or None for public clients)
Skip Authorization: ☐ (unchecked for testing)
```

4. Save and note down:
   - **Client ID** - Auto-generated, same as the document name
   - **Client Secret** - Auto-generated

### 2. Configure the Application

1. Clone or navigate to the project directory:

```bash
cd /workspace/development/frappe-oauth-demo
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env.local` file from example:

```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your OAuth client details:

```env
# Your Frappe server URL
NEXT_PUBLIC_FRAPPE_SERVER_URL=http://your-frappe-server.com

# OAuth Client ID from Frappe
NEXT_PUBLIC_OAUTH_CLIENT_ID=your_client_id_here

# OAuth Client Secret from Frappe (leave empty for public clients)
OAUTH_CLIENT_SECRET=your_client_secret_here

# Your Next.js app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frappe-oauth-demo/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx               # Protected dashboard page
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── layout.tsx                 # Root layout with FrappeAuthProvider
│   └── page.tsx                   # Home page
├── contexts/
│   └── FrappeAuthContext.tsx      # Auth context with frappe-react-sdk
├── lib/
│   ├── oauth.ts                   # OAuth utilities (PKCE, token exchange)
│   └── storage.ts                 # Secure token storage
├── .env.local                     # Environment variables (not in git)
├── .env.example                   # Environment template
└── README.md                      # This file
```

## Key Components

### OAuth Utilities ([lib/oauth.ts](lib/oauth.ts))

- `generateCodeVerifier()` - Create random PKCE code verifier
- `generateCodeChallenge()` - Hash verifier with SHA-256
- `getAuthorizationUrl()` - Build authorization URL with PKCE
- `exchangeCodeForToken()` - Exchange auth code for tokens
- `refreshAccessToken()` - Get new access token
- `getUserInfo()` - Fetch user info from Frappe
- `decodeIdToken()` - Decode JWT ID token

### Token Storage ([lib/storage.ts](lib/storage.ts))

- Secure token management in localStorage/sessionStorage
- Automatic expiration checking
- PKCE parameter handling
- User info caching

### Auth Context ([contexts/FrappeAuthContext.tsx](contexts/FrappeAuthContext.tsx))

- React context for authentication state
- Integration with frappe-react-sdk's `FrappeProvider`
- Automatic token refresh
- User session management

## Usage

### Protecting Routes

Routes are protected by checking authentication state:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";

export default function ProtectedPage() {
  const { isAuthenticated, isLoading, userInfo } = useFrappeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Welcome {userInfo?.name}!</div>;
}
```

### Using frappe-react-sdk

Once authenticated, use frappe-react-sdk hooks for Frappe API operations. For comprehensive documentation on all available hooks and usage examples, see [FRAPPE_REACT_SDK_GUIDE.md](FRAPPE_REACT_SDK_GUIDE.md).

Quick example:

```typescript
import { useFrappeGetDocList } from "frappe-react-sdk";

function MyComponent() {
  const { data, error, isLoading } = useFrappeGetDocList("ToDo", {
    fields: ["name", "description", "status"],
    filters: [["status", "=", "Open"]],
    limit: 10,
  });

  // Your component logic
}
```

### Accessing User Roles

```typescript
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";

function RoleBasedComponent() {
  const { userInfo } = useFrappeAuth();

  const isManager = userInfo?.roles.includes("System Manager");
  const canViewReports = userInfo?.roles.includes("Report Manager");

  return (
    <div>
      {isManager && <AdminPanel />}
      {canViewReports && <ReportsSection />}
    </div>
  );
}
```

## Frappe OAuth Endpoints

This template uses the following Frappe endpoints:

- **Authorization**: `/api/method/frappe.integrations.oauth2.authorize`
- **Token**: `/api/method/frappe.integrations.oauth2.get_token`
- **UserInfo**: `/api/method/frappe.integrations.oauth2.openid_profile`
- **Token Revocation**: `/api/method/frappe.integrations.oauth2.revoke_token`
- **Token Introspection**: `/api/method/frappe.integrations.oauth2.introspect_token`

## Security Best Practices

1. ✅ **PKCE (S256)** - Prevents authorization code interception
2. ✅ **State Parameter** - Protects against CSRF attacks
3. ✅ **Secure Token Storage** - Uses localStorage with expiration
4. ✅ **Automatic Token Refresh** - Minimizes exposure window
5. ✅ **HTTPS in Production** - Always use HTTPS for OAuth flows
6. ✅ **Client Secret Protection** - Stored in environment variables (server-side only)

## Troubleshooting

### "Invalid redirect_uri" Error

Ensure the redirect URI in your `.env.local` matches exactly what's configured in the Frappe OAuth Client:
- Check for trailing slashes
- Verify protocol (http vs https)
- Confirm port number

### "Invalid client" Error

- Verify `NEXT_PUBLIC_OAUTH_CLIENT_ID` matches the OAuth Client name in Frappe
- For confidential clients, ensure `OAUTH_CLIENT_SECRET` is correct

### Token Refresh Fails

- Check if the refresh token is expired (Frappe default: 30 days)
- Verify the OAuth Client still exists and is active
- Check Frappe server logs for errors

### CORS Issues

If running Frappe locally, you may need to configure CORS:

```python
# In your Frappe site's site_config.json
{
  "allow_cors": "*",  # Or specify "http://localhost:3000"
}
```

## Google Sign-In Integration

You can add Google Sign-In to work with this OAuth setup. Users will sign in with Google through Frappe, then your app authenticates with Frappe via OAuth.

### Setup Steps

#### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure consent screen if needed
6. Application type: **Web application**
7. Add Authorized redirect URIs:
   ```
   http://your-frappe-server.com/api/method/frappe.integrations.oauth2_logins.custom/google
   ```
8. Note your **Client ID** and **Client Secret**

#### 2. Configure Social Login in Frappe

1. Log in to Frappe as Administrator
2. Go to **Social Login Key** doctype
3. Create a new Social Login Key:
   ```
   Social Login Provider: Google
   Client ID: [Your Google Client ID]
   Client Secret: [Your Google Client Secret]
   Enable Social Login: ✓
   ```
4. Save

#### 3. How It Works

1. User visits your Next.js app
2. Clicks "Sign in with Frappe"
3. On Frappe login page, they see "Sign in with Google" button
4. After Google authentication, Frappe creates/logs in the user
5. User authorizes your OAuth app
6. Your Next.js app receives OAuth tokens as normal

**No changes needed to your Next.js code!** The Google sign-in happens on Frappe's side, and your app continues using OAuth as before.

### Alternative: Direct Google Sign-In in Next.js

If you want Google Sign-In button directly in your Next.js app:

1. Install dependencies:
   ```bash
   npm install @react-oauth/google jwt-decode
   ```

2. Create Google login component:
   ```typescript
   import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

   function GoogleSignInButton() {
     const handleGoogleSuccess = async (credentialResponse) => {
       // Send Google token to Frappe endpoint
       const response = await fetch(`${FRAPPE_URL}/api/method/your_app.auth.google_login`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: credentialResponse.credential })
       });

       // Handle Frappe response and start OAuth flow
     };

     return (
       <GoogleLogin
         onSuccess={handleGoogleSuccess}
         onError={() => console.log('Login Failed')}
       />
     );
   }
   ```

3. Create Frappe backend method to validate Google token and create session

This approach requires custom backend code in Frappe.

## Learn More

- [Frappe OAuth 2.0 Documentation](https://docs.frappe.io/framework/user/en/guides/integration/rest_api/oauth-2)
- [Frappe Social Login](https://docs.frappe.io/framework/user/en/guides/integration/using_oauth#social-login)
- [frappe-react-sdk](https://github.com/The-Commit-Company/frappe-react-sdk)
- [Next.js Documentation](https://nextjs.org/docs)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect](https://openid.net/connect/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## License

MIT

## Getting Started with Your App

Now that you have OAuth authentication working, you can:

1. **Read the SDK Guide**: See [FRAPPE_REACT_SDK_GUIDE.md](FRAPPE_REACT_SDK_GUIDE.md) for complete documentation on using frappe-react-sdk hooks
2. **Create New Pages**: Add pages in the `app/` directory following Next.js App Router conventions
3. **Build Components**: Use frappe-react-sdk hooks to interact with your Frappe backend
4. **Customize Dashboard**: Modify [app/dashboard/page.tsx](app/dashboard/page.tsx) to add your app's functionality
5. **Deploy**: Build and deploy your app following Next.js deployment guides

## Contributing

This is a template project for building Frappe-powered applications. Feel free to fork, customize, and use it as a foundation for your own projects!
