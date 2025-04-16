import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { Link, Stack, useRouter } from "expo-router";
import { useCameraPermissions } from "expo-camera";
import { useState, useEffect } from "react";
import { onSnapshot, collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/src/config/firebaseConfig";

export default function Home() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      setIsPermissionGranted(status === 'granted');
    };

    requestCameraPermission();
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      setIsPermissionGranted(true);
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [permission]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        Alert.alert("No hay conexión con la base de datos");
      }
    }, 30000);

    const unsubscribe = onSnapshot(
      collection(db, "estudiantes"),
      () => {
        setIsConnected(true);
        setIsLoading(false);
        clearTimeout(timeout);
      },
      () => {
        setIsConnected(false);
        setIsLoading(false);
        clearTimeout(timeout);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const usersRef = collection(db, "usuarios");
        const q = query(usersRef, where("correo", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setUserName(userDoc.data().nombre);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString('es-ES', options).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.background} />
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: "Overview", headerShown: false }} />
        <View style={styles.connectionContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFD700" />
          ) : (
            <View style={[styles.light, { backgroundColor: isConnected ? "#4CAF50" : "#F44336" }]} />
          )}
          <Text style={styles.connectionText}>Estado de conexión con el servidor</Text>
          
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </Pressable>
        <Image source={require('@/assets/images/LOGOMANANTIALES.png')} style={styles.logo} />
        <Text style={styles.title}>Escáner de Atrasos            Manantiales del elqui</Text>
        
        {userName ? <Text style={styles.welcomeText}>Bienvenido {userName}</Text> : null}
        <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
        <Text style={styles.clock}>{currentTime.toLocaleTimeString()}</Text>

        <View style={styles.scanButtonContainer}>
          <Link href="/scanner" asChild>
            <Pressable
              disabled={!isPermissionGranted}
              aria-disabled={!isPermissionGranted}
              style={[styles.scanButton, !isPermissionGranted && styles.disabledButton]}
              onPress={() => {
                if (!isPermissionGranted) {
                  requestPermission();
                }
              }}
            >
              <Text style={styles.scanButtonText}>ESCANEAR CÓDIGO QR</Text>
            </Pressable>
          </Link>

          
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#8B0000",
  },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 80,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  welcomeText: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  dateText: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  clock: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
  },
  connectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  light: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
  },
  connectionText: {
    color: "#FFD700",
    fontSize: 18,
  },
  scanButtonContainer: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#FFD700', // Esto creará el efecto de borde
  },
  scanButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#FFD700",
    backgroundColor: "#8B0000",
    // Para Android:
    elevation: 5,
    // Para iOS:
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    // Efecto adicional para hacer el borde más visible:
    position: 'relative',
    overflow: 'hidden',
  },
  scanButtonText: {
    color: "#B22222",
    fontSize: 22,
    textAlign: "center",
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.3)",  // Sombra de texto para mejor legibilidad
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabledButton: {
    borderColor: "gray",
    opacity: 0.5,
  },
  logoutButton: {
    backgroundColor: "#B22222",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  logoutText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
});