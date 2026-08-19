import "./sw.js"

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js');
  })
}

const STORAGE_KEY = "patrimonios";
let patrimonios = [];

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
  carregarPatrimonios();
  renderizarPatrimonios();

  document.getElementById('patrimonioForm').addEventListener('submit', adicionarPatrimonio);

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

//carrega patrimonios do localStorage
function carregarPatrimonios() {
  const dados = localStorage.getItem(STORAGE_KEY);
  patrimonios = dados ? JSON.parse(dados) : [];
}

//renderiza patrimonios na tela
function renderizarPatrimonios() {
  const lista = document.getElementById("patrimonioList");

  if (patrimonios.length === 0) {
    lista.innerHTML = '<p class="empty-message">Nenhum patrimônio registrado</p>'
    return;
  }

  lista.innerHTML = patrimonios.map(p => `
    <div class="patrimonio-item">
      <div>
        <img src="${p.image}" class="img-frame"/>
      </div>
      <div>
        <strong>${escapeHtml(p.nome)}</strong>
        <p>${escapeHtml(p.valor)}</p>
        <p>${escapeHtml(p.descricao)}</p>
        <div class="patrimonio-actions">

          <button class="btn btn-check ${p.conferido ? 'checked' : ''}" 
          onclick="alternarConferencia(${p.id})">
            ${p.conferido ? 'Conferido' : 'A Conferir'}
          </button>

          <button class="btn btn-delete" onclick="deletarPatrimonio(${p.id})">
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
function salvarPatrimonios() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patrimonios));
}

//adiciona novo registro !!!!!
function adicionarPatrimonio(e) {
  e.preventDefault();

  const nomeProduto = document.getElementById('nomeProduto').value.trim();
  const pathImage = document.getElementById('imagem').value.trim();
  const precoProduto = document.getElementById('precoProduto').value.trim();
  const descricao = document.getElementById('descricao').value.trim();

  if (!precoProduto || !descricao) {
    alert("Preencha todos os campos");
    return;
  }


  const novoPatrimonio = {
    id: Date.now(),
    nome: nomeProduto,
    valor: precoProduto,
    descricao: descricao,
    image: pathImage,
    conferido: false,
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    dataConferencia: null
  };

  patrimonios.push(novoPatrimonio)
  salvarPatrimonios();

  document.getElementById('patrimonioForm').reset();
  toggleFormSection();

  renderizarPatrimonios();

  mostrarNotificacao("Patrimônio Adicionado!");
}

function alternarConferencia(id) {
  const patrimonio = patrimonios.find(p => p.id === id);
  if (patrimonio) {
    patrimonio.conferido = !patrimonio.conferido;
    patrimonio.dataConferencia =
      patrimonio.conferido ? new Date().toLocaleDateString("pt-BR") : null;
    salvarPatrimonios();
    renderizarPatrimonios();

    const status = patrimonio.conferido ? 'conferido' : 'marcado como não conferido';
    mostrarNotificacao(`Patrimônio ${status}`);
  }
}

//deletar
function deletarPatrimonio(id) {
  if (confirm('Tem certeza que deseja apagar este patrimonio?')) {
    patrimonios = patrimonios.filter(p => p.id !== id);
    salvarPatrimonios();
    renderizarPatrimonios();

    mostrarNotificacao("Patrimônio removido com sucesso!");
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
window.deletarPatrimonio = deletarPatrimonio;