"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFrappeAuth } from "@/contexts/FrappeAuthContext";
import { useFrappeEventListener, useFrappePostCall, useFrappeGetCall } from "frappe-react-sdk";
import { useFrappeContext } from "@/contexts/FrappeAuthContext";

interface NotificationEvent {
  id: string;
  message: string;
  type: string;
  timestamp: Date;
  eventName: string;
  data: any;
}

function RealtimeTestContent() {
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [socketStatus, setSocketStatus] = useState<string>("unknown");
  const [socketInfo, setSocketInfo] = useState<any>({});
  const frappeContext = useFrappeContext();
  const { call: sendNotification, loading, error} = useFrappePostCall("frappe.client.set_value");

  // Debug Socket.IO connection
  useEffect(() => {
    if (frappeContext?.socket) {
      const socket = frappeContext.socket;
      console.log("[Socket.IO Debug] Socket object:", socket);
      console.log("[Socket.IO Debug] Connected:", socket.connected);
      console.log("[Socket.IO Debug] Namespace:", socket.nsp);
      console.log("[Socket.IO Debug] IO options:", socket.io?.opts);

      setSocketInfo({
        connected: socket.connected,
        id: socket.id,
        namespace: socket.nsp,
        url: socket.io?.uri,
      });

      socket.on("connect", () => {
        console.log("[Socket.IO] Connected!");
        setSocketStatus("connected");
        setSocketInfo((prev: any) => ({ ...prev, connected: true, id: socket.id }));
      });

      socket.on("disconnect", () => {
        console.log("[Socket.IO] Disconnected!");
        setSocketStatus("disconnected");
        setSocketInfo((prev: any) => ({ ...prev, connected: false }));
      });

      socket.on("connect_error", (error: any) => {
        console.error("[Socket.IO] Connection error:", error);
        setSocketStatus(`error: ${error.message}`);
      });

      // Listen for ANY event for debugging
      socket.onAny((eventName: string, ...args: any[]) => {
        console.log(`[Socket.IO] Event "${eventName}":`, args);
      });

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.offAny();
      };
    } else {
      console.warn("[Socket.IO Debug] No socket found in Frappe context");
      setSocketStatus("No socket");
    }
  }, [frappeContext]);

  // Listen for various events - mimicking Raven's approach
  const handleCustomNotification = useCallback((data: any) => {
    console.log("[custom_notification]", data);
    addEvent("custom_notification", data);
  }, []);

  const handleMessageCreated = useCallback((data: any) => {
    console.log("[message_created]", data);
    addEvent("message_created", data);
  }, []);

  const handleDocUpdate = useCallback((data: any) => {
    console.log("[doc_update]", data);
    addEvent("doc_update", data);
  }, []);

  const handleNotification = useCallback((data: any) => {
    console.log("[notification]", data);
    addEvent("notification", data);
  }, []);

  // Register all event listeners
  useFrappeEventListener("custom_notification", handleCustomNotification);
  useFrappeEventListener("message_created", handleMessageCreated);
  useFrappeEventListener("doc_update", handleDocUpdate);
  useFrappeEventListener("notification", handleNotification);

  const addEvent = (eventName: string, data: any) => {
    const event: NotificationEvent = {
      id: `${Date.now()}-${Math.random()}`,
      message: data.message || JSON.stringify(data),
      type: data.type || "info",
      timestamp: new Date(),
      eventName,
      data,
    };
    setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const sendTestNotification = async () => {
    if (!testMessage) return;

    // This won't actually work because we need a backend API
    // But it shows the pattern
    console.log("Would send:", testMessage);
    alert("To send notifications, use Frappe Console:\n\nfrappe.publish_realtime(\n    event='custom_notification',\n    message={'message': '" + testMessage + "', 'type': 'success'},\n    room='website'\n)");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Real-time Events Test (Raven-style)</h1>
          <p className="text-gray-600">
            This page listens for real-time events using the same approach as Raven app
          </p>
        </div>

        {/* Socket.IO Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Socket.IO Status</h2>
          <div className="space-y-2">
            <p>Status: <span className={`font-bold ${socketStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>{socketStatus}</span></p>
            <p>Socket ID: <code className="bg-gray-100 px-2 py-1 rounded">{socketInfo.id || 'N/A'}</code></p>
            <p>Namespace: <code className="bg-gray-100 px-2 py-1 rounded">{socketInfo.namespace || 'N/A'}</code></p>
            <p>URL: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{socketInfo.url || 'N/A'}</code></p>
          </div>
        </div>

        {/* Test Notification Sender */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Send Test Notification</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={sendTestNotification}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Send
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Note: Sending from UI requires backend API. Use Frappe Console for testing.
          </p>
        </div>

        {/* Python Examples */}
        <div className="bg-gray-900 text-gray-100 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Python Examples (Frappe Console)</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">1. Broadcast to all (website room):</p>
              <pre className="text-xs bg-gray-800 p-3 rounded overflow-x-auto">
{`import frappe
frappe.publish_realtime(
    event='custom_notification',
    message={'message': 'Hello everyone!', 'type': 'success'},
    room='website'
)`}
              </pre>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">2. Send to specific user:</p>
              <pre className="text-xs bg-gray-800 p-3 rounded overflow-x-auto">
{`import frappe
frappe.publish_realtime(
    event='custom_notification',
    message={'message': 'Hi Administrator!', 'type': 'info'},
    user='Administrator'
)`}
              </pre>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">3. Message created event (Raven-style):</p>
              <pre className="text-xs bg-gray-800 p-3 rounded overflow-x-auto">
{`import frappe
frappe.publish_realtime(
    event='message_created',
    message={
        'channel_id': 'test-channel',
        'message': 'New message text',
        'sender': frappe.session.user
    },
    room='website'
)`}
              </pre>
            </div>
          </div>
        </div>

        {/* Events Display */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Received Events ({events.length})
            </h2>
            <button
              onClick={clearEvents}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Clear
            </button>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-gray-500">No events received yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Run the Python examples above in Frappe Console
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {event.eventName}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {event.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{event.message}</p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      View raw data
                    </summary>
                    <pre className="mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RealtimeTestPage() {
  const { isAuthenticated, isLoading } = useFrappeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <RealtimeTestContent />;
}
