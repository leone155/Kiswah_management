// Import Firebase modules
import { initializeApp } from "firebase/app";
import {  getFirestore, } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyA-FIUtx7Y5VnP4fiJoWGaQnvovpchRS0",
  authDomain: "regain-ce813.firebaseapp.com",
  projectId: "regain-ce813",
  storageBucket: "regain-ce813.appspot.com",
  messagingSenderId: "768359062552",
  appId: "1:768359062552:web:e2476648474eccbd1a376d",
  measurementId: "G-3P54WVZVM1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services for use in your app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

