import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// We need these two imports for our login and database!
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEM-GV3G3coAgVqAzN_kHCfzItyPEyq9o",
  authDomain: "evolife-63c05.firebaseapp.com",
  projectId: "evolife-63c05",
  storageBucket: "evolife-63c05.firebasestorage.app",
  messagingSenderId: "329170316183",
  appId: "1:329170316183:web:1c3c50c36d92ab4f3e32d2",
  measurementId: "G-6VW3XQKM80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporting these fixes the unused variable error AND lets us use them in AuthScreen
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);