// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: "task-manager-29b73.firebaseapp.com",
  projectId: "task-manager-29b73",
  storageBucket: "task-manager-29b73.appspot.com",
  messagingSenderId: "835411637443",
  appId: "1:835411637443:web:0c64485c08be39c78f5e76",
  measurementId: "G-W7G1NDZ49R"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);