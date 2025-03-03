import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import {
  AppState,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { db } from "@/src/config/firebaseConfig"; // Importamos Firestore
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Para guardar en la BD
import Overlay from "./Overlay";

export default function ScannerScreen() {
  const router = useRouter();
  const qrLock = useRef(false);
  const [cameraType, setCameraType] = useState<"front" | "back">("back");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current?.match(/inactive|background/) && nextAppState === "active") {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Función para guardar en Firebase
  const saveScanToFirebase = async (data: string) => {
    try {
      await addDoc(collection(db, "scans"), {
        qrData: data,
        timestamp: serverTimestamp(),
      });
      console.log("Escaneo guardado en Firebase:", data);
    } catch (error) {
      console.error("Error al guardar en Firestore:", error);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Solicitando permisos...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>No tienes permisos para usar la cámara</Text>
        <Text style={styles.permissionButton} onPress={requestPermission}>
          Conceder permisos
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen options={{ title: "Scanner", headerShown: false }} />
      <StatusBar hidden />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraType}
        onBarcodeScanned={({ data }) => {
          if (data && !qrLock.current) {
            qrLock.current = true;
            setLastScanned(data);
            saveScanToFirebase(data);
            setTimeout(() => {
              qrLock.current = false;
            }, 1000);
          }
        }}
      />
      <Overlay />

      {lastScanned && (
        <Text style={styles.scannedText}>Último escaneo: {lastScanned}</Text>
      )}

      <Pressable onPress={() => setCameraType(cameraType === "back" ? "front" : "back")} style={styles.switchButton}>
        <Text style={styles.switchText}>Cambiar Cámara</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>Volver al Menú</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  permissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  permissionButton: {
    color: "#0E7AFE",
    fontSize: 18,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  scannedText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  switchButton: {
    position: "absolute",
    bottom: 80,
    backgroundColor: "#0E7AFE",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  switchText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "red",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
