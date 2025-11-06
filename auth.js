// auth.js - Sistema de Autenticação Firebase
// ============================================
// Importa Firebase (certifique-se que firebaseconfig.js está carregado ANTES)

import { db } from './firebaseconfig.js';
import { ref, get, child, push, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ============================================
// OBJETO PRINCIPAL DE AUTENTICAÇÃO
// ============================================

const auth = {
  
  // ========================================
  // 1. FAZER LOGIN
  // ========================================
  async fazerLogin(email, senha) {
    try {
      console.log('🔐 Tentando login...');
      
      if (!email || !senha) {
        throw new Error('Email e senha são obrigatórios!');
      }

      // Busca todos os usuários
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'usuarios'));

      if (!snapshot.exists()) {
        throw new Error('Nenhum usuário cadastrado no sistema!');
      }

      // Procura o usuário pelo email e senha
      let usuarioEncontrado = null;
      let usuarioId = null;

      snapshot.forEach((childSnapshot) => {
        const usuario = childSnapshot.val();
        
        // Verifica email e senha
        if (usuario.email === email && usuario.senha === senha) {
          usuarioEncontrado = usuario;
          usuarioId = childSnapshot.key;
        }
      });

      // Se não encontrou
      if (!usuarioEncontrado) {
        throw new Error('Email ou senha incorretos!');
      }

      // Verifica se usuário está ativo
      if (usuarioEncontrado.ativo === false) {
        throw new Error('Usuário desativado. Entre em contato com o administrador.');
      }

      // Salva dados no sessionStorage
      const dadosUsuario = {
        id: usuarioId,
        nome: usuarioEncontrado.nome,
        email: usuarioEncontrado.email,
        tipo: usuarioEncontrado.tipo || 'aluno',
        turma: usuarioEncontrado.turma || null,
        telefone: usuarioEncontrado.telefone || null
      };

      this.salvarLogin(dadosUsuario);

      console.log('✅ Login realizado com sucesso!', dadosUsuario);
      
      return {
        sucesso: true,
        usuario: dadosUsuario,
        mensagem: `Bem-vindo(a), ${dadosUsuario.nome}!`
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao fazer login'
      };
    }
  },

  // ========================================
  // 2. FAZER CADASTRO
  // ========================================
  async fazerCadastro(dados) {
    try {
      console.log('📝 Iniciando cadastro...');
      
      // Validações
      if (!dados.nome || !dados.email || !dados.senha) {
        throw new Error('Nome, email e senha são obrigatórios!');
      }

      if (dados.senha.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres!');
      }

      // Verifica se email já existe
      const emailExiste = await this.verificarEmailExiste(dados.email);
      
      if (emailExiste) {
        throw new Error('Este email já está cadastrado!');
      }

      // Prepara dados do usuário
      const novoUsuario = {
        nome: dados.nome.trim(),
        email: dados.email.trim().toLowerCase(),
        senha: dados.senha,
        tipo: dados.tipo || 'aluno',
        turma: dados.turma || null,
        telefone: dados.telefone || null,
        dataCadastro: new Date().toISOString(),
        ativo: true
      };

      // Salva no Firebase
      const usuariosRef = ref(db, 'usuarios');
      const resultado = await push(usuariosRef, novoUsuario);

      console.log('✅ Cadastro realizado com sucesso!', resultado.key);

      return {
        sucesso: true,
        usuarioId: resultado.key,
        mensagem: 'Cadastro realizado com sucesso!'
      };

    } catch (error) {
      console.error('❌ Erro no cadastro:', error);
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao fazer cadastro'
      };
    }
  },

  // ========================================
  // 3. VERIFICAR SE EMAIL JÁ EXISTE
  // ========================================
  async verificarEmailExiste(email) {
    try {
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'usuarios'));

      if (!snapshot.exists()) {
        return false;
      }

      let existe = false;

      snapshot.forEach((childSnapshot) => {
        const usuario = childSnapshot.val();
        if (usuario.email === email.trim().toLowerCase()) {
          existe = true;
        }
      });

      return existe;

    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  },

  // ========================================
  // 4. SALVAR LOGIN NO SESSIONSTORAGE
  // ========================================
  salvarLogin(dadosUsuario) {
    sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));
    console.log('💾 Sessão salva:', dadosUsuario);
  },

  // ========================================
  // 5. VERIFICAR SE ESTÁ LOGADO
  // ========================================
  estaLogado() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    return usuario !== null;
  },

  // ========================================
  // 6. OBTER USUÁRIO LOGADO
  // ========================================
  getUsuarioLogado() {
    try {
      const usuario = sessionStorage.getItem('usuarioLogado');
      
      if (!usuario) {
        return null;
      }

      return JSON.parse(usuario);

    } catch (error) {
      console.error('Erro ao obter usuário logado:', error);
      return null;
    }
  },

  // ========================================
  // 7. FAZER LOGOUT
  // ========================================
  fazerLogout() {
    sessionStorage.removeItem('usuarioLogado');
    console.log('👋 Logout realizado');
    window.location.href = 'login.html';
  },

  // ========================================
  // 8. VERIFICAR SE É ADMIN
  // ========================================
  isAdmin() {
    const usuario = this.getUsuarioLogado();
    
    if (!usuario) {
      return false;
    }

    return usuario.tipo === 'admin';
  },

  // ========================================
  // 9. PROTEGER ROTA (redireciona se não logado)
  // ========================================
  protegerRota(redirecionarPara = 'login.html') {
    if (!this.estaLogado()) {
      console.warn('⚠️ Acesso negado. Redirecionando para login...');
      window.location.href = redirecionarPara;
      return false;
    }
    return true;
  },

  // ========================================
  // 10. PROTEGER ROTA ADMIN (redireciona se não for admin)
  // ========================================
  protegerRotaAdmin(redirecionarPara = 'index.html') {
    if (!this.estaLogado()) {
      console.warn('⚠️ Acesso negado. Faça login primeiro.');
      window.location.href = 'login.html';
      return false;
    }

    if (!this.isAdmin()) {
      console.warn('⚠️ Acesso negado. Apenas administradores.');
      window.location.href = redirecionarPara;
      return false;
    }

    return true;
  },

  // ========================================
  // 11. ATUALIZAR DADOS DO USUÁRIO
  // ========================================
  async atualizarPerfil(novosDados) {
    try {
      const usuario = this.getUsuarioLogado();
      
      if (!usuario) {
        throw new Error('Usuário não está logado!');
      }

      // Importa update do Firebase
      const { update } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js");
      
      const userRef = ref(db, `usuarios/${usuario.id}`);
      await update(userRef, novosDados);

      // Atualiza sessionStorage
      const dadosAtualizados = { ...usuario, ...novosDados };
      this.salvarLogin(dadosAtualizados);

      console.log('✅ Perfil atualizado com sucesso!');

      return {
        sucesso: true,
        mensagem: 'Perfil atualizado com sucesso!'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao atualizar perfil'
      };
    }
  },

  // ========================================
  // 12. ALTERAR SENHA
  // ========================================
  async alterarSenha(senhaAtual, novaSenha) {
    try {
      const usuario = this.getUsuarioLogado();
      
      if (!usuario) {
        throw new Error('Usuário não está logado!');
      }

      // Verifica senha atual no Firebase
      const userRef = ref(db, `usuarios/${usuario.id}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error('Usuário não encontrado!');
      }

      const dados = snapshot.val();

      if (dados.senha !== senhaAtual) {
        throw new Error('Senha atual incorreta!');
      }

      if (novaSenha.length < 6) {
        throw new Error('A nova senha deve ter no mínimo 6 caracteres!');
      }

      // Atualiza senha
      const { update } = await import("https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js");
      await update(userRef, { senha: novaSenha });

      console.log('✅ Senha alterada com sucesso!');

      return {
        sucesso: true,
        mensagem: 'Senha alterada com sucesso!'
      };

    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao alterar senha'
      };
    }
  }
};

// ============================================
// EXPORTA O OBJETO AUTH GLOBALMENTE
// ============================================
window.auth = auth;

// Log de inicialização
console.log('🔐 Sistema de Autenticação carregado!');
console.log('📌 Disponível em: window.auth');

// Exporta para módulos ES6
export default auth;