import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "../../../declarations/jurnal-web-backend";

// 1. Buat Context
export const AuthContext = createContext();

// 2. Buat Provider (komponen yang akan "membungkus" aplikasi kita)
export const AuthProvider = ({ children }) => {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [actor, setActor] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    AuthClient.create({
      idleOptions: { idleTimeout: 1000 * 60 * 30 }, // 30 menit
    }).then(async (client) => {
      setAuthClient(client);
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        const identity = client.getIdentity();
        updateAuth(true, identity);
      }
    });
  }, []);

  const login = () => {
    authClient?.login({
      identityProvider:
        process.env.DFX_NETWORK === "local"
          ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
          : "https://identity.ic0.app",
      onSuccess: () => {
        const id = authClient.getIdentity();
        updateAuth(true, id, authClient);
      },
    });
  };

  const logout = async () => {
    await authClient?.logout();
    updateAuth(false, null, authClient);
  };

  const updateAuth = (loggedIn, identity) => {
    setIsAuthenticated(loggedIn);
    const p = identity ? identity.getPrincipal() : null;
    setPrincipal(p);

    const canisterId = process.env.CANISTER_ID_JURNAL_WEB_BACKEND;
    const newActor = createActor(canisterId, {
      agentOptions: { identity },
    });
    setActor(newActor);

    // Jika logout, bersihkan notifikasi
    if (!loggedIn) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async (currentActor) => {
    if (!currentActor) return;
    try {
      // Gunakan fungsi backend yang sudah kita buat
      const notifs = await currentActor.getMyNotificationsAuthenticated();
      setNotifications(notifs);
      // Hitung notifikasi yang belum dibaca
      const unread = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  const markNotificationsAsRead = async (ids) => {
    if (!actor || ids.length === 0) return;
    try {
      await actor.markNotificationsAsRead(ids);
      // Ambil ulang notifikasi untuk update UI
      fetchNotifications(actor);
    } catch (error) {
      console.error("Gagal menandai notifikasi:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && actor) {
      fetchNotifications(actor); // Ambil saat pertama kali login
      const interval = setInterval(() => fetchNotifications(actor), 30000);
      return () => clearInterval(interval); // Bersihkan interval saat logout
    }
  }, [isAuthenticated, actor]);

  const auth = {
    isAuthenticated,
    login,
    logout,
    principal,
    actor,
    notifications,
    unreadCount,
    markNotificationsAsRead,
  };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// 3. Buat Hook kustom untuk memudahkan penggunaan context
export const useAuth = () => useContext(AuthContext);
