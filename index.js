// index.js
import { db } from './firebaseconfig.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Referência do container de pratos
const pratosContainer = document.getElementById('pratos-container');

// Referência do database
const pratosRef = ref(db, 'pratos');

// Função para formatar preço
function formatarPreco(preco) {
  return preco.toFixed(2).replace('.', ',');
}

// Função para criar card de prato
// Função para criar card de prato
function criarCardPrato(prato, pratoId) {
  const card = document.createElement('a');
  card.className = 'flex flex-col gap-3 rounded-xl min-w-60 flex-shrink-0 group cursor-pointer';
  card.onclick = (e) => {
    e.preventDefault();
    adicionarAoCarrinho(pratoId, prato);
  };
  
  // HTML do card com ou sem imagem
  if (prato.imagemUrl) {
    card.innerHTML = `
      <div class="w-full aspect-square bg-cover bg-center rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105" 
           style="background-image: url('${prato.imagemUrl}');">
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-base font-semibold text-background-dark dark:text-background-light">${prato.nome}</p>
        <p class="text-sm text-background-dark/60 dark:text-background-light/60 line-clamp-2">${prato.descricao}</p>
        <p class="text-lg font-bold text-primary">R$ ${formatarPreco(prato.preco)}</p>
      </div>
    `;
  } else {
    // Quando não há imagem, mostra um ícone
    card.innerHTML = `
      <div class="w-full aspect-square rounded-xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 bg-primary/10 flex items-center justify-center">
        <span class="material-symbols-outlined text-8xl text-primary/40">restaurant</span>
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-base font-semibold text-background-dark dark:text-background-light">${prato.nome}</p>
        <p class="text-sm text-background-dark/60 dark:text-background-light/60 line-clamp-2">${prato.descricao}</p>
        <p class="text-lg font-bold text-primary">R$ ${formatarPreco(prato.preco)}</p>
      </div>
    `;
  }
  
  return card;
}

// Função para adicionar ao carrinho
function adicionarAoCarrinho(pratoId, prato) {
  // Busca o carrinho do localStorage
  let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  
  // Verifica se o prato já está no carrinho
  const pratoExistente = carrinho.find(item => item.id === pratoId);
  
  if (pratoExistente) {
    // Se já existe, aumenta a quantidade
    pratoExistente.quantidade += 1;
  } else {
    // Se não existe, adiciona novo item
    carrinho.push({
      id: pratoId,
      nome: prato.nome,
      descricao: prato.descricao,
      preco: prato.preco,
      imagemUrl: prato.imagemUrl,
      quantidade: 1
    });
  }
  
  // Salva no localStorage
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  
  // Feedback visual
  mostrarNotificacao(`${prato.nome} adicionado ao carrinho!`);
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
  // Remove notificação anterior se existir
  const notificacaoAnterior = document.querySelector('.notificacao-carrinho');
  if (notificacaoAnterior) {
    notificacaoAnterior.remove();
  }
  
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao-carrinho fixed top-20 left-1/2 transform -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  // Animação de entrada
  setTimeout(() => {
    notificacao.style.opacity = '1';
  }, 10);
  
  // Remove após 2 segundos
  setTimeout(() => {
    notificacao.style.opacity = '0';
    setTimeout(() => {
      notificacao.remove();
    }, 300);
  }, 2000);
}

// Carrega os pratos do Firebase
onValue(pratosRef, (snapshot) => {
  pratosContainer.innerHTML = '';
  
  if (!snapshot.exists()) {
    pratosContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center w-full py-12 text-center">
        <span class="material-symbols-outlined text-6xl text-background-dark/30 dark:text-background-light/30 mb-4">
          restaurant_menu
        </span>
        <p class="text-background-dark/60 dark:text-background-light/60 text-lg">
          Nenhum prato disponível no momento
        </p>
        <p class="text-background-dark/40 dark:text-background-light/40 text-sm mt-2">
          Em breve teremos delícias para você!
        </p>
      </div>
    `;
    return;
  }
  
  // Converte snapshot em array e ordena por data de criação (mais recentes primeiro)
  const pratosArray = [];
  snapshot.forEach((childSnapshot) => {
    pratosArray.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  
  // Ordena por data de criação (mais recentes primeiro)
  pratosArray.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  
  // Cria os cards
  pratosArray.forEach((prato) => {
    const card = criarCardPrato(prato, prato.id);
    pratosContainer.appendChild(card);
  });
  
  console.log(`${pratosArray.length} pratos carregados!`);
});

// Atualiza contador do carrinho no header (opcional)
function atualizarContadorCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
  const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  
  // Você pode adicionar um badge no botão do carrinho se quiser
  const botaoCarrinho = document.querySelector('button[onclick*="carrinho.html"]');
  if (botaoCarrinho && total > 0) {
    let badge = botaoCarrinho.querySelector('.badge-carrinho');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge-carrinho absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold';
      botaoCarrinho.style.position = 'relative';
      botaoCarrinho.appendChild(badge);
    }
    badge.textContent = total;
  }
}

// Atualiza o contador quando a página carrega
atualizarContadorCarrinho();

// Adiciona estilo para a notificação
const style = document.createElement('style');
style.textContent = `
  .notificacao-carrinho {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

console.log('Index.js carregado com sucesso!');