import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-jN1-2X43NAHhVeqdV7q982auQJa3AYI",
  authDomain: "brandproof.firebaseapp.com",
  projectId: "brandproof",
  storageBucket: "brandproof.firebasestorage.app",
  messagingSenderId: "993361203267",
  appId: "1:993361203267:web:c549456a6c3417b83fc4f6",
  measurementId: "G-CP1XP99BSE",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);