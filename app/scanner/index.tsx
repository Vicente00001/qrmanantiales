import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import {
  AppState,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  Pressable,
  Alert,
  View,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { db, auth } from "@/src/config/firebaseConfig";
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Overlay from "./Overlay";

// Obtener dimensiones de la pantalla
const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const router = useRouter();
  const qrLock = useRef(false);
  const [cameraType, setCameraType] = useState<"front" | "back">("back");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const formatRut = (rut: string): string => {
    if (rut.length < 2) return rut;
    return `${rut.slice(0, -1)}-${rut.slice(-1)}`;
  };

  const registerAttendance = async (rut: string) => {
    if (!currentUser) {
      setErrorMessage("Debes iniciar sesión para registrar atrasos");
      return;
    }

    setIsLoading(true);
    const formattedRut = formatRut(rut);
    console.log("Buscando estudiante con RUT:", formattedRut);

    try {
      const studentRef = doc(db, "estudiantes", formattedRut);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        setErrorMessage("Estudiante no encontrado, vuelva al menú y escanee nuevamente");
        console.error("Estudiante no encontrado en Firebase");
        setIsLoading(false);
        return;
      }

      const studentData = studentSnap.data();
      console.log("Estudiante encontrado:", studentData.nombre);

      // 🔹 Verificar si ya existe una asistencia para el mismo día
      const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
      const asistenciasRef = collection(db, "asistencias");
      const q = query(asistenciasRef, where("estudiante_id", "==", formattedRut), where("fecha", "==", today));
      const existingRecords = await getDocs(q);

      if (existingRecords.size >= 2) {
        Alert.alert(
          "Límite de Atrasos",
          `El estudiante ${studentData.nombre} ya ha alcanzado el límite de 2 atrasos hoy.`,
          [{ text: "OK", onPress: () => qrLock.current = false }]
        );
        setIsLoading(false);
        return;
      }

      // 🔹 Verificar el horario del atraso
      const now = new Date();
      const currentHour = now.getHours();

      if (currentHour >= 20 || currentHour < 7) {
        Alert.alert(
          "Atraso Inválido",
          "Atraso inválido por estar fuera del horario escolar (20:00 - 07:00).",
          [{ text: "OK", onPress: () => qrLock.current = false }]
        );
        setIsLoading(false);
        return;
      }

      // 🔹 Registrar asistencia en Firebase
      await addDoc(asistenciasRef, {
        estudiante_id: formattedRut,
        fecha: today,
        estado: "Atrasado",
        hora: new Date().toLocaleTimeString(),
        inspector_id: currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setLastScanned(studentData.nombre);
      console.log("Asistencia registrada para:", studentData.nombre);

      // 🔹 Mostrar mensaje de confirmación
      Alert.alert(
        "Atraso Registrado",
        `El estudiante ${studentData.nombre} (RUT: ${formattedRut}) se ha marcado como atrasado el día ${today} a las ${new Date().toLocaleTimeString()}.`,
        [{ text: "OK", onPress: () => { qrLock.current = false; setIsLoading(false); } }]
      );

    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      setErrorMessage("Error al registrar asistencia");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen options={{ title: "Scanner", headerShown: false }} />
      <StatusBar hidden />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={cameraType}
        onBarcodeScanned={({ data }) => {
          if (data && !qrLock.current && !isLoading) {
            qrLock.current = true;
            setErrorMessage(null);
            registerAttendance(data.trim());
          }
        }}
      />
      
      {/* Overlay que cubre toda la pantalla */}
      <View style={styles.fullScreenOverlay}>
        <Overlay />
      </View>

      {/* 🔹 Mostrar "Último Escaneo" centrado sobre los botones */}
      <View style={styles.infoContainer}>
        {lastScanned && (
          <Text style={styles.scannedText}>Último escaneo: {lastScanned}</Text>
        )}
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      </View>

      {/* 🔹 Botones centrados en la parte inferior (ahora más arriba) */}
      <View style={styles.buttonContainer}>
        <Pressable 
          onPress={() => setCameraType(cameraType === "back" ? "front" : "back")} 
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>Cambiar Cámara</Text>
        </Pressable>

        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={styles.backText}>Volver al Menú</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  infoContainer: {
    position: "absolute",
    bottom: height * 0.22, // Ajustado para estar más arriba
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: height * 0.015,
    borderRadius: 10,
    maxWidth: width * 0.9,
    zIndex: 2,
  },
  scannedText: { 
    color: "white", 
    fontSize: height * 0.022,
    textAlign: "center",
    maxWidth: width * 0.8,
  },
  errorText: { 
    color: "red", 
    fontSize: height * 0.022,
    textAlign: "center",
    maxWidth: width * 0.8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: height * 0.08, // Ajustado para estar más arriba (antes era 0.03)
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    paddingHorizontal: width * 0.05,
    zIndex: 2,
  },
  switchButton: {
    backgroundColor: "#0E7AFE",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: 8,
    minWidth: width * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: "red",
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: 8,
    minWidth: width * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchText: { 
    color: "white", 
    fontSize: height * 0.02,
    fontWeight: "bold",
    textAlign: 'center',
  },
  backText: { 
    color: "white", 
    fontSize: height * 0.02,
    fontWeight: "bold",
    textAlign: 'center',
  },
});