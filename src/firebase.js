// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";  // Add authentication import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzgxWhmeMqfJgJxTWS0tDkfc3p7NqkkgQ",
  authDomain: "multilinkcloud-eba73.firebaseapp.com",
  projectId: "multilinkcloud-eba73",
  storageBucket: "multilinkcloud-eba73.firebasestorage.app",
  messagingSenderId: "69831308507",
  appId: "1:69831308507:web:41a351d783a4c2af1ec8fe",
  measurementId: "G-VEL8SQZHLN"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);  // Initialize Authentication

// Export the services you want to use
export { db, auth };  // Add auth to exports

// Optional: Export the app for advanced use cases
export default app;