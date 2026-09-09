"use client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

/**
 * Performs use auth operation.
 * @returns {{ token: string; loading: boolean; }} Description of return value
 */
export function useAuth() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored) navigate("/signin");
    else {
      setToken(stored);
      setLoading(false);
    }
  }, [navigate]);

  return { token, loading };
}
