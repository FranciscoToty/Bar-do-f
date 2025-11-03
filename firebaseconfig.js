
// Importa as funções necessárias do Firebase SDK v9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

 const firebaseConfig = {
  apiKey: "AIzaSyDENLJSPpFeeZAqSGW4QYw1rG7wUDoDPnA",
  authDomain: "bardof-c1b4d.firebaseapp.com",
  databaseURL: "https://bardof-c1b4d-default-rtdb.firebaseio.com",
  projectId: "bardof-c1b4d",
  storageBucket: "bardof-c1b4d.firebasestorage.app",
  messagingSenderId: "360363951793",
  appId: "1:360363951793:web:3d707868438ee651fa0490"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Realtime Database
const db = getDatabase(app);

// Exporta o db para usar em outros arquivos
export { db };