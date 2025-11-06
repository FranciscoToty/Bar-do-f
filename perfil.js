// perfil.js
document.addEventListener('DOMContentLoaded', async function() {
    
    // Aguarda auth.js carregar
    if (!window.auth) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // PROTEÇÃO
    if (!auth.estaLogado()) {
        alert('Você precisa estar logado para acessar o perfil!');
        window.location.href = 'login.html';
        return;
    }
    
    const usuario = auth.getUsuarioLogado();
    console.log('👤 Usuário:', usuario);
    
    // Preenche campos
    const inputNome = document.querySelector('input[value="Daniel Almeida"]');
    const inputEmail = document.querySelector('input[value="daniel.almeida@restaurante.com"]');
    const inputTelefone = document.querySelector('input[value="(11) 98765-4321"]');
    
    if (inputNome) inputNome.value = usuario.nome || '';
    if (inputEmail) inputEmail.value = usuario.email || '';
    if (inputTelefone) inputTelefone.value = usuario.telefone || '';
    
    // Botão Salvar
    const btnSalvar = document.querySelector('button.bg-orange-primary');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', async function() {
            const novoNome = inputNome.value.trim();
            const novoTelefone = inputTelefone.value.trim();
            
            if (!novoNome) {
                alert('❌ O nome não pode estar vazio!');
                return;
            }
            
            btnSalvar.disabled = true;
            btnSalvar.textContent = 'Salvando...';
            
            const resultado = await auth.atualizarPerfil({
                nome: novoNome,
                telefone: novoTelefone
            });
            
            if (resultado.sucesso) {
                alert('✅ ' + resultado.mensagem);
                btnSalvar.textContent = 'Salvo!';
                btnSalvar.style.background = '#10b981';
                
                setTimeout(() => {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Alterações';
                    btnSalvar.style.background = '';
                }, 2000);
            } else {
                alert('❌ ' + resultado.mensagem);
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Alterações';
            }
        });
    }
    
    // Botão Alterar Senha
    const btnSenha = document.querySelector('button.text-orange-primary');
    if (btnSenha) {
        btnSenha.addEventListener('click', async function() {
            const senhaAtual = prompt('🔐 Senha atual:');
            if (!senhaAtual) return;
            
            const novaSenha = prompt('🔑 Nova senha (mín. 6 caracteres):');
            if (!novaSenha || novaSenha.length < 6) {
                alert('❌ Senha deve ter no mínimo 6 caracteres!');
                return;
            }
            
            const confirmar = prompt('🔑 Confirme a nova senha:');
            if (novaSenha !== confirmar) {
                alert('❌ Senhas não coincidem!');
                return;
            }
            
            const resultado = await auth.alterarSenha(senhaAtual, novaSenha);
            alert(resultado.sucesso ? '✅ ' + resultado.mensagem : '❌ ' + resultado.mensagem);
        });
    }
    
    // Botão Sair
    const btnSair = document.querySelector('button.text-destructive');
    if (btnSair) {
        btnSair.addEventListener('click', function() {
            if (confirm('Deseja sair?')) {
                auth.fazerLogout();
            }
        });
    }
    
    // Botão Voltar
    const btnVoltar = document.querySelector('header button');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => window.location.href = 'index.html');
    }
});