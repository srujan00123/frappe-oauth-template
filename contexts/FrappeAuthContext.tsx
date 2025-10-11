"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FrappeProvider, FrappeContext } from "frappe-react-sdk";
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  decodeIdToken,
  revokeToken,
  logoutFromFrappe,
  type UserInfo,
  type IdTokenPayload,
} from "@/lib/oauth";
import { TokenStorage } from "@/lib/storage";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: UserInfo | null;
  idToken: IdTokenPayload | null;
  login: () => Promise<void>;
  logout: () => void;
  logoutFromFrappeSession: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface FrappeAuthProviderProps {
  children: React.ReactNode;
}

export function FrappeAuthProvider({ children }: FrappeAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [idToken, setIdToken] = useState<IdTokenPayload | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Environment variables
  const frappeServerUrl = process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL!;
  // Leave socketIOPort undefined when empty to use default /socket.io path (for Cloudflare tunnel)
  const socketIOPort = process.env.NEXT_PUBLIC_SOCKETIO_PORT || undefined;
  // For now, hardcode siteName - in production, fetch from API like Raven mobile does
  const siteName = "emr.localhost";
  const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  /**
   * Load user info from stored tokens
   */
  const loadUserInfo = useCallback(async (token: string) => {
    try {
      const info = await getUserInfo(frappeServerUrl, token);
      setUserInfo(info);
      TokenStorage.setUserInfo(info);

      // Also decode ID token if available
      const storedIdToken = TokenStorage.getIdToken();
      if (storedIdToken) {
        const decoded = decodeIdToken(storedIdToken);
        setIdToken(decoded);
      }
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  }, [frappeServerUrl]);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = TokenStorage.getAccessToken();

      if (token && !TokenStorage.isTokenExpired()) {
        setAccessToken(token);
        setIsAuthenticated(true);

        // Load cached user info first for immediate display
        const cachedUserInfo = TokenStorage.getUserInfo() as UserInfo | null;
        if (cachedUserInfo) {
          setUserInfo(cachedUserInfo);
        }

        // Then fetch fresh user info
        await loadUserInfo(token);
      } else if (token && TokenStorage.getRefreshToken()) {
        // Token expired but we have refresh token
        try {
          await refreshToken();
        } catch (error) {
          console.error("Failed to refresh token:", error);
          logout();
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, [loadUserInfo]);

  /**
   * Initiate OAuth login flow
   */
  const login = async () => {
    const redirectUri = `${appUrl}/auth/callback`;
    const { url, codeVerifier, state } = await getAuthorizationUrl(
      frappeServerUrl,
      clientId,
      redirectUri
    );

    // Store PKCE params for callback
    TokenStorage.setCodeVerifier(codeVerifier);
    TokenStorage.setState(state);

    // Redirect to authorization URL
    window.location.href = url;
  };

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    const token = TokenStorage.getAccessToken();

    // Revoke the OAuth token in Frappe
    if (token) {
      try {
        await revokeToken(frappeServerUrl, token, clientId, clientSecret);
      } catch (error) {
        console.warn("Token revocation failed:", error);
        // Continue with logout even if revocation fails
      }
    }

    // Clear all local tokens and state
    TokenStorage.clearAll();
    setIsAuthenticated(false);
    setUserInfo(null);
    setIdToken(null);
    setAccessToken(null);

    // Redirect to home page after logout
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [frappeServerUrl, clientId, clientSecret]);

  /**
   * Logout from Frappe session (also logs out OAuth)
   */
  const logoutFromFrappeSession = useCallback(async () => {
    const token = TokenStorage.getAccessToken();

    // First logout from Frappe session (clears cookies via iframe)
    await logoutFromFrappe(frappeServerUrl);

    // Then revoke OAuth token
    if (token) {
      try {
        await revokeToken(frappeServerUrl, token, clientId, clientSecret);
      } catch (error) {
        console.warn("Token revocation failed:", error);
      }
    }

    // Clear all local tokens and state
    TokenStorage.clearAll();
    setIsAuthenticated(false);
    setUserInfo(null);
    setIdToken(null);
    setAccessToken(null);

    // Redirect to home page after logout
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [frappeServerUrl, clientId, clientSecret]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    const refreshTkn = TokenStorage.getRefreshToken();
    if (!refreshTkn) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await refreshAccessToken(
        frappeServerUrl,
        clientId,
        clientSecret,
        refreshTkn
      );

      TokenStorage.setTokens(
        response.access_token,
        response.refresh_token,
        response.id_token,
        response.expires_in
      );

      setAccessToken(response.access_token);
      setIsAuthenticated(true);

      await loadUserInfo(response.access_token);
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
      throw error;
    }
  }, [frappeServerUrl, clientId, clientSecret, loadUserInfo, logout]);

  /**
   * Handle OAuth callback
   */
  const handleCallback = useCallback(async (code: string, state: string) => {
    // Check if we've already processed this callback
    const existingToken = TokenStorage.getAccessToken();
    if (existingToken && !TokenStorage.isTokenExpired()) {
      console.log("Already authenticated, skipping callback");
      return;
    }

    // Check if code verifier exists BEFORE removing it
    const codeVerifierExists = typeof window !== "undefined" &&
      sessionStorage.getItem("frappe_code_verifier") !== null;

    if (!codeVerifierExists) {
      console.log("Code verifier already processed, skipping callback");
      return;
    }

    const storedState = TokenStorage.getAndRemoveState();
    const codeVerifier = TokenStorage.getAndRemoveCodeVerifier();

    // Verify state for CSRF protection
    if (state && storedState && state !== storedState) {
      console.warn("State parameter mismatch - possible CSRF attempt");
      throw new Error("Invalid state parameter");
    }

    if (!codeVerifier) {
      console.error("Code verifier not found in sessionStorage");
      throw new Error("Code verifier not found. Please try logging in again.");
    }

    const redirectUri = `${appUrl}/auth/callback`;

    const response = await exchangeCodeForToken(
      frappeServerUrl,
      clientId,
      clientSecret,
      code,
      codeVerifier,
      redirectUri
    );

    // Store tokens
    TokenStorage.setTokens(
      response.access_token,
      response.refresh_token,
      response.id_token,
      response.expires_in
    );

    setAccessToken(response.access_token);
    setIsAuthenticated(true);

    // Load user info
    await loadUserInfo(response.access_token);
  }, [frappeServerUrl, clientId, clientSecret, appUrl, loadUserInfo]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    userInfo,
    idToken,
    login,
    logout,
    logoutFromFrappeSession,
    refreshToken,
  };

  // Expose handleCallback for the callback route
  // @ts-ignore - attach to window for callback route access
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__frappeAuthHandleCallback = handleCallback;
  }

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated && accessToken ? (
        <FrappeProvider
          url={frappeServerUrl}
          tokenParams={{
            useToken: true,
            token: () => accessToken,
            type: "Bearer",
          }}
          {...(socketIOPort && { socketPort: socketIOPort })}
          {...(siteName && { siteName: siteName })}
        >
          {children}
        </FrappeProvider>
      ) : (
        <>{children}</>
      )}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use Frappe authentication
 */
export function useFrappeAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useFrappeAuth must be used within FrappeAuthProvider");
  }
  return context;
}

/**
 * Hook to access Frappe SDK context (including socket)
 */
export function useFrappeContext() {
  return useContext(FrappeContext);
}
