const instituicoes = [
  {
    id: 1,
    nome: "Centro Esperança",
    bairro: "Boa Vista",
    endereco: "Boa Vista, Recife - PE",
    descricao: "Espaço demonstrativo de acolhimento e apoio a pessoas em situação de vulnerabilidade.",
    servicos: ["Acolhimento", "Alimentação", "Psicossocial"]
  },
  {
    id: 2,
    nome: "Casa de Apoio Solidário",
    bairro: "Santo Amaro",
    endereco: "Santo Amaro, Recife - PE",
    descricao: "Instituição fictícia voltada ao apoio social, alimentação e cuidados básicos.",
    servicos: ["Alimentação", "Higiene", "Saúde"]
  },
  {
    id: 3,
    nome: "Instituto Novos Caminhos",
    bairro: "Imbiribeira",
    endereco: "Imbiribeira, Recife - PE",
    descricao: "Projeto demonstrativo que oferece orientação e atividades de desenvolvimento social.",
    servicos: ["Psicossocial", "Oficinas", "Acolhimento"]
  },
  {
    id: 4,
    nome: "Rede Mãos Amigas",
    bairro: "Cordeiro",
    endereco: "Cordeiro, Recife - PE",
    descricao: "Rede fictícia de apoio comunitário com serviços de assistência e alimentação.",
    servicos: ["Alimentação", "Higiene"]
  },
  {
    id: 5,
    nome: "Espaço Recomeçar",
    bairro: "Boa Viagem",
    endereco: "Boa Viagem, Recife - PE",
    descricao: "Espaço demonstrativo de acolhimento, escuta e encaminhamento social.",
    servicos: ["Acolhimento", "Psicossocial", "Saúde"]
  },
  {
    id: 6,
    nome: "Projeto Viver Melhor",
    bairro: "Casa Amarela",
    endereco: "Casa Amarela, Recife - PE",
    descricao: "Instituição fictícia dedicada à assistência comunitária e atividades educativas.",
    servicos: ["Oficinas", "Alimentação", "Psicossocial"]
  }
];

const formulario = document.getElementById("help-search-form");
const campoNome = document.getElementById("help-search-name");
const campoRegiao = document.getElementById("help-search-region");
const campoServico = document.getElementById("help-search-service");
const lista = document.getElementById("help-institution-list");
const contador = document.getElementById("results-count");
const limparFiltros = document.getElementById("clear-filters");
const filtrosRapidos = document.querySelectorAll(".filter-chip");

const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");

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

function preencherFiltros() {
  const bairros = [...new Set(instituicoes.map(item => item.bairro))].sort();
  const servicos = [...new Set(instituicoes.flatMap(item => item.servicos))].sort();

  bairros.forEach(bairro => {
    const opcao = new Option(bairro, bairro);
    campoRegiao.add(opcao);
  });

  servicos.forEach(servico => {
    const opcao = new Option(servico, servico);
    campoServico.add(opcao);
  });
}

function criarCard(instituicao) {
  const card = criarElemento("article", "institution-card");

  const imagem = criarElemento("div", "institution-image");
  imagem.setAttribute("aria-hidden", "true");

  const icone = criarElemento("i", "fa-solid fa-building");
  imagem.appendChild(icone);

  const info = criarElemento("div", "institution-info");

  const status = criarElemento(
    "span",
    "status unknown",
    "Atendimento a confirmar"
  );

  const nome = criarElemento("h3", "", instituicao.nome);

  const endereco = criarElemento("p", "location");
  const iconeLocal = criarElemento("i", "fa-solid fa-location-dot");

  endereco.append(
    iconeLocal,
    document.createTextNode(` ${instituicao.endereco}`)
  );

  const descricao = criarElemento(
    "p",
    "institution-description",
    instituicao.descricao
  );

  const tags = criarElemento("div", "help-service-tags");

  instituicao.servicos.forEach(servico => {
    tags.appendChild(
      criarElemento("span", "help-service-tag", servico)
    );
  });

  const detalhes = criarElemento(
    "a",
    "btn-detalhes",
    "Ver detalhes"
  );

  detalhes.href = `instituicao.html?id=${encodeURIComponent(instituicao.id)}`;

  info.append(status, nome, endereco, descricao, tags, detalhes);
  card.append(imagem, info);

  return card;
}

function renderizarInstituicoes(dados) {
  lista.replaceChildren();

  if (!dados.length) {
    const vazio = criarElemento("div", "help-empty");

    const icone = criarElemento(
      "i",
      "fa-solid fa-magnifying-glass"
    );

    const titulo = criarElemento(
      "h3",
      "",
      "Nenhuma instituição encontrada"
    );

    const descricao = criarElemento(
      "p",
      "",
      "Tente alterar os filtros ou pesquisar por outro serviço."
    );

    vazio.append(icone, titulo, descricao);
    lista.appendChild(vazio);
    return;
  }

  const fragmento = document.createDocumentFragment();

  dados.forEach(instituicao => {
    fragmento.appendChild(criarCard(instituicao));
  });

  lista.appendChild(fragmento);
}

function atualizarFiltrosRapidos() {
  const selecionado = normalizar(campoServico.value);

  filtrosRapidos.forEach(botao => {
    const ativo = normalizar(botao.dataset.service) === selecionado;

    botao.classList.toggle("active", ativo);
    botao.setAttribute("aria-pressed", String(ativo));
  });
}

function filtrarInstituicoes(evento) {
  if (evento) {
    evento.preventDefault();
  }

  const busca = normalizar(campoNome.value);
  const regiao = normalizar(campoRegiao.value);
  const servico = normalizar(campoServico.value);

  const resultados = instituicoes.filter(instituicao => {
    const texto = normalizar([
      instituicao.nome,
      instituicao.descricao,
      instituicao.bairro,
      ...instituicao.servicos
    ].join(" "));

    const correspondeBusca = !busca || texto.includes(busca);
    const correspondeRegiao =
      !regiao || normalizar(instituicao.bairro) === regiao;

    const correspondeServico =
      !servico || instituicao.servicos.some(
        item => normalizar(item) === servico
      );

    return (
      correspondeBusca &&
      correspondeRegiao &&
      correspondeServico
    );
  });

  renderizarInstituicoes(resultados);
  atualizarFiltrosRapidos();

  contador.textContent =
    `${resultados.length} instituição(ões) encontrada(s).`;

  if (evento?.type === "submit") {
    document.getElementById("resultados").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function configurarFiltros() {
  formulario.addEventListener("submit", filtrarInstituicoes);

  campoRegiao.addEventListener("change", filtrarInstituicoes);
  campoServico.addEventListener("change", filtrarInstituicoes);

  filtrosRapidos.forEach(botao => {
    botao.addEventListener("click", () => {
      campoServico.value = botao.dataset.service;
      filtrarInstituicoes();
    });
  });

  limparFiltros.addEventListener("click", () => {
    formulario.reset();
    filtrarInstituicoes();
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
  preencherFiltros();
  configurarFiltros();
  configurarMenu();
  filtrarInstituicoes();
});