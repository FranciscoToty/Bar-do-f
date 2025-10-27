// login.js
import { db } from "./firebaseconfig.js";
import { ref, get, child } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const btnLogin = document.querySelector("button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

btnLogin.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const senha = passwordInput.value.trim();

  if (!email || !senha) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, "usuarios"));

    if (!snapshot.exists()) {
      alert("Nenhum usuário encontrado!");
      return;
    }

    let usuarioEncontrado = null;

    snapshot.forEach((childSnapshot) => {
      const usuario = childSnapshot.val();
      if (usuario.email === email && usuario.senha === senha) {
        usuarioEncontrado = usuario;
      }
    });

    if (!usuarioEncontrado) {
      alert("Usuário ou senha incorretos!");
      return;
    }

    alert(`Bem-vindo, ${usuarioEncontrado.nome}!`);

    if (email === "adm@adm.com" && senha === "ADM") {
      window.location.href = "Tela_adm.html";
    } else {
      window.location.href = "index.html";
    }

  } catch (error) {
    console.error("Erro no login:", error);
    alert("Erro ao fazer login.");
  }
});
