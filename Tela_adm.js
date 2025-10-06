// =======================
// CONFIGURAÇÃO DO FIREBASE
// =======================
const firebaseConfig = {
    apiKey: "AIzaSyDENLJSPpFeeZAqSGW4QYw1rG7wUDoDPnA",
    authDomain: "bardof-c1b4d.firebaseapp.com",
    databaseURL: "https://bardof-c1b4d-default-rtdb.firebaseio.com",
    projectId: "bardof-c1b4d",
    storageBucket: "bardof-c1b4d.firebasestorage.app",
    messagingSenderId: "360363951793",
    appId: "1:360363951793:web:3d707868438ee651fa0490"
  };
  
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const storage = firebase.storage();
  
  // =======================
  // CADASTRAR NOVO PRATO
  // =======================
  async function cadastrarPrato(event) {
    event.preventDefault();
  
    const nome = document.getElementById('dish-name').value.trim();
    const descricao = document.getElementById('dish-description').value.trim();
    const preco = parseFloat(document.getElementById('dish-price').value);
    const imagemFile = document.getElementById('dish-image').files[0];
  
    if (!nome || !descricao || isNaN(preco) || !imagemFile) {
      alert("Por favor, preencha todos os campos corretamente!");
      return;
    }
  
    try {
      // 1️⃣ Faz upload da imagem
      const storageRef = storage.ref('pratos/' + imagemFile.name);
      await storageRef.put(imagemFile);
      const imagemURL = await storageRef.getDownloadURL();
  
      // 2️⃣ Salva os dados no Realtime Database
      const novoPratoRef = database.ref('pratos').push();
      await novoPratoRef.set({
        nome,
        descricao,
        preco,
        imagem: imagemURL
      });
  
      alert("✅ Prato cadastrado com sucesso!");
      document.querySelector("form").reset();
      carregarPratos();
    } catch (error) {
      console.error("Erro ao cadastrar prato:", error);
      alert("Erro ao cadastrar prato. Veja o console para detalhes.");
    }
  }
  
  // =======================
  // CARREGAR PRATOS
  // =======================
  function carregarPratos() {
    const lista = document.querySelector(".space-y-4");
    lista.innerHTML = "<p class='text-subtext-light dark:text-subtext-dark'>Carregando...</p>";
  
    database.ref('pratos').once('value')
      .then(snapshot => {
        const pratos = snapshot.val();
        lista.innerHTML = "";
  
        if (!pratos) {
          lista.innerHTML = "<p class='text-subtext-light dark:text-subtext-dark'>Nenhum prato cadastrado ainda.</p>";
          return;
        }
  
        Object.entries(pratos).forEach(([id, prato]) => {
          const item = document.createElement('div');
          item.classList.add('bg-card-light', 'dark:bg-card-dark', 'p-4', 'rounded-lg', 'flex', 'items-center', 'justify-between');
          item.innerHTML = `
            <div class="flex items-center space-x-4">
              <img src="${prato.imagem}" alt="${prato.nome}" class="w-16 h-16 rounded-md object-cover" />
              <div>
                <h3 class="font-semibold text-text-light dark:text-text-dark">${prato.nome}</h3>
                <p class="text-sm text-subtext-light dark:text-subtext-dark">R$ ${parseFloat(prato.preco).toFixed(2)}</p>
              </div>
            </div>
            <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400" onclick="removerPrato('${id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          `;
          lista.appendChild(item);
        });
      })
      .catch(error => {
        console.error("Erro ao carregar pratos:", error);
      });
  }
  
  // =======================
  // REMOVER PRATO
  // =======================
  function removerPrato(id) {
    if (confirm("Deseja realmente remover este prato?")) {
      database.ref('pratos/' + id).remove()
        .then(() => {
          alert("Prato removido com sucesso!");
          carregarPratos();
        })
        .catch(error => {
          console.error("Erro ao remover prato:", error);
        });
    }
  }
  
  // =======================
  // INICIALIZAÇÃO
  // =======================
  document.querySelector("form").addEventListener("submit", cadastrarPrato);
  window.onload = carregarPratos;
  