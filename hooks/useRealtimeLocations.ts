"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface LiveLocationItem {
  sessionId: string;
  linkTitle: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: string;
  status: string;
}

export function useRealtimeLocations() {
  const [locations, setLocations] = useState<LiveLocationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEventTime, setLastEventTime] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/live-locations");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error("Failed to load live locations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-location-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "location_updates",
        },
        (payload) => {
          const update = payload.new as {
            session_id: string;
            latitude: number;
            longitude: number;
            accuracy: number | null;
            created_at: string;
          };

          setLastEventTime(update.created_at);

          setLocations((prev) => {
            const index = prev.findIndex((loc) => loc.sessionId === update.session_id);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                latitude: update.latitude,
                longitude: update.longitude,
                accuracy: update.accuracy,
                updatedAt: update.created_at,
              };
              return updated;
            } else {
              // Refresh full list to get link title if new session
              fetchLocations();
              return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLocations]);

  return { locations, isLoading, lastEventTime, refetch: fetchLocations };
}
