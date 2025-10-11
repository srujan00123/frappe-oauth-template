/**
 * Secure storage utilities for OAuth tokens
 * Uses localStorage with proper key management
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: "frappe_access_token",
  REFRESH_TOKEN: "frappe_refresh_token",
  ID_TOKEN: "frappe_id_token",
  TOKEN_EXPIRY: "frappe_token_expiry",
  CODE_VERIFIER: "frappe_code_verifier",
  STATE: "frappe_state",
  USER_INFO: "frappe_user_info",
} as const;

export class TokenStorage {
  /**
   * Store tokens after successful authentication
   */
  static setTokens(
    accessToken: string,
    refreshToken: string | undefined,
    idToken: string | undefined,
    expiresIn: number
  ): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);

    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }

    if (idToken) {
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
    }

    // Calculate expiry timestamp
    const expiryTime = Date.now() + expiresIn * 1000;
    localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get ID token
   */
  static getIdToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
  }

  /**
   * Check if access token is expired
   */
  static isTokenExpired(): boolean {
    if (typeof window === "undefined") return true;

    const expiryTime = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiryTime) return true;

    // Add 60 second buffer to refresh before actual expiry
    return Date.now() >= parseInt(expiryTime) - 60000;
  }

  /**
   * Store PKCE code verifier (temporary, for OAuth flow)
   */
  static setCodeVerifier(codeVerifier: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
  }

  /**
   * Get and remove PKCE code verifier
   */
  static getAndRemoveCodeVerifier(): string | null {
    if (typeof window === "undefined") return null;

    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    return codeVerifier;
  }

  /**
   * Store state for CSRF protection (temporary, for OAuth flow)
   */
  static setState(state: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(STORAGE_KEYS.STATE, state);
  }

  /**
   * Get and remove state
   */
  static getAndRemoveState(): string | null {
    if (typeof window === "undefined") return null;

    const state = sessionStorage.getItem(STORAGE_KEYS.STATE);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
    return state;
  }

  /**
   * Store user info
   */
  static setUserInfo(userInfo: unknown): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  /**
   * Get user info
   */
  static getUserInfo(): unknown {
    if (typeof window === "undefined") return null;

    const userInfo = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfo) return null;

    try {
      return JSON.parse(userInfo);
    } catch {
      return null;
    }
  }

  /**
   * Clear all stored tokens and user info
   */
  static clearAll(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }
}
