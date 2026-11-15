const instituicoes = window.ABRICIFE_INSTITUICOES || [];

const normalizar = valor =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const escapar = valor =>
  String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);

function cartao(instituicao) {
  return `
    <article class="institution-card">
      <div class="institution-image">
        <i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i>
      </div>

      <div class="institution-info">
        <span class="status unknown">
          ${escapar(instituicao.tipo)}
        </span>

        <h3>${escapar(instituicao.nome)}</h3>

        <p class="location">
          <i class="fa-solid fa-location-dot"></i>
          ${escapar(instituicao.bairro)}, Recife
        </p>

        <p>${escapar(instituicao.descricao)}</p>

        <a
          class="btn-detalhes"
          href="instituicao.html?id=${instituicao.id}"
        >
          Ver detalhes
        </a>
      </div>
    </article>
  `;
}

function iniciarCatalogo() {
  const lista = document.getElementById("lista-instituicoes");

  if (!lista) return;

  const nome = document.getElementById("search-name");
  const bairro = document.getElementById("search-region");
  const servico = document.getElementById("search-service");
  const feedback = document.getElementById("search-feedback");

  if (bairro) {
    const bairros = [...new Set(instituicoes.map(i => i.bairro))].sort();

    bairro.innerHTML =
      '<option value="">Todos os bairros</option>' +
      bairros.map(valor => `
        <option value="${escapar(valor)}">
          ${escapar(valor)}
        </option>
      `).join("");
  }

  if (servico) {
    const servicos = [
      ...new Set(instituicoes.flatMap(i => i.servicos))
    ].sort();

    servico.innerHTML =
      '<option value="">Todos os serviços</option>' +
      servicos.map(valor => `
        <option value="${escapar(valor)}">
          ${escapar(valor)}
        </option>
      `).join("");
  }

  function filtrar() {
    const encontrados = instituicoes.filter(instituicao =>
      normalizar(instituicao.nome).includes(normalizar(nome?.value)) &&
      (!bairro?.value || instituicao.bairro === bairro.value) &&
      (!servico?.value || instituicao.servicos.includes(servico.value))
    );

    lista.innerHTML = encontrados.length
      ? encontrados.map(cartao).join("")
      : '<p class="empty-message">Nenhuma instituição encontrada.</p>';

    if (feedback) {
      feedback.textContent =
        `${encontrados.length} local(is) encontrado(s). ` +
        "Informações públicas; não implica parceria com o ABRICIFE.";
    }
  }

  document.getElementById("search-form")?.addEventListener(
    "submit",
    evento => {
      evento.preventDefault();
      filtrar();

      document.getElementById("instituicoes")?.scrollIntoView({
        behavior: "smooth"
      });
    }
  );

  [nome, bairro, servico].forEach(elemento => {
    elemento?.addEventListener(
      elemento === nome ? "input" : "change",
      filtrar
    );
  });

  filtrar();
}

function iniciarDetalhe() {
  const alvo = document.getElementById("detalhe");

  if (!alvo) return;

  const id = Number(
    new URLSearchParams(location.search).get("id")
  );

  const instituicao = instituicoes.find(item => item.id === id);

  if (!instituicao) {
    alvo.innerHTML =
      '<p class="empty-message">Instituição não encontrada.</p>';
    return;
  }

  document.title = `${instituicao.nome} | ABRICIFE`;

  const mapa =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(instituicao.endereco);

  alvo.innerHTML = `
    <p class="section-label">${escapar(instituicao.tipo)}</p>
    <h1>${escapar(instituicao.nome)}</h1>
    <p>${escapar(instituicao.descricao)}</p>

    <h2>Informações</h2>

    <p>
      <strong>Endereço:</strong>
      ${escapar(instituicao.endereco)}
    </p>

    <p>
      <strong>Serviços:</strong>
      ${instituicao.servicos.map(escapar).join(", ")}
    </p>

    ${instituicao.telefone ? `
      <p>
        <strong>Contato público:</strong>
        ${escapar(instituicao.telefone)}
      </p>
    ` : ""}

    <p class="notice">
      ${escapar(instituicao.observacao)}
      Confirme informações e disponibilidade diretamente
      com o responsável.
    </p>

    <div class="detail-actions">
      <a
        class="btn-primary"
        href="${escapar(instituicao.fonte)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Fonte oficial
      </a>

      <a
        class="btn-secondary"
        href="${mapa}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ver no mapa
      </a>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");
  const toggle = document.getElementById("menu-toggle");

  toggle?.addEventListener("click", () => {
    const aberto = menu?.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(!!aberto));
  });

  iniciarCatalogo();
  iniciarDetalhe();
});