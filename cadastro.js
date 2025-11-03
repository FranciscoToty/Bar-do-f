// Importa o módulo 'db' (o serviço Realtime Database já inicializado) do seu firebaseconfig.js
import { db } from './firebaseconfig.js';

// Importa as funções necessárias do SDK do Firebase para o Realtime Database, utilizando a versão 9.22.2
import { ref, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

/**
 * Função utilitária para mostrar feedback (sucesso/erro) na tela, 
 * substituindo o uso de alert() ou window.alert().
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} isSuccess - Verdadeiro para sucesso (cor verde), Falso para erro (cor vermelha).
 */
function showFeedback(message, isSuccess) {
    let feedbackEl = document.getElementById('feedback-message');
    
    // Se o elemento de feedback não existe, cria um novo
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'feedback-message';
        feedbackEl.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-xl text-white font-semibold transition-all duration-300 opacity-0';
        document.body.appendChild(feedbackEl);
    }
    
    // Configura a cor e o conteúdo da mensagem
    feedbackEl.textContent = message;
    
    if (isSuccess) {
        feedbackEl.classList.remove('bg-red-500');
        feedbackEl.classList.add('bg-green-600');
    } else {
        feedbackEl.classList.remove('bg-green-600');
        feedbackEl.classList.add('bg-red-500');
    }

    // Mostra a mensagem
    // Adiciona uma pequena animação de 'pop-in'
    setTimeout(() => {
        feedbackEl.style.opacity = '1';
        feedbackEl.style.top = '1rem';
    }, 10);
    
    // Esconde a mensagem após 4 segundos
    setTimeout(() => {
        feedbackEl.style.opacity = '0';
        feedbackEl.style.top = '-50px'; // Move para cima para sumir
    }, 4000);
}


/**
 * Função principal chamada pelo formulário para cadastrar o usuário no Realtime Database.
 * @param {Event} event - O evento de submissão do formulário.
 */
window.cadastrarUsuario = async function (event) {
    // 1. Previne o comportamento padrão de recarregar a página
    event.preventDefault();

    // Adiciona um check de segurança para garantir que o DB foi inicializado
    if (!db) {
        showFeedback("Erro de inicialização: O banco de dados Firebase não está acessível. Verifique firebaseconfig.js.", false);
        console.error("Firebase DB instance is null or undefined. Check firebaseconfig.js imports/exports.");
        return;
    }

    // 2. Coleta os dados dos campos do formulário
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const nome = nameInput.value.trim();
    const email = emailInput.value.trim();
    const senha = passwordInput.value;
    const confirmaSenha = confirmPasswordInput.value;

    // 3. Validação básica de campos e senhas
    if (!nome || !email || !senha || !confirmaSenha) {
        showFeedback("Por favor, preencha todos os campos.", false);
        return;
    }

    if (senha !== confirmaSenha) {
        showFeedback("As senhas não coincidem. Tente novamente.", false);
        // Limpa os campos de senha
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        return;
    }

    // 4. Cria o objeto de dados a ser salvo
    // Atenção: Em um sistema real, a senha deveria ser sempre hasheada (criptografada) antes de ser salva,
    // mas para este projeto escolar, estamos salvando o objeto como solicitado.
    const userData = {
        nome: nome,
        email: email,
        senha: senha,
        // Adiciona um timestamp para registro
        dataCadastro: new Date().toISOString() 
    };

    try {
        // 5. Define a referência para o caminho /usuarios no Realtime Database
        // O push() cria uma chave única (ID) dentro de /usuarios e salva o objeto userData
        const usuariosRef = ref(db, 'usuarios');
        
        await push(usuariosRef, userData);

        // 6. Feedback de sucesso e limpeza do formulário
        showFeedback("Cadastro realizado com sucesso! Dados salvos no Firebase.", true);
        event.target.reset(); // Limpa o formulário após o sucesso

    } catch (error) {
        // 7. Feedback de erro melhorado para diagnosticar problemas comuns (Regras/Permissão)
        console.error("Erro ao cadastrar usuário no Realtime Database:", error);
        
        let errorMessage = `Erro ao salvar dados: ${error.message}`;
        
        // Verifica a mensagem de erro para dar um feedback mais direcionado sobre permissões (o mais comum)
        if (error.message.includes('permission_denied') || error.message.includes('Permission denied')) {
             errorMessage = "Permissão negada. Verifique se as Regras de Segurança do seu Firebase Realtime Database permitem escrita (write: true) para usuários não autenticados.";
        }
        
        showFeedback(errorMessage, false);
    }
}
