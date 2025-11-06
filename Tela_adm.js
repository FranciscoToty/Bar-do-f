// tela_adm.js - ATUALIZADO COM PROTEÇÃO
import { db } from './firebaseconfig.js';
import { 
  ref, 
  push, 
  onValue, 
  remove, 
  update,
  get
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ========================================
// VERIFICAÇÃO DE ADMIN (segurança extra)
// ========================================
if (!window.auth?.isAdmin()) {
  console.error('❌ Acesso não autorizado ao tela_adm.js');
  throw new Error('Acesso negado');
}

console.log('✅ tela_adm.js carregado - Admin autorizado');

// ========================================
// REFERÊNCIAS DO DOM
// ========================================
const form = document.getElementById('form-prato');
const dishName = document.getElementById('dish-name');
const dishDescription = document.getElementById('dish-description');
const dishPrice = document.getElementById('dish-price');
const dishImageUrl = document.getElementById('dish-image-url');
const listaPratos = document.getElementById('lista-pratos');
const submitBtn = document.getElementById('submit-btn');

// Referência do database
const pratosRef = ref(db, 'pratos');

// ========================================
// VARIÁVEIS DE CONTROLE
// ========================================
let modoEdicao = false;
let pratoIdEmEdicao = null;
let dadosOriginais = null;

// ========================================
// FORMULÁRIO DE ADICIONAR/ATUALIZAR
// ========================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validação básica
  if (!dishName.value.trim() || !dishDescription.value.trim() || !dishPrice.value) {
    alert('❌ Por favor, preencha todos os campos obrigatórios!');
    return;
  }

  const preco = parseFloat(dishPrice.value);
  if (isNaN(preco) || preco <= 0) {
    alert('❌ Por favor, insira um preço válido!');
    return;
  }

  if (modoEdicao) {
    await atualizarPrato();
  } else {
    await adicionarPrato();
  }
});

// ========================================
// ADICIONAR NOVO PRATO
// ========================================
async function adicionarPrato() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adicionando...';

    const novoPrato = {
      nome: dishName.value.trim(),
      descricao: dishDescription.value.trim(),
      preco: parseFloat(dishPrice.value),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: Date.now(),
      criadoPor: auth.getUsuarioLogado().nome
    };

    await push(pratosRef, novoPrato);
    
    form.reset();
    mostrarNotificacao('✅ Prato adicionado com sucesso!', 'sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar prato:', error);
    mostrarNotificacao('❌ Erro ao adicionar prato: ' + error.message, 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Adicionar Prato';
  }
}

// ========================================
// ATUALIZAR PRATO EXISTENTE
// ========================================
async function atualizarPrato() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Atualizando...';

    const pratoAtualizado = {
      nome: dishName.value.trim(),
      descricao: dishDescription.value.trim(),
      preco: parseFloat(dishPrice.value),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: dadosOriginais.criadoEm || Date.now(),
      criadoPor: dadosOriginais.criadoPor || 'Admin',
      atualizadoEm: Date.now(),
      atualizadoPor: auth.getUsuarioLogado().nome
    };

    await update(ref(db, `pratos/${pratoIdEmEdicao}`), pratoAtualizado);
    
    mostrarNotificacao('✅ Prato atualizado com sucesso!', 'sucesso');
    cancelarEdicao();
    
  } catch (error) {
    console.error('❌ Erro ao atualizar prato:', error);
    mostrarNotificacao('❌ Erro ao atualizar prato: ' + error.message, 'erro');
  } finally {
    submitBtn.disabled = false;
  }
}

// ========================================
// CANCELAR EDIÇÃO
// ========================================
function cancelarEdicao() {
  modoEdicao = false;
  pratoIdEmEdicao = null;
  dadosOriginais = null;
  form.reset();
  
  submitBtn.textContent = 'Adicionar Prato';
  submitBtn.className = 'w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors';
  
  // Remove botão de cancelar se existir
  const btnCancelar = document.getElementById('btn-cancelar-edicao');
  if (btnCancelar) {
    btnCancelar.remove();
  }
}

// ========================================
// CARREGAR E EXIBIR PRATOS
// ========================================
onValue(pratosRef, (snapshot) => {
  listaPratos.innerHTML = '';
  
  if (!snapshot.exists()) {
    listaPratos.innerHTML = `
      <div class="text-center py-8">
        <span class="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">restaurant_menu</span>
        <p class="text-subtext-light dark:text-subtext-dark mt-4">Nenhum prato cadastrado ainda.</p>
        <p class="text-xs text-subtext-light dark:text-subtext-dark mt-2">Adicione o primeiro prato acima!</p>
      </div>
    `;
    return;
  }

  // Converte snapshot em array
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
    const pratoCard = criarCardPrato(prato, prato.id);
    listaPratos.appendChild(pratoCard);
  });
  
  console.log(`📋 ${pratosArray.length} pratos carregados`);
});

// ========================================
// CRIAR CARD DE PRATO
// ========================================
function criarCardPrato(prato, pratoId) {
  const div = document.createElement('div');
  div.className = 'bg-card-light dark:bg-card-dark p-4 rounded-lg flex items-start gap-4 hover:shadow-lg transition-shadow';
  
  // Imagem ou placeholder
  const imagemHtml = prato.imagemUrl 
    ? `<img src="${prato.imagemUrl}" alt="${prato.nome}" class="w-20 h-20 object-cover rounded-lg"/>` 
    : `<div class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
         <span class="material-symbols-outlined text-gray-500">restaurant</span>
       </div>`;
  
  div.innerHTML = `
    <div class="flex-shrink-0">
      ${imagemHtml}
    </div>
    <div class="flex-grow">
      <h3 class="font-semibold text-lg">${prato.nome}</h3>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1 line-clamp-2">${prato.descricao}</p>
      <p class="text-primary font-bold mt-2">R$ ${prato.preco.toFixed(2).replace('.', ',')}</p>
      ${prato.criadoPor ? `<p class="text-xs text-subtext-light dark:text-subtext-dark mt-1">Por: ${prato.criadoPor}</p>` : ''}
    </div>
    <div class="flex flex-col gap-2">
      <button data-edit="${pratoId}" class="text-blue-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Editar">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button data-delete="${pratoId}" class="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Excluir">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  
  // Event listeners
  const btnEdit = div.querySelector('[data-edit]');
  const btnDelete = div.querySelector('[data-delete]');
  
  btnEdit.addEventListener('click', () => editarPrato(pratoId));
  btnDelete.addEventListener('click', () => excluirPrato(pratoId));
  
  return div;
}

// ========================================
// EDITAR PRATO
// ========================================
async function editarPrato(pratoId) {
  try {
    const pratoRef = ref(db, `pratos/${pratoId}`);
    const snapshot = await get(pratoRef);
    
    if (!snapshot.exists()) {
      mostrarNotificacao('❌ Prato não encontrado!', 'erro');
      return;
    }
    
    const prato = snapshot.val();
    dadosOriginais = prato;
    modoEdicao = true;
    pratoIdEmEdicao = pratoId;
    
    // Preenche o formulário
    dishName.value = prato.nome;
    dishDescription.value = prato.descricao;
    dishPrice.value = prato.preco;
    dishImageUrl.value = prato.imagemUrl || '';
    
    // Muda o botão de submit
    submitBtn.textContent = 'Atualizar Prato';
    submitBtn.className = 'w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors';
    
    // Adiciona botão de cancelar
    let btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (!btnCancelar) {
      btnCancelar = document.createElement('button');
      btnCancelar.id = 'btn-cancelar-edicao';
      btnCancelar.type = 'button';
      btnCancelar.className = 'w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors mt-2';
      btnCancelar.textContent = 'Cancelar Edição';
      btnCancelar.addEventListener('click', cancelarEdicao);
      form.appendChild(btnCancelar);
    }
    
    // Scroll suave para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
    dishName.focus();
    
    mostrarNotificacao('✏️ Modo de edição ativado', 'info');
    
  } catch (error) {
    console.error('❌ Erro ao carregar prato:', error);
    mostrarNotificacao('❌ Erro ao carregar prato: ' + error.message, 'erro');
  }
}

// ========================================
// EXCLUIR PRATO
// ========================================
async function excluirPrato(pratoId) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este prato?\n\nEsta ação não pode ser desfeita!')) {
    return;
  }

  try {
    await remove(ref(db, `pratos/${pratoId}`));
    
    mostrarNotificacao('✅ Prato excluído com sucesso!', 'sucesso');
    
    // Se estava editando este prato, cancela
    if (pratoIdEmEdicao === pratoId) {
      cancelarEdicao();
    }
    
  } catch (error) {
    console.error('❌ Erro ao excluir prato:', error);
    mostrarNotificacao('❌ Erro ao excluir prato: ' + error.message, 'erro');
  }
}

// ========================================
// SISTEMA DE NOTIFICAÇÕES
// ========================================
function mostrarNotificacao(mensagem, tipo = 'info') {
  // Remove notificação anterior
  const notificacaoAnterior = document.querySelector('.notificacao-admin');
  if (notificacaoAnterior) {
    notificacaoAnterior.remove();
  }
  
  const cores = {
    sucesso: 'bg-green-500',
    erro: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao-admin fixed top-4 left-1/2 transform -translate-x-1/2 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-300 opacity-0`;
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  // Animação de entrada
  setTimeout(() => {
    notificacao.style.opacity = '1';
    notificacao.style.top = '1rem';
  }, 10);
  
  // Remove após 3 segundos
  setTimeout(() => {
    notificacao.style.opacity = '0';
    notificacao.style.top = '-50px';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

// ========================================
// ESTILO ADICIONAL
// ========================================
const style = document.createElement('style');
style.textContent = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .notificacao-admin {
    transition: all 0.3s ease-in-out;
  }
`;
document.head.appendChild(style);

console.log('✅ Sistema de gerenciamento de pratos carregado!');