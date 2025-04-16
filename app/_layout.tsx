import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { auth } from "@/src/config/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Layout() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth/login"); // 🔹 Redirige al login si no hay sesión
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
