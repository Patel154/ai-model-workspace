"use client";

import { useCallback, useEffect, useState } from "react";
import { NormalizedModel } from "@/lib/types";

interface ModelsState {
  models: NormalizedModel[];
  loading: boolean;
  error: string | null;
  status: "idle" | "connected" | "error";
  refetch: () => void;
}

export function useModels(): ModelsState {
  const [models, setModels] = useState<NormalizedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "connected" | "error">("idle");

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || "Failed to load models.");
        setStatus("error");
        setModels([]);
        return;
      }
      setModels(data.models || []);
      setStatus("connected");
    } catch {
      setError("Couldn't reach the dashboard backend.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, status, refetch: fetchModels };
}
