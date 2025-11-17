// tela_adm.js - CORRIGIDO: Validação de preços
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
// VERIFICAÇÃO DE ADMIN
// ========================================
if (!window.auth?.isAdmin()) {
  console.error('❌ Acesso não autorizado');
  throw new Error('Acesso negado');
}

console.log('✅ tela_adm.js carregado - Admin autorizado');

// ========================================
// REFERÊNCIAS DO DOM
// ========================================
const form = document.getElementById('form-prato');
const itemTipo = document.getElementById('item-tipo');
const dishName = document.getElementById('dish-name');
const dishDescription = document.getElementById('dish-description');
const dishPrice = document.getElementById('dish-price');
const dishImageUrl = document.getElementById('dish-image-url');
const listaPratos = document.getElementById('lista-pratos');
const submitBtn = document.getElementById('submit-btn');

const pratosRef = ref(db, 'pratos');

let modoEdicao = false;
let pratoIdEmEdicao = null;
let dadosOriginais = null;

// ========================================
// ✅ CORRIGIDO: OBTER VARIAÇÕES COM PREÇOS
// ========================================
function obterVariacoesComPrecos() {
  const variacoes = {};
  const checkboxes = document.querySelectorAll('.variacao-checkbox:checked');
  
  console.log('🔍 Checkboxes marcados:', checkboxes.length);
  
  checkboxes.forEach(checkbox => {
    const tipo = checkbox.value;
    const precoInput = document.querySelector(`[data-preco-variacao="${tipo}"]`);
    
    console.log(`📝 Variação ${tipo}:`, {
      input: precoInput,
      valor: precoInput?.value,
      visivel: precoInput?.style.display
    });
    
    if (precoInput && precoInput.value) {
      const preco = parseFloat(precoInput.value);
      
      if (!isNaN(preco) && preco > 0) {
        variacoes[tipo] = preco;
        console.log(`✅ ${tipo}: R$ ${preco}`);
      } else {
        console.warn(`⚠️ ${tipo}: Preço inválido (${precoInput.value})`);
      }
    } else {
      console.warn(`⚠️ ${tipo}: Campo vazio ou não encontrado`);
    }
  });
  
  console.log('📦 Variações coletadas:', variacoes);
  return variacoes;
}

// ========================================
// MANTIDO: OBTER VARIAÇÕES SEM PREÇO (COMPATIBILIDADE)
// ========================================
function obterVariacoesSelecionadas() {
  const checkboxes = document.querySelectorAll('.variacao-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// ========================================
// FORMULÁRIO DE ADICIONAR/ATUALIZAR
// ========================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  console.log('📤 Formulário enviado');
  
  if (!dishName.value.trim() || !dishDescription.value.trim()) {
    alert('❌ Preencha todos os campos obrigatórios!');
    return;
  }

  // ✅ VALIDAÇÃO MELHORADA
  if (itemTipo.value === 'prato') {
    const checkboxesMarcados = document.querySelectorAll('.variacao-checkbox:checked');
    
    console.log('🔍 Validando variações...');
    console.log('Checkboxes marcados:', checkboxesMarcados.length);
    
    if (checkboxesMarcados.length === 0) {
      alert('❌ Marque pelo menos uma variação para pratos!');
      return;
    }
    
    const variacoesComPrecos = obterVariacoesComPrecos();
    const quantidadeComPreco = Object.keys(variacoesComPrecos).length;
    
    console.log('Variações com preço:', quantidadeComPreco);
    
    if (quantidadeComPreco === 0) {
      // Verifica qual variação está sem preço
      checkboxesMarcados.forEach(cb => {
        const tipo = cb.value;
        const precoInput = document.querySelector(`[data-preco-variacao="${tipo}"]`);
        if (!precoInput || !precoInput.value || parseFloat(precoInput.value) <= 0) {
          console.error(`❌ ${tipo}: sem preço válido`);
        }
      });
      
      alert('❌ Adicione o preço para as variações marcadas!\n\nVerifique se preencheu todos os campos de preço.');
      return;
    }
  }

  // VALIDAÇÃO PARA BEBIDA
  if (itemTipo.value === 'bebida') {
    const preco = parseFloat(dishPrice.value);
    if (isNaN(preco) || preco <= 0) {
      alert('❌ Insira um preço válido para a bebida!');
      return;
    }
  }

  if (modoEdicao) {
    await atualizarItem();
  } else {
    await adicionarItem();
  }
});

// ========================================
// ✅ ATUALIZADO: ADICIONAR ITEM COM PREÇOS POR VARIAÇÃO
// ========================================
async function adicionarItem() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adicionando...';

    const tipo = itemTipo.value;
    const novoItem = {
      tipo: tipo,
      nome: dishName.value.trim(),
      descricao: dishDescription.value.trim(),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: Date.now(),
      criadoPor: auth.getUsuarioLogado().nome
    };

    if (tipo === 'bebida') {
      novoItem.preco = parseFloat(dishPrice.value);
      novoItem.variacoes = {};
    } else {
      novoItem.variacoes = obterVariacoesComPrecos();
      novoItem.preco = 0;
    }

    console.log('💾 Salvando item:', novoItem);

    await push(pratosRef, novoItem);
    
    form.reset();
    
    // Limpa os campos de preço manualmente
    document.querySelectorAll('[data-preco-variacao]').forEach(input => {
      input.style.display = 'none';
      input.value = '';
    });
    
    mostrarNotificacao(`✅ ${tipo === 'bebida' ? 'Bebida' : 'Prato'} adicionado com sucesso!`, 'sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar:', error);
    mostrarNotificacao('❌ Erro ao adicionar: ' + error.message, 'erro');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Adicionar Item';
  }
}

// ========================================
// ✅ ATUALIZADO: ATUALIZAR ITEM COM PREÇOS POR VARIAÇÃO
// ========================================
async function atualizarItem() {
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Atualizando...';

    const tipo = itemTipo.value;
    const itemAtualizado = {
      tipo: tipo,
      nome: dishName.value.trim(),
      descricao: dishDescription.value.trim(),
      imagemUrl: dishImageUrl.value.trim() || '',
      criadoEm: dadosOriginais.criadoEm || Date.now(),
      criadoPor: dadosOriginais.criadoPor || 'Admin',
      atualizadoEm: Date.now(),
      atualizadoPor: auth.getUsuarioLogado().nome
    };

    if (tipo === 'bebida') {
      itemAtualizado.preco = parseFloat(dishPrice.value);
      itemAtualizado.variacoes = {};
    } else {
      itemAtualizado.variacoes = obterVariacoesComPrecos();
      itemAtualizado.preco = 0;
    }

    await update(ref(db, `pratos/${pratoIdEmEdicao}`), itemAtualizado);
    
    mostrarNotificacao('✅ Item atualizado com sucesso!', 'sucesso');
    cancelarEdicao();
    
  } catch (error) {
    console.error('❌ Erro ao atualizar:', error);
    mostrarNotificacao('❌ Erro ao atualizar: ' + error.message, 'erro');
  } finally {
    submitBtn.disabled = false;
  }
}

// ========================================
// MANTIDO: CANCELAR EDIÇÃO
// ========================================
function cancelarEdicao() {
  modoEdicao = false;
  pratoIdEmEdicao = null;
  dadosOriginais = null;
  form.reset();
  
  // Esconde campos de preço
  document.querySelectorAll('[data-preco-variacao]').forEach(input => {
    input.style.display = 'none';
    input.value = '';
  });
  
  submitBtn.textContent = 'Adicionar Item';
  submitBtn.className = 'w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors';
  
  const btnCancelar = document.getElementById('btn-cancelar-edicao');
  if (btnCancelar) btnCancelar.remove();
}

// ========================================
// MANTIDO: CARREGAR E EXIBIR ITENS
// ========================================
onValue(pratosRef, (snapshot) => {
  listaPratos.innerHTML = '';
  
  if (!snapshot.exists()) {
    listaPratos.innerHTML = `
      <div class="text-center py-8">
        <span class="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">restaurant_menu</span>
        <p class="text-subtext-light dark:text-subtext-dark mt-4">Nenhum item cadastrado.</p>
      </div>
    `;
    return;
  }

  const itensArray = [];
  snapshot.forEach((childSnapshot) => {
    itensArray.push({
      id: childSnapshot.key,
      ...childSnapshot.val()
    });
  });
  
  itensArray.sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
  
  itensArray.forEach((item) => {
    const card = criarCardItem(item, item.id);
    listaPratos.appendChild(card);
  });
  
  console.log(`📋 ${itensArray.length} itens carregados`);
});

// ========================================
// ✅ ATUALIZADO: CRIAR CARD COM PREÇOS POR VARIAÇÃO
// ========================================
function criarCardItem(item, itemId) {
  const div = document.createElement('div');
  div.className = 'bg-card-light dark:bg-card-dark p-4 rounded-lg flex items-start gap-4 hover:shadow-lg transition-shadow';
  
  const icone = item.tipo === 'bebida' 
    ? '<span class="material-symbols-outlined text-blue-500">local_cafe</span>'
    : '<span class="material-symbols-outlined text-primary">restaurant</span>';
  
  const badge = item.tipo === 'bebida'
    ? '<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">Bebida</span>'
    : '<span class="text-xs px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full">Prato</span>';
  
  let variacoesHtml = '';
  if (item.tipo === 'prato' && item.variacoes) {
    const emojis = {
      frango: '🐔',
      gado: '🥩',
      porco: '🐷',
      peixe: '🐟',
      vegano: '🌱',
      vegetariano: '🥗'
    };
    
    if (typeof item.variacoes === 'object' && !Array.isArray(item.variacoes)) {
      const variacoesEntries = Object.entries(item.variacoes);
      if (variacoesEntries.length > 0) {
        variacoesHtml = '<div class="mt-3 space-y-1">';
        variacoesEntries.forEach(([tipo, preco]) => {
          variacoesHtml += `
            <div class="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
              <span>${emojis[tipo] || ''} ${tipo}</span>
              <span class="font-bold text-primary">R$ ${preco.toFixed(2).replace('.', ',')}</span>
            </div>
          `;
        });
        variacoesHtml += '</div>';
      }
    } else if (Array.isArray(item.variacoes) && item.variacoes.length > 0) {
      variacoesHtml = `<div class="flex flex-wrap gap-1 mt-2">
         ${item.variacoes.map(v => {
           return `<span class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">${emojis[v] || ''} ${v}</span>`;
         }).join('')}
       </div>`;
    }
  }
  
  const precoHtml = item.tipo === 'bebida'
    ? `<p class="text-primary font-bold mt-2">R$ ${item.preco.toFixed(2).replace('.', ',')}</p>`
    : '';
  
  const imagemHtml = item.imagemUrl 
    ? `<img src="${item.imagemUrl}" alt="${item.nome}" class="w-20 h-20 object-cover rounded-lg"/>` 
    : `<div class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">
         ${icone}
       </div>`;
  
  div.innerHTML = `
    <div class="flex-shrink-0">
      ${imagemHtml}
    </div>
    <div class="flex-grow">
      <div class="flex items-center gap-2 mb-1">
        ${badge}
      </div>
      <h3 class="font-semibold text-lg">${item.nome}</h3>
      <p class="text-sm text-subtext-light dark:text-subtext-dark mt-1 line-clamp-2">${item.descricao}</p>
      ${variacoesHtml}
      ${precoHtml}
    </div>
    <div class="flex flex-col gap-2">
      <button data-edit="${itemId}" class="text-blue-500 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Editar">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button data-delete="${itemId}" class="text-red-500 hover:text-red-600 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Excluir">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  
  const btnEdit = div.querySelector('[data-edit]');
  const btnDelete = div.querySelector('[data-delete]');
  
  btnEdit.addEventListener('click', () => editarItem(itemId));
  btnDelete.addEventListener('click', () => excluirItem(itemId));
  
  return div;
}

// ========================================
// ✅ ATUALIZADO: EDITAR ITEM COM PREÇOS POR VARIAÇÃO
// ========================================
async function editarItem(itemId) {
  try {
    const itemRef = ref(db, `pratos/${itemId}`);
    const snapshot = await get(itemRef);
    
    if (!snapshot.exists()) {
      mostrarNotificacao('❌ Item não encontrado!', 'erro');
      return;
    }
    
    const item = snapshot.val();
    dadosOriginais = item;
    modoEdicao = true;
    pratoIdEmEdicao = itemId;
    
    itemTipo.value = item.tipo || 'prato';
    dishName.value = item.nome;
    dishDescription.value = item.descricao;
    dishImageUrl.value = item.imagemUrl || '';
    
    if (item.tipo === 'bebida') {
      dishPrice.value = item.preco;
    } else {
      if (typeof item.variacoes === 'object' && !Array.isArray(item.variacoes)) {
        document.querySelectorAll('.variacao-checkbox').forEach(cb => {
          const tipo = cb.value;
          const temVariacao = item.variacoes[tipo] !== undefined;
          
          cb.checked = temVariacao;
          
          if (temVariacao) {
            const precoInput = document.querySelector(`[data-preco-variacao="${tipo}"]`);
            if (precoInput) {
              precoInput.value = item.variacoes[tipo];
              precoInput.style.display = 'block';
            }
          }
        });
      } else if (Array.isArray(item.variacoes)) {
        document.querySelectorAll('.variacao-checkbox').forEach(cb => {
          cb.checked = item.variacoes && item.variacoes.includes(cb.value);
        });
      }
    }
    
    document.getElementById('variacoes-container').style.display = 
      item.tipo === 'bebida' ? 'none' : 'block';
    document.getElementById('preco-bebida-container').style.display = 
      item.tipo === 'bebida' ? 'block' : 'none';
    
    submitBtn.textContent = 'Atualizar Item';
    submitBtn.className = 'w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors';
    
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    dishName.focus();
    
    mostrarNotificacao('✏️ Modo de edição ativado', 'info');
    
  } catch (error) {
    console.error('❌ Erro ao carregar item:', error);
    mostrarNotificacao('❌ Erro ao carregar: ' + error.message, 'erro');
  }
}

// ========================================
// MANTIDO: EXCLUIR ITEM
// ========================================
async function excluirItem(itemId) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este item?\n\nEsta ação não pode ser desfeita!')) {
    return;
  }

  try {
    await remove(ref(db, `pratos/${itemId}`));
    mostrarNotificacao('✅ Item excluído com sucesso!', 'sucesso');
    
    if (pratoIdEmEdicao === itemId) {
      cancelarEdicao();
    }
    
  } catch (error) {
    console.error('❌ Erro ao excluir:', error);
    mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'erro');
  }
}

// ========================================
// MANTIDO: SISTEMA DE NOTIFICAÇÕES
// ========================================
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacaoAnterior = document.querySelector('.notificacao-admin');
  if (notificacaoAnterior) notificacaoAnterior.remove();
  
  const cores = {
    sucesso: 'bg-green-500',
    erro: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao-admin fixed top-4 left-1/2 transform -translate-x-1/2 ${cores[tipo]} text-white px-6 py-3 rounded-lg shadow-xl z-50 transition-all duration-300 opacity-0`;
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.style.opacity = '1';
    notificacao.style.top = '1rem';
  }, 10);
  
  setTimeout(() => {
    notificacao.style.opacity = '0';
    notificacao.style.top = '-50px';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

// ========================================
// MANTIDO: ESTILO ADICIONAL
// ========================================
const style = document.createElement('style');
style.textContent = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

console.log('✅ Sistema carregado com logs de debug!');