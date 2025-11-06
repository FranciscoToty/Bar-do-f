// login.js - NOVO
const btnLogin = document.querySelector("button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

btnLogin.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const senha = passwordInput.value.trim();

  // Desabilita botão durante o login
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  // USA O AUTH.JS
  const resultado = await auth.fazerLogin(email, senha);

  if (resultado.sucesso) {
    alert(resultado.mensagem);
    
    // Redireciona baseado no tipo de usuário
    if (auth.isAdmin()) {
      window.location.href = 'Tela_adm.html';
    } else {
      window.location.href = 'index.html';
    }
  } else {
    alert(resultado.mensagem);
    btnLogin.disabled = false;
    btnLogin.textContent = 'Login';
  }
});