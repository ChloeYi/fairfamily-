import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWXL-0Lei9ZPb_9tDtgGiNWyA8bZ_amas",
  authDomain: "fairfamily-36d9b.firebaseapp.com",
  projectId: "fairfamily-36d9b",
  storageBucket: "fairfamily-36d9b.firebasestorage.app",
  messagingSenderId: "676830347063",
  appId: "1:676830347063:web:4e64c0bc272cf8e7aaa4b2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
