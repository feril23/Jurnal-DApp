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

  useEffect(() => {
    AuthClient.create({
      idleOptions: { idleTimeout: 1000 * 60 * 30 }, // 30 menit
    }).then(async (client) => {
      setAuthClient(client);
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        const id = client.getIdentity();
        updateAuth(true, id, client);
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

  const updateAuth = (loggedIn, id, client) => {
    setIsAuthenticated(loggedIn);
    setIdentity(id);
    const p = id ? id.getPrincipal() : null;
    setPrincipal(p);

    // Membuat actor baru yang terotentikasi sesuai dokumentasi
    const canisterId = process.env.CANISTER_ID_JURNAL_WEB_BACKEND;
    const newActor = createActor(canisterId, {
      agentOptions: { identity: id },
    });
    setActor(newActor);
  };

  const auth = { isAuthenticated, login, logout, principal, actor };

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

// 3. Buat Hook kustom untuk memudahkan penggunaan context
export const useAuth = () => useContext(AuthContext);
