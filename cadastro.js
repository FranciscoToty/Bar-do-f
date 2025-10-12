function cadastrarUsuario(event) {
    event.preventDefault(); // Impede o recarregamento da página

    var nome = document.getElementById("name").value;
    var email = document.getElementById("email").value;
    var senha = document.getElementById("password").value;

    const novoRegistro = {
        nome,
        email,
        senha
    };

    db.ref('usuarios').push(novoRegistro)
      .then(() => {
        alert("Registrado com sucesso!");
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
      })
      .catch((error) => {
        console.error("Erro ao registrar:", error);
        alert("Erro ao registrar: " + error.message);
      });
}