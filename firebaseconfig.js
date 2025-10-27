// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "arquivox-c9d74.firebaseapp.com",
  databaseURL: "https://arquivox-c9d74-default-rtdb.firebaseio.com",
  projectId: "arquivox-c9d74",
  storageBucket: "arquivox-c9d74.firebasestorage.app",
  messagingSenderId: "235350186717",
  appId: "1:235350186717:web:6273c8f7e998257d5e9934"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que você quer usar
export const db = getDatabase(app);
export default app;
