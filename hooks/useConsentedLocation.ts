import { useState, useEffect, useRef, useCallback } from "react";
import { GeoCoordinate } from "@/lib/types";

interface UseConsentedLocationOptions {
  linkId: string;
  requiresLocation: boolean;
  onConsentGranted?: (sessionId: string) => void;
}

export function useConsentedLocation({
  linkId,
  requiresLocation,
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

  // Request explicit location consent and register session
  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const coords: GeoCoordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          // Register consented session via API
          const res = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkId }),
          });

          if (!res.ok) {
            throw new Error("Failed to register location session");
          }

          const { session } = await res.json();
          setSessionId(session.id);
          setIsConsented(true);
          setIsLoading(false);

          if (onConsentGranted) {
            onConsentGranted(session.id);
          }

          // Transmit initial position
          await sendLocationUpdate(session.id, coords);

          // Start watching while page is active
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              sendLocationUpdate(session.id, {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            },
            (watchErr) => {
              console.warn("Active location watch error:", watchErr.message);
              setIsLocationActive(false);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
          );
        } catch (apiErr: any) {
          setError(apiErr.message || "Could not register consented session");
          setIsLoading(false);
        }
      },
      (geoError) => {
        setIsLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location permission was denied. Please allow location in browser settings to view this snap.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location signal is unavailable. Please check GPS settings.");
            break;
          case geoError.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [linkId, onConsentGranted, sendLocationUpdate]);

  // Clean up on unmount (AGENTS.md Rule 2)
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
