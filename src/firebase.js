import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration using project data provided
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API key
  authDomain: "opproj2.firebaseapp.com",
  projectId: "opproj2",
  storageBucket: "opproj2.appspot.com",
  messagingSenderId: "950339025419",
  appId: "YOUR_APP_ID", // Replace with your actual App ID
  measurementId: "YOUR_MEASUREMENT_ID" // Replace if you have it
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
