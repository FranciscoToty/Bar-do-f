// tela_adm.js
import { db } from './firebaseconfig.js';
import { 
  ref, 
  push, 
  onValue, 
  remove, 
  update,
  get
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Referências do DOM
const form = document.querySelector('form');
const dishName = document.getElementById('dish-name');
const dishDescription = document.getElementById('dish-description');
const dishPrice = document.getElementById('dish-price');
const dishImageUrl = document.getElementById('dish-image-url');
const listaPratos = document.getElementById('lista-pratos');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = form.querySelector('button[type="submit"]');

// Referência do database
const pratosRef = ref(db, 'pratos');

// Variável para controlar modo de edição
let modoEdicao = false;
let pratoIdEmEdicao = null;
let dadosOriginais = null;

// Função para adicionar/atualizar prato
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validação básica
  if (!dishName.value || !dishDescription.value || !dishPrice.value) {
    alert('Por favor, preencha todos os campos obrigatórios!');
    return;
  }

  if (modoEdicao) {
    await atualizarPrato();
  } else {
    await adicionarPrato();
  }
});

// Função para adicionar prato
async function adicionarPrato() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adicionando...';

    // Adiciona o prato no database
    const novoPrato = {
      nome: dishName.value,
      descricao: dishDescription.value,
      preco: parseFloat(dishPrice.value),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: Date.now()
    };

    await push(pratosRef, novoPrato);
    
    // Limpa o formulário
    form.reset();
    alert('Prato adicionado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao adicionar prato:', error);
    alert('Erro ao adicionar prato: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Adicionar Prato';
  }
}

// Função para atualizar prato
async function atualizarPrato() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Atualizando...';

    // Atualiza o prato no database mantendo o criadoEm original
    const pratoAtualizado = {
      nome: dishName.value,
      descricao: dishDescription.value,
      preco: parseFloat(dishPrice.value),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: dadosOriginais.criadoEm || Date.now(),
      atualizadoEm: Date.now()
    };

    await update(ref(db, `pratos/${pratoIdEmEdicao}`), pratoAtualizado);
    
    alert('Prato atualizado com sucesso!');
    cancelarEdicao();
    
  } catch (error) {
    console.error('Erro ao atualizar prato:', error);
    alert('Erro ao atualizar prato: ' + error.message);
  } finally {
    submitBtn.disabled = false;
  }
}

// Função para cancelar edição
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

// Função para carregar e exibir pratos
onValue(pratosRef, (snapshot) => {
  listaPratos.innerHTML = '';
  
  if (!snapshot.exists()) {
    listaPratos.innerHTML = '<p class="text-center text-subtext-light dark:text-subtext-dark">Nenhum prato cadastrado ainda.</p>';
    return;
  }

  // Converte snapshot em array e ordena
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
});

// Função para criar card de prato
function criarCardPrato(prato, pratoId) {
  const div = document.createElement('div');
  div.className = 'bg-card-light dark:bg-card-dark p-4 rounded-lg flex items-start gap-4';
  
  div.innerHTML = `
    <div class="flex-shrink-0">
      ${prato.imagemUrl 
        ? `<img src="${prato.imagemUrl}" alt="${prato.nome}" class="w-20 h-20 object-cover rounded-lg"/>` 
        : `<div class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
             <span class="material-symbols-outlined text-gray-500">restaurant</span>
           </div>`
      }
    </div>
    <div class="flex-grow">
      <h3 class="font-semibold text-lg">${prato.nome}</h3>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1">${prato.descricao}</p>
      <p class="text-primary font-bold mt-2">R$ ${prato.preco.toFixed(2)}</p>
    </div>
    <div class="flex flex-col gap-2">
      <button data-edit="${pratoId}" class="text-blue-500 hover:text-blue-600 transition-colors">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button data-delete="${pratoId}" class="text-red-500 hover:text-red-600 transition-colors">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  
  // Adiciona event listeners
  const btnEdit = div.querySelector('[data-edit]');
  const btnDelete = div.querySelector('[data-delete]');
  
  btnEdit.addEventListener('click', () => editarPrato(pratoId));
  btnDelete.addEventListener('click', () => excluirPrato(pratoId));
  
  return div;
}

// Função para editar prato
async function editarPrato(pratoId) {
  try {
    const pratoRef = ref(db, `pratos/${pratoId}`);
    const snapshot = await get(pratoRef);
    
    if (!snapshot.exists()) {
      alert('Prato não encontrado!');
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
    
    // Adiciona botão de cancelar se não existir
    let btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (!btnCancelar) {
      btnCancelar = document.createElement('button');
      btnCancelar.id = 'btn-cancelar-edicao';
      btnCancelar.type = 'button';
      btnCancelar.className = 'w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors mt-2';
      btnCancelar.textContent = 'Cancelar Edição';
      btnCancelar.addEventListener('click', cancelarEdicao);
      submitBtn.parentElement.appendChild(btnCancelar);
    }
    
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Erro ao carregar prato para edição:', error);
    alert('Erro ao carregar prato: ' + error.message);
  }
}

// Função para excluir prato
async function excluirPrato(pratoId) {
  if (!confirm('Tem certeza que deseja excluir este prato?')) {
    return;
  }

  try {
    // Remove o prato do database
    await remove(ref(db, `pratos/${pratoId}`));
    alert('Prato excluído com sucesso!');
    
    // Se estava editando este prato, cancela a edição
    if (pratoIdEmEdicao === pratoId) {
      cancelarEdicao();
    }
    
  } catch (error) {
    console.error('Erro ao excluir prato:', error);
    alert('Erro ao excluir prato: ' + error.message);
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  if (confirm('Deseja sair do painel de administração?')) {
    window.location.href = 'index.html';
  }
});

console.log('Script tela_adm.js carregado com sucesso!');