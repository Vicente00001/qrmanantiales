import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Image } from "react-native";
import { auth } from "@/src/config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmail = async () => {
      const savedEmail = await AsyncStorage.getItem("lastEmail");
      if (savedEmail) {
        setEmail(savedEmail);
      }
    };
    loadEmail();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem("lastEmail", email);
      router.replace("/");
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/LOGOMANANTIALES.png")} style={styles.logo} />
      <Text style={styles.appTitle}>Escáner de Atrasos{"\n"}Manantiales del Elqui</Text>
      <Text style={styles.title}>Iniciar sesión</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="gray"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#8B0000",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appTitle: {
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  input: {
    width: "80%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFD700",
    color: "white",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#FFD700",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
