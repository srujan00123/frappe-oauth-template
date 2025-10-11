"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";

interface Patient {
  name: string;
  patient_name: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  sex?: string;
  blood_group?: string;
  mobile?: string;
  email?: string;
  phone?: string;
  dob?: string;
  status?: string;
  uid?: string;
  creation?: string;
  modified?: string;
  owner?: string;
  [key: string]: any;
}

function PatientDetail() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});

  // Fetch patient data
  const { data: patient, error, isLoading, mutate } = useFrappeGetDoc<Patient>(
    "Patient",
    patientId
  );

  // Update patient hook
  const {
    updateDoc,
    loading: updating,
    error: updateError,
    isCompleted,
    reset: resetUpdate,
  } = useFrappeUpdateDoc<Patient>();

  // Initialize form data when patient is loaded
  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name,
        middle_name: patient.middle_name,
        last_name: patient.last_name,
        sex: patient.sex,
        blood_group: patient.blood_group,
        mobile: patient.mobile,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob,
        uid: patient.uid,
      });
    }
  }, [patient]);

  // Handle successful update
  useEffect(() => {
    if (isCompleted) {
      mutate(); // Refresh patient data
      setIsEditing(false);
      resetUpdate();
    }
  }, [isCompleted, mutate, resetUpdate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await updateDoc("Patient", patientId, formData);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleCancel = () => {
    if (patient) {
      setFormData({
        first_name: patient.first_name,
        middle_name: patient.middle_name,
        last_name: patient.last_name,
        sex: patient.sex,
        blood_group: patient.blood_group,
        mobile: patient.mobile,
        email: patient.email,
        phone: patient.phone,
        dob: patient.dob,
        uid: patient.uid,
      });
    }
    setIsEditing(false);
    resetUpdate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-red-600 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</p>
            <p className="text-sm text-gray-600 mb-4">
              {error?.message || "The requested patient could not be found."}
            </p>
            <button
              onClick={() => router.push("/patients")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/patients")}
              className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center"
            >
              ← Back to Patients
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="mt-1 text-sm text-gray-600">
              Patient ID: <span className="font-mono text-blue-600">{patient.name}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Update Error */}
        {updateError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Update Failed</h3>
                <p className="text-sm text-red-700 mt-1">{updateError.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Patient Information Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name || ""}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.first_name}</p>
              )}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.middle_name || ""}
                  onChange={(e) => handleInputChange("middle_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.middle_name || "-"}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.last_name || ""}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.last_name || "-"}</p>
              )}
            </div>

            {/* Patient Name (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Auto-generated)
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{patient.patient_name}</p>
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              {isEditing ? (
                <select
                  value={formData.sex || ""}
                  onChange={(e) => handleInputChange("sex", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">{patient.sex || "-"}</p>
              )}
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group
              </label>
              {isEditing ? (
                <select
                  value={formData.blood_group || ""}
                  onChange={(e) => handleInputChange("blood_group", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="A Positive">A Positive</option>
                  <option value="A Negative">A Negative</option>
                  <option value="AB Positive">AB Positive</option>
                  <option value="AB Negative">AB Negative</option>
                  <option value="B Positive">B Positive</option>
                  <option value="B Negative">B Negative</option>
                  <option value="O Positive">O Positive</option>
                  <option value="O Negative">O Negative</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">{patient.blood_group || "-"}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob || ""}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.dob || "-"}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.mobile || ""}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.mobile || "-"}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.phone || "-"}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.email || "-"}</p>
              )}
            </div>

            {/* UID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identification Number (UID)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.uid || ""}
                  onChange={(e) => handleInputChange("uid", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{patient.uid || "-"}</p>
              )}
            </div>

            {/* Status (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  patient.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : patient.status === "Disabled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {patient.status || "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Metadata</h2>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Created On</p>
                <p className="text-sm text-gray-900">
                  {patient.creation
                    ? new Date(patient.creation).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Last Modified</p>
                <p className="text-sm text-gray-900">
                  {patient.modified
                    ? new Date(patient.modified).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
            {patient.owner && (
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <p className="text-sm text-gray-900">{patient.owner}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useFrappeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <PatientDetail />;
}
