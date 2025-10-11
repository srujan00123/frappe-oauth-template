/**
 * OAuth 2.0 with PKCE (Proof Key for Code Exchange) utilities
 * Implements secure OAuth flow for Frappe Framework backend
 */

// Generate a random code verifier for PKCE
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

// Generate code challenge from code verifier using SHA-256
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64URLEncode(new Uint8Array(hash));
}

// Base64 URL encoding (RFC 4648)
function base64URLEncode(array: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Generate random state for CSRF protection
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Build the authorization URL for OAuth flow
 */
export async function getAuthorizationUrl(
  frappeServerUrl: string,
  clientId: string,
  redirectUri: string,
  scopes: string[] = ["all", "openid"]
): Promise<{ url: string; codeVerifier: string; state: string }> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state: state,
  });

  const url = `${frappeServerUrl}/api/method/frappe.integrations.oauth2.authorize?${params.toString()}`;

  return { url, codeVerifier, state };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  frappeServerUrl: string,
  clientId: string,
  clientSecret: string,
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<TokenResponse> {
  const tokenEndpoint = `${frappeServerUrl}/api/method/frappe.integrations.oauth2.get_token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  // Add client secret for confidential clients
  if (clientSecret) {
    body.append("client_secret", clientSecret);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || "Token exchange failed");
  }

  const data = await response.json();
  return data as TokenResponse;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  frappeServerUrl: string,
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<TokenResponse> {
  const tokenEndpoint = `${frappeServerUrl}/api/method/frappe.integrations.oauth2.get_token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  if (clientSecret) {
    body.append("client_secret", clientSecret);
  }

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.error || "Token refresh failed");
  }

  const data = await response.json();
  return data as TokenResponse;
}

/**
 * Revoke OAuth access token
 */
export async function revokeToken(
  frappeServerUrl: string,
  token: string,
  clientId: string,
  clientSecret?: string
): Promise<void> {
  const revokeEndpoint = `${frappeServerUrl}/api/method/frappe.integrations.oauth2.revoke_token`;

  const body = new URLSearchParams({
    token: token,
    token_type_hint: "access_token",
  });

  // Add Basic auth if client secret is available
  const headers: HeadersInit = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (clientSecret) {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    headers["Authorization"] = `Basic ${credentials}`;
  }

  const response = await fetch(revokeEndpoint, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  // Revocation endpoint returns 200 even if token doesn't exist
  if (!response.ok && response.status !== 200) {
    console.warn("Token revocation failed, but continuing with logout");
  }
}

/**
 * Logout from Frappe session (clears Frappe cookies)
 * Opens Frappe logout in a hidden iframe to clear cookies
 */
export async function logoutFromFrappe(
  frappeServerUrl: string
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    // Create hidden iframe to logout from Frappe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `${frappeServerUrl}/api/method/logout`;

    // Remove iframe and resolve after logout completes
    iframe.onload = () => {
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 500);
    };

    iframe.onerror = () => {
      console.warn("Frappe logout failed");
      document.body.removeChild(iframe);
      resolve();
    };

    document.body.appendChild(iframe);
  });
}

/**
 * Get user information from the userinfo endpoint
 */
export async function getUserInfo(
  frappeServerUrl: string,
  accessToken: string
): Promise<UserInfo> {
  const userinfoEndpoint = `${frappeServerUrl}/api/method/frappe.integrations.oauth2.openid_profile`;

  const response = await fetch(userinfoEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  const data = await response.json();
  return data as UserInfo;
}

/**
 * Decode JWT ID token (without verification - for display purposes only)
 * For production, verify the signature on the server side
 */
export function decodeIdToken(idToken: string): IdTokenPayload {
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
}

// Type definitions
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
  roles: string[];
  iss: string;
}

export interface IdTokenPayload {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  email: string;
  picture?: string;
  roles: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
}
