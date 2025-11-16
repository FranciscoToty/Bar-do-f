// nav-update.js - Atualiza links de navegação baseado no login
// ============================================

// Aguarda auth.js carregar
await new Promise(resolve => {
    if (window.auth) resolve();
    else window.addEventListener('load', resolve);
});

console.log('🧭 nav-update.js carregado');

// ========================================
// ATUALIZA LINK DO PERFIL
// ========================================
function atualizarLinkPerfil() {
    // Procura todos os possíveis links de perfil/login na navegação
    const possiveisLinks = [
        'nav a[href="login.html"]',
        'footer a[href="login.html"]',
        '#link-perfil',
        'a[href="login.html"]:has(span:contains("Perfil"))',
        'a[href="login.html"]:has(.material-symbols-outlined:contains("person"))'
    ];
    
    let linkPerfil = null;
    
    // Tenta encontrar o link
    for (const selector of possiveisLinks) {
        linkPerfil = document.querySelector(selector);
        if (linkPerfil) break;
    }
    
    // Método alternativo: procura por qualquer link com ícone de pessoa
    if (!linkPerfil) {
        const todosLinks = document.querySelectorAll('a[href="login.html"]');
        todosLinks.forEach(link => {
            const temIconePessoa = link.querySelector('.material-symbols-outlined');
            if (temIconePessoa && temIconePessoa.textContent.trim() === 'person') {
                linkPerfil = link;
            }
        });
    }
    
    if (!linkPerfil) {
        console.warn('⚠️ Link de perfil não encontrado');
        return;
    }
    
    // Verifica se está logado
    if (auth.estaLogado()) {
        const usuario = auth.getUsuarioLogado();
        
        // Muda para perfil
        linkPerfil.href = 'perfil.html';
        
        // Adiciona destaque visual
        linkPerfil.classList.remove('text-zinc-500', 'dark:text-zinc-400', 'text-background-dark/60', 'dark:text-background-light/60');
        linkPerfil.classList.add('text-primary');
        
        // Adiciona tooltip com nome do usuário (opcional)
        linkPerfil.title = `${usuario.nome} - Clique para ver seu perfil`;
        
        console.log('✅ Link de perfil atualizado para:', usuario.nome);
    } else {
        // Garante que está apontando para login
        linkPerfil.href = 'login.html';
        linkPerfil.title = 'Fazer login';
        
        console.log('ℹ️ Link de perfil aponta para login (não logado)');
    }
}

// ========================================
// ADICIONA INDICADOR VISUAL DE USUÁRIO LOGADO
// ========================================
function adicionarIndicadorUsuario() {
    if (!auth.estaLogado()) return;
    
    const usuario = auth.getUsuarioLogado();
    
    // Procura o header/cabeçalho
    const header = document.querySelector('header h1');
    if (!header) return;
    
    // Verifica se já existe indicador
    if (document.getElementById('usuario-logado-indicator')) return;
    
    // Cria indicador
    const indicador = document.createElement('div');
    indicador.id = 'usuario-logado-indicator';
    indicador.className = 'text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-1';
    indicador.innerHTML = `
        <span class="inline-flex items-center gap-1">
            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
            ${usuario.nome}
        </span>
    `;
    
    header.appendChild(indicador);
    console.log('✅ Indicador de usuário logado adicionado');
}

// ========================================
// ATUALIZA CONTADOR DO CARRINHO (bônus)
// ========================================
function atualizarContadorCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
    
    if (total === 0) return;
    
    // Procura botão/link do carrinho
    const linkCarrinho = document.querySelector('a[href="carrinho.html"]');
    if (!linkCarrinho) return;
    
    // Remove badge anterior se existir
    const badgeAntigo = linkCarrinho.querySelector('.badge-carrinho');
    if (badgeAntigo) badgeAntigo.remove();
    
    // Cria novo badge
    const badge = document.createElement('span');
    badge.className = 'badge-carrinho absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold';
    badge.textContent = total;
    
    // Adiciona ao link
    linkCarrinho.style.position = 'relative';
    linkCarrinho.appendChild(badge);
    
    console.log(`🛒 ${total} itens no carrinho`);
}

// ========================================
// EXECUTA ATUALIZAÇÕES
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Atualizando navegação...');
    
    atualizarLinkPerfil();
    adicionarIndicadorUsuario();
    atualizarContadorCarrinho();
    
    console.log('✅ Navegação atualizada!');
});

// ========================================
// ATUALIZA QUANDO O CARRINHO MUDAR
// ========================================
window.addEventListener('storage', function(e) {
    if (e.key === 'carrinho') {
        atualizarContadorCarrinho();
    }
});

// Exporta funções para uso externo
window.navUpdate = {
    atualizarLinkPerfil,
    adicionarIndicadorUsuario,
    atualizarContadorCarrinho
};

console.log('✅ Sistema de navegação carregado!');