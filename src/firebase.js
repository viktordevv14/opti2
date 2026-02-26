import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration using project data provided
const firebaseConfig = {
  apiKey: "AIzaSyCykRjr10Le1j5JXv7q1eH_K6URoI8JU3Y",
  authDomain: "opproj2.firebaseapp.com",
  projectId: "opproj2",
  storageBucket: "opproj2.appspot.com",
  messagingSenderId: "950339025419",
  appId: "1:950339025419:web:6710e88d0c17551532250e",
  measurementId: "YOUR_MEASUREMENT_ID" // Replace if you have it
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
