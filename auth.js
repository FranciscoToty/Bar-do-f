/**
 * auth.js - Sistema Universal de Autenticação
 * Inclua este script em TODAS as páginas do site
 * <script src="auth.js"></script>
 */

// ========================================
// CONFIGURAÇÃO
// ========================================

const CONFIG = {
    // Páginas que NÃO precisam de login (públicas)
    paginasPublicas: ['index.html', 'login.html', 'cadastro.html', ''],
    
    // Páginas restritas a admin
    paginasAdmin: ['admin.html', 'painel-admin.html', 'gerenciar.html'],
    
    // Página de redirecionamento após login
    paginaPosLogin: 'dashboard.html',
    
    // Página de login
    paginaLogin: 'login.html'
};

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

/**
 * Verifica se o usuário está logado
 * @returns {Object|null} Dados do usuário ou null
 */
function getUsuarioLogado() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    return usuario ? JSON.parse(usuario) : null;
}

/**
 * Verifica se está logado
 * @returns {boolean}
 */
function estaLogado() {
    return getUsuarioLogado() !== null;
}

/**
 * Salva dados do usuário no sessionStorage
 * @param {Object} dadosUsuario - Dados do usuário
 */
function salvarLogin(dadosUsuario) {
    sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));
    console.log('✅ Login salvo:', dadosUsuario.nome);
}

/**
 * Remove login e redireciona
 */
function fazerLogout() {
    sessionStorage.removeItem('usuarioLogado');
    console.log('👋 Logout realizado');
    window.location.href = CONFIG.paginaLogin;
}

/**
 * Verifica se o usuário é admin
 * @returns {boolean}
 */
function isAdmin() {
    const usuario = getUsuarioLogado();
    if (!usuario) return false;
    return usuario.tipo === 'admin' || usuario.tipo === 'administrador';
}

/**
 * Obtém a página atual
 * @returns {string}
 */
function getPaginaAtual() {
    const path = window.location.pathname;
    const pagina = path.split('/').pop();
    return pagina || 'index.html';
}

/**
 * Verifica se a página atual é pública
 * @returns {boolean}
 */
function isPaginaPublica() {
    const paginaAtual = getPaginaAtual();
    return CONFIG.paginasPublicas.includes(paginaAtual);
}

/**
 * Verifica se a página atual requer admin
 * @returns {boolean}
 */
function isPaginaAdmin() {
    const paginaAtual = getPaginaAtual();
    return CONFIG.paginasAdmin.includes(paginaAtual);
}

/**
 * Proteção principal - verifica acesso
 */
function verificarAcesso() {
    const paginaAtual = getPaginaAtual();
    const logado = estaLogado();
    const admin = isAdmin();

    console.log('🔐 Verificando acesso:', {
        pagina: paginaAtual,
        logado: logado,
        admin: admin
    });

    // Se é página pública, libera acesso
    if (isPaginaPublica()) {
        console.log('✅ Página pública - acesso liberado');
        
        // Se já está logado e tentou acessar login, redireciona para dashboard
        if (logado && paginaAtual === 'login.html') {
            console.log('↪️ Já está logado, redirecionando...');
            window.location.href = CONFIG.paginaPosLogin;
        }
        return;
    }

    // Se não está logado, redireciona para login
    if (!logado) {
        console.log('❌ Não logado - redirecionando para login');
        window.location.href = CONFIG.paginaLogin;
        return;
    }

    // Se é página admin e não é admin, nega acesso
    if (isPaginaAdmin() && !admin) {
        console.log('🚫 Acesso negado - requer admin');
        mostrarAcessoNegado();
        return;
    }

    console.log('✅ Acesso permitido');
}

/**
 * Mostra mensagem de acesso negado
 */
function mostrarAcessoNegado() {
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="background: white; border-radius: 1rem; padding: 3rem; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.1);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem;">Acesso Negado</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">Você não tem permissão para acessar esta página.</p>
                <button onclick="window.location.href='dashboard.html'" style="background: #f97306; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; border: none; cursor: pointer; width: 100%;">
                    Voltar ao Dashboard
                </button>
            </div>
        </div>
    `;
}

/**
 * Preenche elementos da página com dados do usuário
 */
function preencherDadosUsuario() {
    const usuario = getUsuarioLogado();
    
    if (!usuario) {
        console.log('⚠️ Nenhum usuário logado para preencher');
        return;
    }

    console.log('📝 Preenchendo dados do usuário:', usuario.nome);

    // Preenche nome
    document.querySelectorAll('.usuario-nome, [data-usuario="nome"]').forEach(el => {
        el.textContent = usuario.nome;
    });

    // Preenche email
    document.querySelectorAll('.usuario-email, [data-usuario="email"]').forEach(el => {
        el.textContent = usuario.email;
    });

    // Preenche tipo
    document.querySelectorAll('.usuario-tipo, [data-usuario="tipo"]').forEach(el => {
        el.textContent = usuario.tipo;
    });

    // Preenche turma
    document.querySelectorAll('.usuario-turma, [data-usuario="turma"]').forEach(el => {
        el.textContent = usuario.turma || 'Não informada';
    });

    // Preenche ID
    document.querySelectorAll('.usuario-id, [data-usuario="id"]').forEach(el => {
        el.textContent = usuario.id;
    });

    // Mostra/esconde elementos baseado em admin
    if (isAdmin()) {
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.style.display = '';
        });
        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('[data-user-only]').forEach(el => {
            el.style.display = '';
        });
    }
}

/**
 * Adiciona informações de login no header (se existir)
 */
function adicionarInfoHeader() {
    const usuario = getUsuarioLogado();
    if (!usuario) return;

    const header = document.querySelector('header');
    if (!header) return;

    // Verifica se já existe o info-usuario
    if (document.getElementById('info-usuario')) return;

    const infoDiv = document.createElement('div');
    infoDiv.id = 'info-usuario';
    infoDiv.style.cssText = 'display: flex; align-items: center; gap: 1rem;';
    
    infoDiv.innerHTML = `
        <div style="text-align: right;">
            <div style="font-size: 0.875rem; font-weight: 600; color: #1f2937;">${usuario.nome}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">${usuario.tipo}</div>
        </div>
        <button onclick="auth.fazerLogout()" style="background: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer;">
            Sair
        </button>
    `;

    header.appendChild(infoDiv);
}

/**
 * Mostra indicador de status de login
 */
function mostrarStatusLogin() {
    if (!estaLogado()) return;

    const indicator = document.createElement('div');
    indicator.id = 'login-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        background: #10b981;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    const usuario = getUsuarioLogado();
    indicator.innerHTML = `
        <span style="width: 8px; height: 8px; background: white; border-radius: 50%; display: inline-block;"></span>
        Conectado como ${usuario.nome}
    `;

    document.body.appendChild(indicator);
}

// ========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ========================================

// Executa quando o DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}

function inicializar() {
    console.log('🚀 Auth.js inicializado');
    
    // Verifica acesso
    verificarAcesso();
    
    // Se estiver logado, preenche dados
    if (estaLogado()) {
        preencherDadosUsuario();
        adicionarInfoHeader();
        mostrarStatusLogin();
    }
}

// ========================================
// API GLOBAL
// ========================================

// Exporta funções globalmente
window.auth = {
    // Informações
    getUsuarioLogado,
    estaLogado,
    isAdmin,
    
    // Ações
    salvarLogin,
    fazerLogout,
    
    // Verificações
    verificarAcesso,
    
    // Utilitários
    preencherDadosUsuario,
    
    // Config
    config: CONFIG
};

// Log de inicialização
console.log('✅ Sistema de autenticação carregado');
if (estaLogado()) {
    const usuario = getUsuarioLogado();
    console.log('👤 Usuário logado:', usuario.nome, `(${usuario.tipo})`);
}