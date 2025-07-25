import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, NavLink } from "react-router-dom"; // Gunakan NavLink untuk styling link aktif
import NotificationPanel from "./NotificationPanel";

function Header() {
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
  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-indigo-600 font-bold"
      : "text-gray-600 font-medium hover:text-indigo-600";

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          Jurnal<span className="text-indigo-600">Chain</span>
        </Link>
        <div className="hidden md:flex items-center space-x-8">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/published" className={navLinkClass}>
            Published
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              Dashboard
            </NavLink>
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
              className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={login}
              className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition"
            >
              Login
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
export default Header;
