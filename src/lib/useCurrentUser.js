import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isFSE = user?.role === "fse" || (!user?.role && !isAdmin && !isManager);
  const canEdit = isAdmin;

  return { user, loading, isAdmin, isManager, isFSE, canEdit };
}