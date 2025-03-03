import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAr_3YshyWeK9T1KFtyasX-LeKkfE_Ftak",
  authDomain: "qr-manantiales.firebaseapp.com",
  projectId: "qr-manantiales",
  storageBucket: "qr-manantiales.appspot.com",
  messagingSenderId: "1038679495600",
  appId: "1:1038679495600:web:7d9a253157a011b1c8fc75"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Exporta correctamente los módulos
export { app, auth, db };
