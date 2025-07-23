// File: src/components/Auth.jsx
import React from "react";
import { useAuth } from "../context/AuthContext"; // <-- Gunakan hook kita

function Auth() {
  const { isAuthenticated, login, logout, principal } = useAuth();

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
      <div>
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
