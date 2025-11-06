// cadastro.js - ATUALIZADO com suporte a Admin

import { db } from './firebaseconfig.js';
import { ref, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

function showFeedback(message, isSuccess) {
    let feedbackEl = document.getElementById('feedback-message');
    
    if (!feedbackEl) {
        feedbackEl = document.createElement('div');
        feedbackEl.id = 'feedback-message';
        feedbackEl.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-xl text-white font-semibold transition-all duration-300 opacity-0';
        document.body.appendChild(feedbackEl);
    }
    
    feedbackEl.textContent = message;
    
    if (isSuccess) {
        feedbackEl.classList.remove('bg-red-500');
        feedbackEl.classList.add('bg-green-600');
    } else {
        feedbackEl.classList.remove('bg-green-600');
        feedbackEl.classList.add('bg-red-500');
    }

    setTimeout(() => {
        feedbackEl.style.opacity = '1';
        feedbackEl.style.top = '1rem';
    }, 10);
    
    setTimeout(() => {
        feedbackEl.style.opacity = '0';
        feedbackEl.style.top = '-50px';
    }, 4000);
}

window.cadastrarUsuario = async function (event) {
    event.preventDefault();

    if (!db) {
        showFeedback("Erro: Firebase não inicializado.", false);
        console.error("Firebase DB não está acessível.");
        return;
    }

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const tipoInput = document.getElementById('tipo'); // ⚠️ IMPORTANTE: Adicionar campo tipo no HTML
    const turmaInput = document.getElementById('turma');

    const nome = nameInput.value.trim();
    const email = emailInput.value.trim();
    const senha = passwordInput.value;
    const confirmaSenha = confirmPasswordInput.value;
    const tipo = tipoInput ? tipoInput.value : 'aluno'; // Padrão: aluno
    const turma = turmaInput ? turmaInput.value.trim() : '';

    if (!nome || !email || !senha || !confirmaSenha) {
        showFeedback("Por favor, preencha todos os campos.", false);
        return;
    }

    if (senha !== confirmaSenha) {
        showFeedback("As senhas não coincidem.", false);
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        return;
    }

    if (senha.length < 6) {
        showFeedback("A senha deve ter no mínimo 6 caracteres.", false);
        return;
    }

    const userData = {
        nome: nome,
        email: email,
        senha: senha,
        tipo: tipo, // ✅ Agora salva o tipo de usuário
        turma: turma || null,
        dataCadastro: new Date().toISOString(),
        ativo: true
    };

    try {
        const usuariosRef = ref(db, 'usuarios');
        const result = await push(usuariosRef, userData);

        showFeedback(`✅ Cadastro realizado com sucesso! Tipo: ${tipo}`, true);
        event.target.reset();
        
        console.log('Usuário cadastrado:', result.key, userData);

    } catch (error) {
        console.error("Erro ao cadastrar:", error);
        
        let errorMessage = `Erro: ${error.message}`;
        
        if (error.message.includes('permission') || error.message.includes('Permission')) {
            errorMessage = "Permissão negada. Verifique as regras do Firebase.";
        }
        
        showFeedback(errorMessage, false);
    }
}