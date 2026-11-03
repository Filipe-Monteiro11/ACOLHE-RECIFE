const necessidades = [
  {
    id: 1,
    instituicaoId: 1,
    instituicao: "Centro Esperança",
    bairro: "Boa Vista",
    categoria: "Alimentos",
    prioridade: "Alta",
    itens: ["Arroz", "Feijão", "Leite em pó"],
    descricao: "Necessidade demonstrativa de alimentos não perecíveis."
  },
  {
    id: 2,
    instituicaoId: 2,
    instituicao: "Casa de Apoio Solidário",
    bairro: "Santo Amaro",
    categoria: "Higiene",
    prioridade: "Alta",
    itens: ["Sabonete", "Creme dental", "Papel higiênico"],
    descricao: "Itens básicos de higiene para atividades de acolhimento."
  },
  {
    id: 3,
    instituicaoId: 3,
    instituicao: "Instituto Novos Caminhos",
    bairro: "Imbiribeira",
    categoria: "Voluntariado",
    prioridade: "Média",
    itens: ["Apoio em oficinas", "Atividades educativas"],
    descricao: "Participação voluntária em atividades comunitárias."
  },
  {
    id: 4,
    instituicaoId: 4,
    instituicao: "Rede Mãos Amigas",
    bairro: "Cordeiro",
    categoria: "Roupas",
    prioridade: "Média",
    itens: ["Camisetas", "Calças", "Agasalhos"],
    descricao: "Arrecadação demonstrativa de roupas em boas condições."
  },
  {
    id: 5,
    instituicaoId: 5,
    instituicao: "Espaço Recomeçar",
    bairro: "Boa Viagem",
    categoria: "Outros",
    prioridade: "Baixa",
    itens: ["Cadernos", "Lápis", "Mochilas"],
    descricao: "Materiais escolares para atividades socioeducativas."
  },
  {
    id: 6,
    instituicaoId: 6,
    instituicao: "Projeto Viver Melhor",
    bairro: "Casa Amarela",
    categoria: "Alimentos",
    prioridade: "Alta",
    itens: ["Macarrão", "Óleo", "Farinha"],
    descricao: "Doações demonstrativas para ações de assistência alimentar."
  }
];

const formulario = document.getElementById("donation-search-form");
const campoBusca = document.getElementById("donation-search");
const campoCategoria = document.getElementById("donation-category");
const campoRegiao = document.getElementById("donation-region");

const lista = document.getElementById("donation-institution-list");
const contador = document.getElementById("donation-results-count");
const limparFiltros = document.getElementById("donation-clear-filters");

const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");

const iconesCategoria = {
  Alimentos: "fa-basket-shopping",
  Roupas: "fa-shirt",
  Higiene: "fa-pump-soap",
  Voluntariado: "fa-people-group",
  Outros: "fa-box-open"
};

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarElemento(tag, classe = "", texto = "") {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  elemento.textContent = texto;
  return elemento;
}

function preencherBairros() {
  const bairros = [...new Set(necessidades.map(item => item.bairro))].sort();

  bairros.forEach(bairro => {
    campoRegiao.add(new Option(bairro, bairro));
  });
}

function criarCard(necessidade) {
  const card = criarElemento("article", "donation-institution-card");

  const topo = criarElemento("div", "donation-card-top");
  const categoria = criarElemento("span", "donation-card-category");

  const icone = criarElemento(
    "i",
    `fa-solid ${iconesCategoria[necessidade.categoria] || "fa-box-open"}`
  );

  categoria.append(
    icone,
    document.createTextNode(` ${necessidade.categoria}`)
  );

  const prioridadeClasse = {
    Alta: "high",
    Média: "medium",
    Baixa: "low"
  }[necessidade.prioridade] || "low";

  const prioridade = criarElemento(
    "span",
    `donation-priority ${prioridadeClasse}`,
    `Prioridade ${necessidade.prioridade}`
  );

  topo.append(categoria, prioridade);

  const conteudo = criarElemento("div", "donation-card-content");

  const nome = criarElemento("h3", "", necessidade.instituicao);

  const localizacao = criarElemento("p", "donation-card-location");
  const iconeLocal = criarElemento("i", "fa-solid fa-location-dot");

  localizacao.append(
    iconeLocal,
    document.createTextNode(` ${necessidade.bairro}, Recife - PE`)
  );

  const tituloItens = criarElemento("h4", "", "O que precisa:");

  const itens = criarElemento("div", "donation-items");

  necessidade.itens.forEach(item => {
    itens.appendChild(
      criarElemento("span", "donation-item", item)
    );
  });

  const descricao = criarElemento(
    "p",
    "donation-card-description",
    necessidade.descricao
  );

  const botao = criarElemento(
    "a",
    "donation-card-button",
    "Conhecer instituição"
  );

  botao.href =
    `instituicao.html?id=${encodeURIComponent(necessidade.instituicaoId)}`;

  const seta = criarElemento("i", "fa-solid fa-arrow-right");
  botao.appendChild(seta);

  conteudo.append(
    nome,
    localizacao,
    tituloItens,
    itens,
    descricao,
    botao
  );

  card.append(topo, conteudo);

  return card;
}

function renderizarNecessidades(dados) {
  lista.replaceChildren();

  if (!dados.length) {
    const vazio = criarElemento("div", "donation-empty");

    vazio.append(
      criarElemento("i", "fa-solid fa-magnifying-glass"),
      criarElemento("h3", "", "Nenhum resultado encontrado"),
      criarElemento(
        "p",
        "",
        "Tente pesquisar por outro termo ou alterar os filtros."
      )
    );

    lista.appendChild(vazio);
    return;
  }

  const fragmento = document.createDocumentFragment();

  dados.forEach(necessidade => {
    fragmento.appendChild(criarCard(necessidade));
  });

  lista.appendChild(fragmento);
}

function filtrarNecessidades(evento) {
  if (evento) {
    evento.preventDefault();
  }

  const busca = normalizar(campoBusca.value);
  const categoria = normalizar(campoCategoria.value);
  const regiao = normalizar(campoRegiao.value);

  const resultados = necessidades.filter(necessidade => {
    const texto = normalizar([
      necessidade.instituicao,
      necessidade.bairro,
      necessidade.categoria,
      necessidade.descricao,
      ...necessidade.itens
    ].join(" "));

    const correspondeBusca = !busca || texto.includes(busca);

    const correspondeCategoria =
      !categoria || normalizar(necessidade.categoria) === categoria;

    const correspondeRegiao =
      !regiao || normalizar(necessidade.bairro) === regiao;

    return (
      correspondeBusca &&
      correspondeCategoria &&
      correspondeRegiao
    );
  });

  renderizarNecessidades(resultados);

  contador.textContent =
    `${resultados.length} oportunidade(s) de ajuda encontrada(s).`;

  if (evento?.type === "submit") {
    document.getElementById("necessidades").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function configurarFormasDeAjuda() {
  document.querySelectorAll("[data-category]").forEach(botao => {
    botao.addEventListener("click", () => {
      campoBusca.value = "";
      campoRegiao.value = "";
      campoCategoria.value = botao.dataset.category;

      filtrarNecessidades();

      document.getElementById("necessidades").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function configurarBusca() {
  formulario.addEventListener("submit", filtrarNecessidades);

  campoCategoria.addEventListener("change", filtrarNecessidades);
  campoRegiao.addEventListener("change", filtrarNecessidades);

  limparFiltros.addEventListener("click", () => {
    formulario.reset();
    filtrarNecessidades();
  });
}

function configurarMenu() {
  if (!menu || !menuToggle) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const aberto = menu.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(aberto));
    menuToggle.setAttribute(
      "aria-label",
      aberto ? "Fechar menu" : "Abrir menu"
    );

    const icone = menuToggle.querySelector("i");

    if (icone) {
      icone.className = aberto
        ? "fa-solid fa-xmark"
        : "fa-solid fa-bars";
    }
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");

      const icone = menuToggle.querySelector("i");

      if (icone) {
        icone.className = "fa-solid fa-bars";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  preencherBairros();
  configurarBusca();
  configurarFormasDeAjuda();
  configurarMenu();
  filtrarNecessidades();
});