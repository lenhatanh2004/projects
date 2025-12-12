// DeviceInfoScreen.js (ONE FILE ONLY)
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import * as Device from "expo-device";

// Single-file Device ID logic
function getDeviceId() {
  // Web: localStorage
  if (Platform.OS === "web") {
    let id = localStorage.getItem("webDeviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("webDeviceId", id);
    }
    return id;
  }

  // Mobile (Expo Device)
  return (
    Device.osInternalBuildId ||
    Device.deviceName ||
    Device.modelName ||
    "unknown-device"
  );
}

export default function DeviceInfoScreen() {
  const [deviceId, setDeviceId] = useState("");
  const [info, setInfo] = useState({});

  useEffect(() => {
    setDeviceId(getDeviceId());

    if (Platform.OS !== "web") {
      setInfo({
        brand: Device.brand,
        model: Device.modelName,
        os: Device.osName,
        osVersion: Device.osVersion,
        deviceName: Device.deviceName,
      });
    } else {
      setInfo({
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      });
    }
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Device Information</Text>

      <View style={styles.box}>
        <Text style={styles.label}>Device ID:</Text>
        <Text style={styles.value}>{deviceId}</Text>
      </View>

      <View style={styles.box}>
        {Platform.OS === "web" ? (
          <>
            <Text style={styles.label}>Browser User Agent:</Text>
            <Text style={styles.value}>{info.browser}</Text>

            <Text style={styles.label}>Platform:</Text>
            <Text style={styles.value}>{info.platform}</Text>

            <Text style={styles.label}>Language:</Text>
            <Text style={styles.value}>{info.language}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Brand:</Text>
            <Text style={styles.value}>{info.brand}</Text>

            <Text style={styles.label}>Model:</Text>
            <Text style={styles.value}>{info.model}</Text>

            <Text style={styles.label}>OS:</Text>
            <Text style={styles.value}>{info.os}</Text>

            <Text style={styles.label}>OS Version:</Text>
            <Text style={styles.value}>{info.osVersion}</Text>

            <Text style={styles.label}>Device Name:</Text>
            <Text style={styles.value}>{info.deviceName}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  box: {
    padding: 16,
    backgroundColor: "#f3f3f3",
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#444",
  },
});
