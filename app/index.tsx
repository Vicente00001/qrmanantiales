import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { Link, Stack } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";

export default function Home() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (permission?.granted) {
      setIsPermissionGranted(true);
    }

    // Actualizar la hora cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [permission]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Overview", headerShown: false }} />
      <Text style={styles.title}>QR Code Scanner</Text>

      {/* Mostrar la hora en tiempo real */}
      <Text style={styles.clock}>{currentTime.toLocaleTimeString()}</Text>

      <View style={{ gap: 20 }}>
        {/* Botón para solicitar permisos */}
        <Pressable onPress={requestPermission} style={styles.buttonContainer}>
          <Text style={styles.buttonStyle}>Request Permissions</Text>
        </Pressable>

        {/* Botón para escanear QR */}
        <Link href="/scanner" asChild>
          <Pressable
            disabled={!isPermissionGranted}
            aria-disabled={!isPermissionGranted}
            style={[
              styles.buttonContainer,
              !isPermissionGranted && styles.disabledButton,
            ]}
          >
            <Text style={styles.buttonStyle}>Scan Code</Text>
          </Pressable>
        </Link>

        {/* Botón de cerrar sesión */}
        <Pressable style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "black",
    justifyContent: "space-around",
    paddingVertical: 80,
  },
  title: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
  },
  clock: {
    color: "#0E7AFE",
    fontSize: 30,
    fontWeight: "bold",
  },
  buttonContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#0E7AFE",
  },
  buttonStyle: {
    color: "#0E7AFE",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  disabledButton: {
    borderColor: "gray",
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
});
