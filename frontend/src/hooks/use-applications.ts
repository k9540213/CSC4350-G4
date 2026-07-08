import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { Application } from "@/lib/mock-data";

export function useApplications(filters?: { search?: string; stage?: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.applications.list(filters);
      setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.stage]);

  useEffect(() => { load(); }, [load]);

  return { applications, loading, error, refetch: load };
}