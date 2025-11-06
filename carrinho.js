// carrinho.js
import { db } from './firebaseconfig.js';
import { ref, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Verifica se está logado ao carregar a página
if (!auth.estaLogado()) {
    alert('Você precisa estar logado para acessar esta página!');
    window.location.href = 'login.html';
}

// Referências do DOM
const carrinhoItems = document.getElementById('carrinho-items');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const finalizarPedidoBtn = document.getElementById('finalizar-pedido');
const horarioSelect = document.getElementById('horario-retirada');

// Função para formatar preço
function formatarPreco(preco) {
  return preco.toFixed(2).replace('.', ',');
}

// Função para carregar carrinho do localStorage
function carregarCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  return carrinho;
}

// Função para salvar carrinho no localStorage
function salvarCarrinho(carrinho) {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// Função para calcular totais
function calcularTotais() {
  const carrinho = carregarCarrinho();
  const total = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
  
  return { total };
}

// Função para atualizar exibição dos totais
function atualizarTotais() {
  const { total } = calcularTotais();
  
  subtotalEl.textContent = `R$ ${formatarPreco(total)}`;
  totalEl.textContent = `R$ ${formatarPreco(total)}`;
  
  // Desabilita botão se carrinho vazio
  const carrinho = carregarCarrinho();
  finalizarPedidoBtn.disabled = carrinho.length === 0;
}

// Função para gerar horários disponíveis
function gerarHorarios() {
  const horarios = [];
  const inicio = 11 * 60 + 50; // 11:50 em minutos
  const fim = 14 * 60; // 14:00 em minutos
  const intervalo = 10; // Intervalo de 10 minutos
  
  for (let minutos = inicio; minutos <= fim; minutos += intervalo) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    const horarioFormatado = `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    horarios.push(horarioFormatado);
  }
  
  return horarios;
}

// Preenche o select de horários
function preencherHorarios() {
  const horarios = gerarHorarios();
  horarioSelect.innerHTML = '<option value="">Selecione o horário</option>';
  
  horarios.forEach(horario => {
    const option = document.createElement('option');
    option.value = horario;
    option.textContent = horario;
    horarioSelect.appendChild(option);
  });
}

// Função para aumentar quantidade
function aumentarQuantidade(itemId) {
  const carrinho = carregarCarrinho();
  const item = carrinho.find(i => i.id === itemId);
  
  if (item) {
    item.quantidade += 1;
    salvarCarrinho(carrinho);
    renderizarCarrinho();
    mostrarNotificacao('Quantidade atualizada!');
  }
}

// Função para diminuir quantidade
function diminuirQuantidade(itemId) {
  const carrinho = carregarCarrinho();
  const item = carrinho.find(i => i.id === itemId);
  
  if (item) {
    if (item.quantidade > 1) {
      item.quantidade -= 1;
      salvarCarrinho(carrinho);
      renderizarCarrinho();
      mostrarNotificacao('Quantidade atualizada!');
    } else {
      removerItem(itemId);
    }
  }
}

// Função para remover item do carrinho
function removerItem(itemId) {
  if (confirm('Deseja remover este item do carrinho?')) {
    let carrinho = carregarCarrinho();
    carrinho = carrinho.filter(i => i.id !== itemId);
    salvarCarrinho(carrinho);
    renderizarCarrinho();
    mostrarNotificacao('Item removido do carrinho!');
  }
}

// Torna as funções globais
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.removerItem = removerItem;

// Função para criar card de item do carrinho
function criarCardItem(item) {
  const subtotalItem = item.preco * item.quantidade;
  
  const div = document.createElement('div');
  div.className = 'flex items-center gap-4 bg-white dark:bg-zinc-800/30 p-3 rounded-lg';
  
  const imagemHtml = item.imagemUrl 
    ? `<img alt="${item.nome}" class="h-16 w-16 rounded-lg object-cover" src="${item.imagemUrl}"/>`
    : `<div class="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
         <span class="material-symbols-outlined text-primary">restaurant</span>
       </div>`;
  
  div.innerHTML = `
    <div class="flex-shrink-0">
      ${imagemHtml}
    </div>
    <div class="flex-grow">
      <p class="font-bold">${item.nome}</p>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">${item.descricao || ''}</p>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <button onclick="diminuirQuantidade('${item.id}')" class="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
            -
          </button>
          <span class="font-semibold text-zinc-900 dark:text-zinc-100 min-w-[20px] text-center">${item.quantidade}</span>
          <button onclick="aumentarQuantidade('${item.id}')" class="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
            +
          </button>
        </div>
        <p class="font-semibold text-primary">R$ ${formatarPreco(subtotalItem)}</p>
      </div>
    </div>
    <button onclick="removerItem('${item.id}')" class="text-red-500 hover:text-red-600 transition-colors">
      <span class="material-symbols-outlined">delete</span>
    </button>
  `;
  
  return div;
}

// Função para renderizar o carrinho
function renderizarCarrinho() {
  const carrinho = carregarCarrinho();
  carrinhoItems.innerHTML = '';
  
  if (carrinho.length === 0) {
    carrinhoItems.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <span class="material-symbols-outlined text-6xl text-zinc-300 dark:text-zinc-600 mb-4">
          shopping_cart
        </span>
        <p class="text-lg font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
          Seu carrinho está vazio
        </p>
        <p class="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
          Adicione itens deliciosos do nosso cardápio!
        </p>
        <button onclick="window.location.href='index.html'" class="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors">
          Ver Cardápio
        </button>
      </div>
    `;
    document.getElementById('resumo-pedido').style.display = 'none';
  } else {
    document.getElementById('resumo-pedido').style.display = 'block';
    carrinho.forEach(item => {
      const card = criarCardItem(item);
      carrinhoItems.appendChild(card);
    });
  }
  
  atualizarTotais();
}

// Função para finalizar pedido
async function finalizarPedido() {
  const carrinho = carregarCarrinho();
  
  if (carrinho.length === 0) {
    mostrarNotificacao('Seu carrinho está vazio!', 'erro');
    return;
  }
  
  // VERIFICA SE ESTÁ LOGADO
  const estaLogado = window.auth?.estaLogado();
  if (!estaLogado) {
    if (confirm('Você precisa estar logado para fazer um pedido. Deseja ir para a página de login?')) {
      window.location.href = 'login.html';
    }
    return;
  }
  
  if (!horarioSelect.value) {
    mostrarNotificacao('Por favor, selecione um horário de retirada!', 'erro');
    horarioSelect.focus();
    return;
  }
  
  try {
    finalizarPedidoBtn.disabled = true;
    finalizarPedidoBtn.textContent = 'Processando...';
    
    const { total } = calcularTotais();
    
    // Obtém dados do usuário logado
    const usuario = window.auth.getUsuarioLogado();
    
    // Dados do usuário
    const dadosUsuario = {
      usuarioId: usuario.id || null,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email || null,
      usuarioTipo: usuario.tipo || 'cliente',
      usuarioTurma: usuario.turma || null
    };
    
    const pedido = {
      // Dados do pedido
      items: carrinho,
      total: total,
      horarioRetirada: horarioSelect.value,
      status: 'pendente',
      dataPedido: new Date().toISOString(),
      timestamp: Date.now(),
      
      // Dados do usuário que fez o pedido
      ...dadosUsuario
    };
    
    const pedidosRef = ref(db, 'pedidos');
    await push(pedidosRef, pedido);
    
    localStorage.removeItem('carrinho');
    
    mostrarNotificacao('Pedido realizado com sucesso!', 'sucesso');
    
    setTimeout(() => {
      window.location.href = 'pedidos.html';
    }, 1500);
    
  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    mostrarNotificacao('Erro ao finalizar pedido. Tente novamente.', 'erro');
    finalizarPedidoBtn.disabled = false;
    finalizarPedidoBtn.textContent = 'Finalizar Pedido';
  }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacaoAnterior = document.querySelector('.notificacao-carrinho');
  if (notificacaoAnterior) {
    notificacaoAnterior.remove();
  }
  
  const cores = {
    sucesso: 'bg-green-500',
    erro: 'bg-red-500',
    info: 'bg-primary'
  };
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao-carrinho fixed top-20 left-1/2 transform -translate-x-1/2 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300`;
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.style.opacity = '1';
  }, 10);
  
  setTimeout(() => {
    notificacao.style.opacity = '0';
    setTimeout(() => {
      notificacao.remove();
    }, 300);
  }, 2000);
}

// Função para verificar login e mostrar aviso se necessário
function verificarLogin() {
  const estaLogado = window.auth?.estaLogado();
  const usuario = window.auth?.getUsuarioLogado();
  
  if (estaLogado && usuario) {
    console.log('✅ Usuário logado:', usuario.nome);
    
    // Mostra nome do usuário no cabeçalho
    const header = document.querySelector('header h1');
    if (header) {
      const nomeUsuario = document.createElement('div');
      nomeUsuario.className = 'text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-1';
      nomeUsuario.textContent = `Olá, ${usuario.nome}!`;
      header.appendChild(nomeUsuario);
    }
  } else {
    console.log('⚠️ Usuário não está logado');
    
    // Mostra aviso OBRIGATÓRIO de login
    const aviso = document.createElement('div');
    aviso.className = 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-4 rounded-lg mb-4';
    aviso.innerHTML = `
      <div class="flex items-start gap-3">
        <span class="material-symbols-outlined text-2xl">lock</span>
        <div class="flex-grow">
          <p class="font-bold text-base mb-1">Login Obrigatório</p>
          <p class="text-sm mb-3">
            Você precisa estar logado para fazer um pedido.
          </p>
          <a href="login.html" class="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
            Fazer Login Agora
          </a>
        </div>
      </div>
    `;
    
    const main = document.querySelector('main');
    if (main) {
      main.insertBefore(aviso, main.firstChild);
    }
    
    // Desabilita o botão de finalizar pedido
    finalizarPedidoBtn.disabled = true;
    finalizarPedidoBtn.textContent = 'Login Necessário';
    finalizarPedidoBtn.className = 'w-full h-12 rounded-lg bg-gray-400 text-white font-bold text-lg cursor-not-allowed opacity-50';
  }
}

finalizarPedidoBtn.addEventListener('click', finalizarPedido);

const style = document.createElement('style');
style.textContent = `
  .notificacao-carrinho {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

// Verifica login ao carregar
verificarLogin();

preencherHorarios();
renderizarCarrinho();

console.log('Carrinho.js carregado com sucesso!');