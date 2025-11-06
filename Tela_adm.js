// tela_adm.js
import { db } from './firebaseconfig.js';
import { 
  ref, 
  push, 
  onValue, 
  remove, 
  update 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// Inicializa o Storage
const storage = getStorage();

// Referências do DOM
const form = document.querySelector('form');
const dishName = document.getElementById('dish-name');
const dishDescription = document.getElementById('dish-description');
const dishPrice = document.getElementById('dish-price');
const dishImage = document.getElementById('dish-image');
const listaPratos = document.getElementById('lista-pratos');
const logoutBtn = document.getElementById('logoutBtn');

// Referência do database
const pratosRef = ref(db, 'pratos');

// Função para adicionar prato
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validação básica
  if (!dishName.value || !dishDescription.value || !dishPrice.value) {
    alert('Por favor, preencha todos os campos!');
    return;
  }

  try {
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adicionando...';

    let imageUrl = '';
    
    // Se houver imagem, faz upload
    if (dishImage.files[0]) {
      const file = dishImage.files[0];
      const timestamp = Date.now();
      const fileName = `pratos/${timestamp}_${file.name}`;
      const imageRef = storageRef(storage, fileName);
      
      await uploadBytes(imageRef, file);
      imageUrl = await getDownloadURL(imageRef);
    }

    // Adiciona o prato no database
    const novoPrato = {
      nome: dishName.value,
      descricao: dishDescription.value,
      preco: parseFloat(dishPrice.value),
      imagemUrl: imageUrl,
      imagemPath: imageUrl ? `pratos/${Date.now()}_${dishImage.files[0].name}` : '',
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
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Adicionar Prato';
  }
});

// Função para carregar e exibir pratos
onValue(pratosRef, (snapshot) => {
  listaPratos.innerHTML = '';
  
  if (!snapshot.exists()) {
    listaPratos.innerHTML = '<p class="text-center text-subtext-light dark:text-subtext-dark">Nenhum prato cadastrado ainda.</p>';
    return;
  }

  snapshot.forEach((childSnapshot) => {
    const prato = childSnapshot.val();
    const pratoId = childSnapshot.key;
    
    const pratoCard = criarCardPrato(prato, pratoId);
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
      <button onclick="editarPrato('${pratoId}')" class="text-blue-500 hover:text-blue-600">
        <span class="material-symbols-outlined">edit</span>
      </button>
      <button onclick="excluirPrato('${pratoId}', '${prato.imagemPath || ''}')" class="text-red-500 hover:text-red-600">
        <span class="material-symbols-outlined">delete</span>
      </button>
    </div>
  `;
  
  return div;
}

// Função para excluir prato
window.excluirPrato = async (pratoId, imagemPath) => {
  if (!confirm('Tem certeza que deseja excluir este prato?')) {
    return;
  }

  try {
    // Remove a imagem do Storage se existir
    if (imagemPath) {
      try {
        const imageRef = storageRef(storage, imagemPath);
        await deleteObject(imageRef);
      } catch (error) {
        console.log('Erro ao deletar imagem:', error);
      }
    }

    // Remove o prato do database
    await remove(ref(db, `pratos/${pratoId}`));
    alert('Prato excluído com sucesso!');
    
  } catch (error) {
    console.error('Erro ao excluir prato:', error);
    alert('Erro ao excluir prato: ' + error.message);
  }
};

// Função para editar prato
window.editarPrato = async (pratoId) => {
  const pratoRef = ref(db, `pratos/${pratoId}`);
  
  // Busca os dados atuais do prato
  onValue(pratoRef, (snapshot) => {
    if (snapshot.exists()) {
      const prato = snapshot.val();
      
      // Preenche o formulário com os dados atuais
      dishName.value = prato.nome;
      dishDescription.value = prato.descricao;
      dishPrice.value = prato.preco;
      
      // Muda o comportamento do botão de submit
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Atualizar Prato';
      submitBtn.className = 'w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors';
      
      // Remove o listener anterior e adiciona novo para atualização
      const novoForm = form.cloneNode(true);
      form.parentNode.replaceChild(novoForm, form);
      
      novoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await atualizarPrato(pratoId, prato.imagemUrl, prato.imagemPath);
      });
      
      // Scroll para o formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, { onlyOnce: true });
};

// Função para atualizar prato
async function atualizarPrato(pratoId, imagemUrlAtual, imagemPathAtual) {
  try {
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Atualizando...';

    let imageUrl = imagemUrlAtual;
    let imagePath = imagemPathAtual;
    
    // Se houver nova imagem, faz upload
    if (dishImage.files[0]) {
      // Remove a imagem antiga se existir
      if (imagemPathAtual) {
        try {
          const oldImageRef = storageRef(storage, imagemPathAtual);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.log('Erro ao deletar imagem antiga:', error);
        }
      }
      
      const file = dishImage.files[0];
      const timestamp = Date.now();
      const fileName = `pratos/${timestamp}_${file.name}`;
      const imageRef = storageRef(storage, fileName);
      
      await uploadBytes(imageRef, file);
      imageUrl = await getDownloadURL(imageRef);
      imagePath = fileName;
    }

    // Atualiza o prato no database
    const pratoAtualizado = {
      nome: dishName.value,
      descricao: dishDescription.value,
      preco: parseFloat(dishPrice.value),
      imagemUrl: imageUrl,
      imagemPath: imagePath,
      atualizadoEm: Date.now()
    };

    await update(ref(db, `pratos/${pratoId}`), pratoAtualizado);
    
    alert('Prato atualizado com sucesso!');
    location.reload(); // Recarrega a página para resetar o formulário
    
  } catch (error) {
    console.error('Erro ao atualizar prato:', error);
    alert('Erro ao atualizar prato: ' + error.message);
  }
}

// Logout
logoutBtn.addEventListener('click', () => {
  if (confirm('Deseja sair do painel de administração?')) {
    // Aqui você pode adicionar lógica de autenticação se necessário
    window.location.href = 'index.html'; // Redireciona para página principal
  }
});

console.log('Script tela_adm.js carregado com sucesso!');