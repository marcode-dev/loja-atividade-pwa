import "./sw.js"

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  })
}

const STORAGE_KEY = "produto";
let produto = [];

let deferredPrompt = null;

window.addEventListener('beforeInstallPrompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;

  const installButton = document.getElementById('installBtn');
  if (installButton) {
    installButton.hidden = false;
  }
});

// Carregando...
document.addEventListener('DOMContentLoaded', () => {
  carregarProduto();
  renderizarProduto();

  document.getElementById('produtoForm').addEventListener('submit', adicionarProduto);

  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    })
  }
})

//carrega produto do localStorage
function carregarProduto() {
  const dados = localStorage.getItem(STORAGE_KEY);
  produto = dados ? JSON.parse(dados) : [];
}

//renderiza produto na tela
function renderizarProduto() {
  const lista = document.getElementById("produtoList");

  if (produto.length === 0) {
    lista.innerHTML = '<p class="empty-message">Nenhum Produto registrado</p>'
    return;
  }

  lista.innerHTML = produto.map(p => `
    <div class="produto-item">
      <div>
        <img src="${p.image}" class="img-frame"/>
      </div>
      <div class="complete">
        <strong>${escapeHtml(p.nome)}</strong>
        <p>${escapeHtml(p.valor)}</p>
        <p>${escapeHtml(p.descricao)}</p>
        <div class="produto-actions">

          <button class="btn btn-check ${p.conferido ? 'checked' : ''}" 
          onclick="alternarConferencia(${p.id})">
            ${p.conferido ? 'Conferido' : 'A Conferir'}
          </button>

          <button class="btn btn-delete" onclick="deletarProduto(${p.id})">
          Remover
          </button>
        </div>
      </div>
      
    </div>
    `).join('');
}

//alternar TOGGLE
function toggleFormSection() {
  const formSection = document.getElementById('formSection');
  formSection.classList.toggle('visible');

  if (formSection.classList.contains('visible')) {
    document.getElementById('precoProduto').focus();
  }
}

//Notificação temporária
function mostrarNotificacao(mensagem) {
  const el = document.createElement('div');
  el.textContent = mensagem;
  el.className = 'toast';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

//grava no localStorage
function salvarProduto() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(produto));
}

//adiciona novo registro !!!!!
function adicionarProduto(e) {
  e.preventDefault();

  const nomeProduto = document.getElementById('nomeProduto').value.trim();
  const pathImage = document.getElementById('imagem').value.trim();
  const precoProduto = document.getElementById('precoProduto').value.trim();
  const descricao = document.getElementById('descricao').value.trim();

  if (!precoProduto || !descricao) {
    alert("Preencha todos os campos");
    return;
  }


  const novoproduto = {
    id: Date.now(),
    nome: nomeProduto,
    valor: precoProduto,
    descricao: descricao,
    image: pathImage,
    conferido: false,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    dataConferencia: null
  };

  produto.push(novoproduto)
  salvarProduto();

  document.getElementById('produtoForm').reset();
  toggleFormSection();

  renderizarProduto();

  mostrarNotificacao("Produto Adicionado!");
}

function alternarConferencia(id) {
  const produto = produto.find(p => p.id === id);
  if (produto) {
    produto.conferido = !produto.conferido;
    produto.dataConferencia =
      produto.conferido ? new Date().toLocaleDateString("pt-BR") : null;
    salvarProduto();
    renderizarProduto();

    const status = produto.conferido ? 'conferido' : 'marcado como não conferido';
    mostrarNotificacao(`Produto ${status}`);
  }
}

//deletar
function deletarProduto(id) {
  if (confirm('Tem certeza que deseja apagar este produto?')) {
    produto = produto.filter(p => p.id !== id);
    salvarProduto();
    renderizarProduto();

    mostrarNotificacao("Produto removido com sucesso!");
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Expor funções usadas por atributos `onclick` quando o script é carregado como módulo
window.toggleFormSection = toggleFormSection;
window.alternarConferencia = alternarConferencia;
window.deletarProduto = deletarProduto;