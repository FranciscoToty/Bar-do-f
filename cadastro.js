// cadastro.js - ATUALIZADO
window.cadastrarUsuario = async function (event) {
    event.preventDefault();

    const nome = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value;
    const confirmaSenha = document.getElementById('confirm-password').value;
    //const tipo = document.getElementById('tipo').value;
    //const turma = document.getElementById('turma').value.trim();

    // Validação de senha
    if (senha !== confirmaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    // USA O AUTH.JS
    const resultado = await auth.fazerCadastro({
        nome,
        email,
        senha
        //tipo,
        //turma
    });

    if (resultado.sucesso) {
        alert(resultado.mensagem);
        event.target.reset();
        
        // Redireciona para login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } else {
        alert(resultado.mensagem);
    }
}