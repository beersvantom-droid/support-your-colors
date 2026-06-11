"use client";

import { useEffect, useRef, useState } from "react";
import { X, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  user_flag?: string;
  created_at: string;
}

interface Toast {
  id: string;
  username: string;
  message: string;
  flag?: string;
  timestamp: number;
}

const POLL_INTERVAL = 3000; // Poll every 3 seconds
const TOAST_DURATION = 5000; // Show toast for 5 seconds
const MAX_TOASTS = 3; // Show max 3 toasts at once

export function ChatNotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastMessageIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchLatestMessages = async () => {
      try {
        const response = await fetch("/api/live-chat/messages");
        if (!response.ok) return;

        const data = await response.json();
        const messages: ChatMessage[] = data.messages || [];

        if (messages.length === 0) return;

        // Get the latest message
        const latestMessage = messages[messages.length - 1];

        // Only show toast if this is a new message
        if (lastMessageIdRef.current && lastMessageIdRef.current !== latestMessage.id) {
          const newToast: Toast = {
            id: latestMessage.id,
            username: latestMessage.username,
            message: latestMessage.message,
            flag: latestMessage.user_flag,
            timestamp: Date.now(),
          };

          setToasts((prev) => {
            const updated = [newToast, ...prev];
            // Keep only max toasts
            return updated.slice(0, MAX_TOASTS);
          });

          // Auto-remove toast after duration
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== latestMessage.id));
          }, TOAST_DURATION);
        }

        // Update last message ID
        lastMessageIdRef.current = latestMessage.id;
      } catch (err) {
        console.debug("Failed to fetch chat messages:", err);
      }
    };

    // Start polling immediately
    fetchLatestMessages();

    // Set up interval
    pollingIntervalRef.current = setInterval(fetchLatestMessages, POLL_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-20 right-4 z-50 space-y-2 max-w-xs pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden animate-slide-up pointer-events-auto hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer"
            onClick={() => removeToast(toast.id)}
            style={{
              animation: "slideUp 0.3s ease-out",
            }}
          >
            <div className="p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {toast.flag && <span className="text-lg">{toast.flag}</span>}
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {toast.username}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {toast.message}
                  </p>
                </div>
                <div className="flex-shrink-0 text-blue-500 pt-0.5">
                  <MessageCircle size={16} />
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              className="h-0.5 bg-blue-500 origin-left"
              style={{
                animation: `shrink ${TOAST_DURATION}ms linear forwards`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </>
  );
}
