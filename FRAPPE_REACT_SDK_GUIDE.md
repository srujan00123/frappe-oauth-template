# Frappe React SDK Usage Guide

This guide covers how to use frappe-react-sdk in your Next.js application to interact with Frappe backend APIs.

## Table of Contents

- [Setup](#setup)
- [Authentication Hooks](#authentication-hooks)
- [Database Hooks](#database-hooks)
- [API Call Hooks](#api-call-hooks)
- [File Upload](#file-upload)
- [Real-time Updates](#real-time-updates)
- [Best Practices](#best-practices)
- [Complete Examples](#complete-examples)

## Setup

The SDK is already configured in this template via `FrappeProvider` in the auth context.

```typescript
import { FrappeProvider } from "frappe-react-sdk";

<FrappeProvider
  url={frappeServerUrl}
  tokenParams={{
    useToken: true,
    token: () => accessToken,
    type: "Bearer",
  }}
  socketPort={socketIOPort}
>
  {children}
</FrappeProvider>
```

## Authentication Hooks

### useFrappeAuth

Get current user and authentication functions (custom implementation in this template):

```typescript
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";

const { isAuthenticated, isLoading, userInfo, idToken, login, logout } = useFrappeAuth();
```

## Database Hooks

### useFrappeGetDoc

Fetch a single document by name:

```typescript
import { useFrappeGetDoc } from "frappe-react-sdk";

interface Patient {
  name: string;
  patient_name: string;
  email?: string;
  mobile?: string;
}

function PatientDetail({ patientId }: { patientId: string }) {
  const { data, error, isLoading, mutate } = useFrappeGetDoc<Patient>(
    "Patient",
    patientId
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.patient_name}</h1>
      <p>Email: {data?.email}</p>
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}
```

**Parameters:**
- `doctype`: The DocType name (e.g., "Patient", "Sales Invoice")
- `name`: The document name/ID
- `swrKey`: Optional custom cache key
- `options`: SWR configuration options

**Returns:**
- `data`: The document data
- `error`: Error object if request fails
- `isLoading`: Boolean indicating loading state
- `isValidating`: Boolean for revalidation state
- `mutate()`: Function to revalidate/refresh data

### useFrappeGetDocList

Fetch a list of documents with filters, pagination, and sorting:

```typescript
import { useFrappeGetDocList } from "frappe-react-sdk";

function PatientList() {
  const { data: patients, error, isLoading } = useFrappeGetDocList<Patient>(
    "Patient",
    {
      fields: ["name", "patient_name", "email", "mobile", "sex"],
      filters: [["status", "=", "Active"]],
      limit_start: 0,
      limit: 20,
      orderBy: {
        field: "creation",
        order: "desc",
      },
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {patients?.map((patient) => (
        <li key={patient.name}>{patient.patient_name}</li>
      ))}
    </ul>
  );
}
```

**Query Parameters:**
```typescript
{
  fields?: string[];              // Fields to fetch
  filters?: Filter[];             // [[field, operator, value], ...]
  orFilters?: Filter[];          // OR filters
  limit_start?: number;          // Pagination offset
  limit?: number;                // Number of records
  orderBy?: {                    // Sorting
    field: string;
    order: "asc" | "desc";
  };
}
```

**Filter Operators:**
- `=`, `!=`: Equality
- `>`, `<`, `>=`, `<=`: Comparison
- `like`, `not like`: Pattern matching
- `in`, `not in`: Array membership
- `is`: IS NULL, IS NOT NULL
- `between`: Range

**Examples:**
```typescript
// Simple filter
filters: [["status", "=", "Active"]]

// Multiple filters (AND)
filters: [
  ["status", "=", "Active"],
  ["creation", ">", "2024-01-01"]
]

// OR filters
orFilters: [
  ["status", "=", "Active"],
  ["status", "=", "Pending"]
]

// LIKE filter
filters: [["patient_name", "like", "%John%"]]

// IN filter
filters: [["status", "in", ["Active", "Pending"]]]
```

### useFrappeGetDocCount

Get total count of documents:

```typescript
import { useFrappeGetDocCount } from "frappe-react-sdk";

function PatientStats() {
  const { data: totalPatients } = useFrappeGetDocCount(
    "Patient",
    [["status", "=", "Active"]], // filters (optional)
    false, // cache (optional)
    false  // debug (optional)
  );

  return <div>Total Active Patients: {totalPatients || 0}</div>;
}
```

### useFrappeCreateDoc

Create a new document:

```typescript
import { useFrappeCreateDoc } from "frappe-react-sdk";

function CreatePatientForm() {
  const { createDoc, loading, error, isCompleted, reset } = useFrappeCreateDoc<Patient>();
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    try {
      const newPatient = await createDoc("Patient", {
        first_name: formData.firstName,
        email: formData.email,
        mobile: formData.mobile,
      });
      console.log("Created:", newPatient);
    } catch (err) {
      console.error("Failed to create:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Patient"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isCompleted && <p>Patient created successfully!</p>}
    </form>
  );
}
```

### useFrappeUpdateDoc

Update an existing document:

```typescript
import { useFrappeUpdateDoc } from "frappe-react-sdk";

function EditPatient({ patientId }: { patientId: string }) {
  const { data: patient, mutate } = useFrappeGetDoc<Patient>("Patient", patientId);
  const { updateDoc, loading, error, isCompleted } = useFrappeUpdateDoc<Patient>();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (patient) setFormData(patient);
  }, [patient]);

  const handleUpdate = async () => {
    try {
      await updateDoc("Patient", patientId, {
        email: formData.email,
        mobile: formData.mobile,
      });
      mutate(); // Refresh the data
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div>
      {/* Form fields */}
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isCompleted && <p>Updated successfully!</p>}
    </div>
  );
}
```

### useFrappeDeleteDoc

Delete a document:

```typescript
import { useFrappeDeleteDoc } from "frappe-react-sdk";

function DeletePatient({ patientId, onDeleted }: Props) {
  const { deleteDoc, loading, error } = useFrappeDeleteDoc();

  const handleDelete = async () => {
    if (confirm("Are you sure?")) {
      try {
        await deleteDoc("Patient", patientId);
        onDeleted();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
```

## API Call Hooks

### useFrappeGetCall

Make GET requests to custom API methods:

```typescript
import { useFrappeGetCall } from "frappe-react-sdk";

function DashboardStats() {
  const { data, error, isLoading } = useFrappeGetCall<StatsData>(
    "your_app.api.get_dashboard_stats",
    {
      from_date: "2024-01-01",
      to_date: "2024-12-31",
    }
  );

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error loading stats</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

### useFrappePostCall

Make POST requests to custom API methods:

```typescript
import { useFrappePostCall } from "frappe-react-sdk";

function SendNotification() {
  const { call, loading, error, isCompleted } = useFrappePostCall("your_app.api.send_notification");

  const handleSend = async () => {
    try {
      const result = await call({
        recipient: "user@example.com",
        message: "Hello World",
      });
      console.log("Response:", result);
    } catch (err) {
      console.error("Failed:", err);
    }
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      {loading ? "Sending..." : "Send Notification"}
    </button>
  );
}
```

### useFrappePutCall & useFrappeDeleteCall

Similar to POST, but for PUT and DELETE HTTP methods:

```typescript
const { call, loading, error } = useFrappePutCall("your_app.api.update_settings");
const { call, loading, error } = useFrappeDeleteCall("your_app.api.delete_resource");
```

## File Upload

### useFrappeFileUpload

Upload files to Frappe:

```typescript
import { useFrappeFileUpload } from "frappe-react-sdk";

function FileUploader({ patientId }: { patientId: string }) {
  const { upload, progress, loading, error, isCompleted } = useFrappeFileUpload();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    try {
      const result = await upload(file, {
        doctype: "Patient",
        docname: patientId,
        fieldname: "image",
        is_private: 0,
      });
      console.log("File uploaded:", result.file_url);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? `Uploading ${progress}%` : "Upload"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {isCompleted && <p>Upload complete!</p>}
    </div>
  );
}
```

## Real-time Updates

### useFrappeEventListener

Listen to custom Socket.IO events:

```typescript
import { useFrappeEventListener } from "frappe-react-sdk";
import { useCallback } from "react";

function NotificationListener() {
  const handleNotification = useCallback((data: any) => {
    console.log("Received notification:", data);
    // Show toast, update UI, etc.
  }, []);

  useFrappeEventListener("new_notification", handleNotification);

  return <div>Listening for notifications...</div>;
}
```

### useFrappeDocumentEventListener

Listen to document-specific events (updates, viewers):

```typescript
import { useFrappeDocumentEventListener } from "frappe-react-sdk";
import { useCallback } from "react";

function PatientMonitor({ patientId }: { patientId: string }) {
  const handleUpdate = useCallback((eventData) => {
    console.log("Patient updated:", eventData);
    // Refresh data, show notification, etc.
  }, []);

  const { viewers, emitDocOpen, emitDocClose } = useFrappeDocumentEventListener(
    "Patient",
    patientId,
    handleUpdate,
    true // emit open/close events automatically
  );

  return (
    <div>
      <p>Currently viewing: {viewers.join(", ")}</p>
    </div>
  );
}
```

### useFrappeDocTypeEventListener

Listen to all changes for a DocType:

```typescript
import { useFrappeDocTypeEventListener } from "frappe-react-sdk";
import { useCallback } from "react";

function PatientListMonitor() {
  const handleListUpdate = useCallback((eventData) => {
    console.log("Patient list updated:", eventData);
    // Refresh list, show notification
  }, []);

  useFrappeDocTypeEventListener("Patient", handleListUpdate);

  return <div>Monitoring all patient changes...</div>;
}
```

### useSearch

Search documents with debouncing:

```typescript
import { useSearch } from "frappe-react-sdk";
import { useState } from "react";

function PatientSearch() {
  const [searchText, setSearchText] = useState("");
  const { data: results, isLoading } = useSearch(
    "Patient",
    searchText,
    undefined, // filters (optional)
    20,       // limit
    250       // debounce ms
  );

  return (
    <div>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search patients..."
      />
      {isLoading && <p>Searching...</p>}
      <ul>
        {results?.message?.map((result) => (
          <li key={result.value}>
            {result.label} - {result.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

### 1. Component Separation for Authentication

Always wrap components using Frappe hooks in an authentication guard:

```typescript
function MyProtectedContent() {
  // Use Frappe hooks here
  const { data } = useFrappeGetDocList("Patient", {...});
  return <div>{/* content */}</div>;
}

export default function MyPage() {
  const { isAuthenticated, isLoading } = useFrappeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <MyProtectedContent />;
}
```

### 2. Type Safety

Always define TypeScript interfaces for your documents:

```typescript
interface Patient {
  name: string;
  patient_name: string;
  first_name: string;
  email?: string;
  mobile?: string;
  status?: string;
}

const { data } = useFrappeGetDoc<Patient>("Patient", id);
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
const { data, error, isLoading, mutate } = useFrappeGetDocList("Patient", {...});

if (error) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={() => mutate()}>Retry</button>
    </div>
  );
}
```

### 4. Optimistic Updates

Use `mutate` for optimistic UI updates:

```typescript
const { data, mutate } = useFrappeGetDoc("Patient", id);
const { updateDoc } = useFrappeUpdateDoc();

const handleUpdate = async (updates) => {
  // Optimistic update
  mutate({ ...data, ...updates }, false);

  try {
    await updateDoc("Patient", id, updates);
    mutate(); // Revalidate
  } catch (err) {
    mutate(); // Revert on error
  }
};
```

### 5. Conditional Fetching

Use `null` to prevent unnecessary API calls:

```typescript
const shouldFetch = isAuthenticated && !isLoading;

const { data } = useFrappeGetDocList(
  "Patient",
  shouldFetch ? { fields: ["name"], limit: 10 } : null
);
```

## Complete Examples

### Example 1: Simple List with Pagination

```typescript
"use client";

import { useState } from "react";
import { useFrappeGetDocList, useFrappeGetDocCount } from "frappe-react-sdk";

interface Item {
  name: string;
  item_name: string;
  item_group: string;
}

export default function ItemList() {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: items, isLoading, error } = useFrappeGetDocList<Item>(
    "Item",
    {
      fields: ["name", "item_name", "item_group"],
      limit_start: page * pageSize,
      limit: pageSize,
      orderBy: { field: "creation", order: "desc" },
    }
  );

  const { data: totalCount } = useFrappeGetDocCount("Item");
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Items</h1>
      <ul>
        {items?.map((item) => (
          <li key={item.name}>
            {item.item_name} ({item.item_group})
          </li>
        ))}
      </ul>
      <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
        Previous
      </button>
      <span>Page {page + 1} of {totalPages}</span>
      <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
        Next
      </button>
    </div>
  );
}
```

### Example 2: CRUD Operations

```typescript
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  useFrappeGetDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
} from "frappe-react-sdk";

interface Item {
  name: string;
  item_name: string;
  description?: string;
  standard_rate?: number;
}

export default function ItemDetail() {
  const params = useParams();
  const itemId = params.id as string;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Item>>({});

  const { data: item, mutate } = useFrappeGetDoc<Item>("Item", itemId);
  const { updateDoc, loading: updating } = useFrappeUpdateDoc<Item>();
  const { deleteDoc, loading: deleting } = useFrappeDeleteDoc();

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name,
        description: item.description,
        standard_rate: item.standard_rate,
      });
    }
  }, [item]);

  const handleSave = async () => {
    await updateDoc("Item", itemId, formData);
    mutate();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Delete this item?")) {
      await deleteDoc("Item", itemId);
      // Navigate away
    }
  };

  if (!item) return <div>Loading...</div>;

  return (
    <div>
      <h1>{item.item_name}</h1>
      {isEditing ? (
        <>
          <input
            value={formData.item_name || ""}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
          />
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="number"
            value={formData.standard_rate || 0}
            onChange={(e) => setFormData({ ...formData, standard_rate: parseFloat(e.target.value) })}
          />
          <button onClick={handleSave} disabled={updating}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </>
      ) : (
        <>
          <p>{item.description}</p>
          <p>Rate: {item.standard_rate}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button onClick={handleDelete} disabled={deleting}>Delete</button>
        </>
      )}
    </div>
  );
}
```

### Example 3: Real-time Dashboard

```typescript
"use client";

import { useFrappeGetDocList, useFrappeDocTypeEventListener } from "frappe-react-sdk";
import { useCallback } from "react";

export default function OrderDashboard() {
  const { data: orders, mutate } = useFrappeGetDocList(
    "Sales Order",
    {
      fields: ["name", "customer", "grand_total", "status"],
      filters: [["docstatus", "=", 1]],
      limit: 10,
      orderBy: { field: "creation", order: "desc" },
    }
  );

  // Auto-refresh when any order changes
  const handleOrderUpdate = useCallback(() => {
    mutate();
  }, [mutate]);

  useFrappeDocTypeEventListener("Sales Order", handleOrderUpdate);

  return (
    <div>
      <h1>Recent Orders (Real-time)</h1>
      <ul>
        {orders?.map((order) => (
          <li key={order.name}>
            {order.customer} - ${order.grand_total} ({order.status})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Resources

- [frappe-react-sdk GitHub](https://github.com/The-Commit-Company/frappe-react-sdk)
- [frappe-react-sdk npm](https://www.npmjs.com/package/frappe-react-sdk)
- [Frappe Framework API](https://docs.frappe.io/framework/user/en/api)
- [SWR Documentation](https://swr.vercel.app/)
