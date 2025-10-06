function cadastrarUsuario() {
    console.log("Cadastrando usuário...");
    var nome = document.getElementById("nome").value;
    var email = document.getElementById("email").value;
    var senha = document.getElementById("senha").value;

    window.alert("Nome: " + nome + "\nEmail: " + email + "\nSenha: " + senha);
}