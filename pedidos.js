// pedidos.js - Sistema Simples de Pedidos
import { db } from './firebaseconfig.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// ========================================
// PROTEÇÃO: VERIFICA SE ESTÁ LOGADO
// ========================================
if (!window.auth?.estaLogado()) {
    alert('⚠️ Você precisa estar logado para ver seus pedidos!');
    window.location.href = 'login.html';
    throw new Error('Não autorizado');
}

const usuarioLogado = auth.getUsuarioLogado();
console.log('👤 Usuário:', usuarioLogado.nome);

// ========================================
// REFERÊNCIAS DO DOM
// ========================================
const pedidosContainer = document.getElementById('pedidos-container');

// ========================================
// GERAR NÚMERO DO PEDIDO (3 DÍGITOS)
// ========================================
function gerarNumeroPedido(pedidoId) {
    // Cria um número único de 3 dígitos baseado no ID
    const hash = pedidoId.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
    }, 0);
    
    return ((hash % 900) + 100).toString();
}

// ========================================
// FORMATAR HORÁRIO
// ========================================
function formatarHorario(timestamp) {
    const data = new Date(timestamp);
    return data.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// ========================================
// MARCAR COMO VISUALIZADO
// ========================================
async function marcarVisualizado(pedidoId) {
    try {
        const pedidoRef = ref(db, `pedidos/${pedidoId}`);
        await update(pedidoRef, {
            visualizado: true,
            dataVisualizacao: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao marcar:', error);
    }
}

// ========================================
// CRIAR CARD SIMPLES DO PEDIDO
// ========================================
function criarCardPedido(pedido, pedidoId) {
    const numero = gerarNumeroPedido(pedidoId);
    const horario = pedido.horarioRetirada || formatarHorario(pedido.timestamp);
    const visualizado = pedido.visualizado || false;
    
    const card = document.createElement('div');
    card.className = `bg-white dark:bg-zinc-800/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer ${!visualizado ? 'border-4 border-primary' : 'border border-zinc-200 dark:border-zinc-700'}`;
    
    // Marca como visualizado ao clicar
    card.addEventListener('click', () => {
        if (!visualizado) {
            marcarVisualizado(pedidoId);
        }
    });
    
    card.innerHTML = `
        <!-- Badge NOVO -->
        ${!visualizado ? `
            <div class="mb-4">
                <span class="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    NOVO PEDIDO
                </span>
            </div>
        ` : ''}
        
        <!-- Número do Pedido -->
        <div class="text-center mb-6">
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Número do Pedido</p>
            <div class="text-6xl font-bold text-primary">
                ${numero}
            </div>
        </div>
        
        <!-- Horário de Preparo-->
        <div class="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 mb-4">
            <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Horário de Preparo</p>
            <p class="text-2xl font-bold text-background-dark dark:text-background-light">
                ${horario}
            </p>
        </div>
        
        <!-- Lista de Pratos -->
        <div class="space-y-2">
            <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Seus pedidos:</p>
            ${pedido.items.map(item => `
                <div class="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-700 last:border-0">
                    <span class="text-background-dark dark:text-background-light">
                        <span class="font-semibold">${item.quantidade}x</span> ${item.nome}
                    </span>
                </div>
            `).join('')}
        </div>
        
        <!-- Instruções -->
        <div class="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <p class="text-center text-sm text-zinc-500 dark:text-zinc-400">
                ${visualizado 
                    ? '✓ Pedido Feito' 
                    : 'Apresente este número no balcão'
                }
            </p>
        </div>
    `;
    
    return card;
}

// ========================================
// CARREGAR PEDIDOS
// ========================================
function carregarPedidos() {
    const pedidosRef = ref(db, 'pedidos');
    
    onValue(pedidosRef, (snapshot) => {
        pedidosContainer.innerHTML = '';
        
        if (!snapshot.exists()) {
            mostrarMensagemVazia();
            return;
        }
        
        // Filtra apenas pedidos do usuário logado
        const meusPedidos = [];
        snapshot.forEach((childSnapshot) => {
            const pedido = childSnapshot.val();
            
            // Verifica se o pedido pertence ao usuário
            const pertenceAoUsuario = 
                pedido.usuarioId === usuarioLogado.id ||
                pedido.usuarioEmail === usuarioLogado.email ||
                pedido.usuarioNome === usuarioLogado.nome;
            
            if (pertenceAoUsuario) {
                meusPedidos.push({
                    id: childSnapshot.key,
                    ...pedido
                });
            }
        });
        
        // Se não tem pedidos
        if (meusPedidos.length === 0) {
            mostrarMensagemVazia();
            return;
        }
        
        // Ordena por data (mais recentes primeiro)
        meusPedidos.sort((a, b) => {
            const dataA = a.timestamp || new Date(a.dataPedido).getTime();
            const dataB = b.timestamp || new Date(b.dataPedido).getTime();
            return dataB - dataA;
        });
        
        // Cria os cards
        meusPedidos.forEach(pedido => {
            const card = criarCardPedido(pedido, pedido.id);
            pedidosContainer.appendChild(card);
        });
        
        // Conta não visualizados
        const novos = meusPedidos.filter(p => !p.visualizado).length;
        console.log(`📋 ${meusPedidos.length} pedidos (${novos} novos)`);
    });
}

// ========================================
// MENSAGEM VAZIA
// ========================================
function mostrarMensagemVazia() {
    pedidosContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <div class="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48" xmlns="http://www.w3.org/2000/svg" class="text-primary">
                    <path d="M216,40H40A16,16,0,0,0,24,56V208a8,8,0,0,0,11.58,7.15L64,200.94l28.42,14.21a8,8,0,0,0,7.16,0L128,200.94l28.42,14.21a8,8,0,0,0,7.16,0L192,200.94l28.42,14.21A8,8,0,0,0,232,208V56A16,16,0,0,0,216,40ZM176,144H80a8,8,0,0,1,0-16h96a8,8,0,0,1,0,16Zm0-32H80a8,8,0,0,1,0-16h96a8,8,0,0,1,0,16Z"></path>
                </svg>
            </div>
            <h2 class="text-xl font-bold text-background-dark dark:text-background-light mb-2">
                Nenhum pedido ainda
            </h2>
            <p class="text-zinc-500 dark:text-zinc-400 mb-6">
                Faça seu primeiro pedido e acompanhe aqui!
            </p>
            <button 
                onclick="window.location.href='index.html'" 
                class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
                Ver Cardápio
            </button>
        </div>
    `;
}

// ========================================
// INICIALIZA
// ========================================
carregarPedidos();

console.log('✅ Sistema de pedidos carregado!');