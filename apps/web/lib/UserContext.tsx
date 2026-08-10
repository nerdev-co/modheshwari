"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import apiFetch from "../lib/api";
import { API_BASE } from "../lib/config";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: boolean;
  profile?: {
    phone?: string;
    address?: string;
    profession?: string;
    gotra?: string;
    location?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalNotes?: string;
    locationLat?: number;
    locationLng?: number;
  } | null;
  families?: {
    id: string;
    familyId: string;
    role: string;
    joinedAt: string;
    family: { id: string; name: string; uniqueId: string };
  }[];
}

interface UserContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => void;
  logout: () => void;
  updateProfile: (patch: Partial<User["profile"]>) => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: () => {},
  logout: () => {},
  updateProfile: () => {},
});

/**
 * Performs  user provider operation.
 * @param {{ children: React.ReactNode; }} { children } - Description of { children }
 * @returns {React.JSX.Element} Description of return value
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchUser = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        return;
      }

      const result = await apiFetch(`${API_BASE}/me`, { throwOnError: false });
      if (result?.ok === false) {
        localStorage.removeItem("token");
        setUser(null);
        return;
      }
      const u = result?.data?.data ?? result?.data ?? result;
      if (u && mountedRef.current) setUser(u as User);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
    window.dispatchEvent(new Event("authChanged"));
  }, []);

  const updateProfile = useCallback((patch: Partial<User["profile"]>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        profile: { ...(prev.profile ?? {}), ...patch },
      };
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchUser(true);

    const handler = () => setTimeout(() => fetchUser(false), 10);
    window.addEventListener("storage", handler);
    window.addEventListener("authChanged", handler as EventListener);
    return () => {
      mountedRef.current = false;
      window.removeEventListener("storage", handler);
      window.removeEventListener("authChanged", handler as EventListener);
    };
  }, [fetchUser]);

  const refresh = useCallback(() => fetchUser(true), [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refresh, logout, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Performs use user operation.
 * @returns {UserContextValue} Description of return value
 */
export function useUser() {
  return useContext(UserContext);
}
