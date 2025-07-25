import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "./NotificationPanel"; // <-- Impor komponen baru

function Auth() {
  const {
    isAuthenticated,
    login,
    logout,
    principal,
    notifications,
    unreadCount,
    markNotificationsAsRead,
  } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 p-4 bg-white rounded-lg shadow-md flex justify-between items-center">
      <div>
        <p className="font-bold text-gray-800">
          Sistem Jurnal Terdesentralisasi
        </p>
        {isAuthenticated && (
          <p className="text-xs text-gray-600 font-mono mt-1">
            Logged in as: {principal?.toText()}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>
            {showNotifications && (
              <NotificationPanel
                notifications={notifications}
                markNotificationsAsRead={markNotificationsAsRead}
              />
            )}
          </div>
        )}

        {isAuthenticated ? (
          <button
            onClick={logout}
            className="bg-red-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={login}
            className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}
export default Auth;
