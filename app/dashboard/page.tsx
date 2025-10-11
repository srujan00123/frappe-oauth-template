"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, userInfo, idToken, logout } =
    useFrappeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow px-6 py-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {userInfo.picture && (
                <img
                  src={userInfo.picture}
                  alt={userInfo.name}
                  className="h-12 w-12 rounded-full mr-4"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome, {userInfo.name}!
                </h1>
                <p className="text-sm text-gray-600">{userInfo.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* User Information Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 text-blue-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              User Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Subject (sub)</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {userInfo.sub}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{userInfo.name}</dd>
              </div>
              {userInfo.given_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Given Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userInfo.given_name}</dd>
                </div>
              )}
              {userInfo.family_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Family Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{userInfo.family_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{userInfo.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Issuer</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono text-xs bg-gray-50 p-2 rounded break-all">
                  {userInfo.iss}
                </dd>
              </div>
            </dl>
          </div>

          {/* Roles Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 text-green-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Assigned Roles
            </h2>
            <div className="space-y-2">
              {userInfo.roles && userInfo.roles.length > 0 ? (
                userInfo.roles.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center px-3 py-2 bg-green-50 text-green-800 rounded-md text-sm font-medium"
                  >
                    <svg
                      className="h-4 w-4 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {role}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* ID Token Card */}
        {idToken && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 text-purple-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Decoded ID Token
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-gray-800">
                {JSON.stringify(idToken, null, 2)}
              </pre>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              <strong>Note:</strong> The ID token is a JWT (JSON Web Token) that contains
              claims about the authenticated user. It includes the user's roles, which
              are used for authorization in your application.
            </p>
          </div>
        )}

        {/* Technical Details */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            OAuth 2.0 Flow Details
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Authorization Code Grant with PKCE (S256)</li>
            <li>• OpenID Connect for identity information</li>
            <li>• Roles included in both ID token and userinfo endpoint</li>
            <li>• Secure token storage in localStorage</li>
            <li>• Automatic token refresh when expired</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
