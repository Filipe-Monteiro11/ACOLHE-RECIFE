const AJUDA_PADRAO = "Entre em contato com a instituição para saber como doar ou ser voluntário.";

// DADOS FICTÍCIOS (iguais aos da página Instituições)
const instituicoes = [
  { id: 1, nome: "Casa Esperança", bairro: "Boa Vista", tipo: "ONG",
    descricao: "Abrigo temporário com pernoite, refeições e orientação para retomada de documentos.",
    publico: "Adultos em situação de rua",
    servicos: ["Acolhimento", "Alimentação", "Higiene"],
    endereco: "Rua das Acácias, 120", horario: "Todos os dias, 24 horas", telefones: ["(81) 90000-0001"],
    comoAjudar: "Aceita doações de roupas, cobertores e produtos de higiene, de segunda a sexta, das 9h às 16h. Voluntários ajudam no jantar e na triagem de doações." },
  { id: 2, nome: "Refeitório Pão Partilhado", bairro: "Santo Amaro", tipo: "Associação comunitária",
    descricao: "Almoço e jantar diários, abertos a qualquer pessoa em situação de vulnerabilidade.",
    publico: "Qualquer pessoa em vulnerabilidade, sem cadastro",
    servicos: ["Alimentação"],
    endereco: "Avenida dos Ipês, 450", horario: "Almoço 11h30 às 13h30 e jantar 18h às 19h30", telefones: ["(81) 90000-0002"],
    comoAjudar: "Recebe alimentos não perecíveis e precisa de voluntários para cozinhar e servir, principalmente aos fins de semana." },
  { id: 3, nome: "Centro de Apoio Maré Viva", bairro: "Imbiribeira", tipo: "ONG",
    descricao: "Atendimento psicossocial, grupos de escuta e encaminhamento para a rede de saúde.",
    publico: "Adultos e jovens a partir de 16 anos",
    servicos: ["Psicossocial", "Saúde"],
    endereco: "Rua do Farol, 88", horario: "Segunda a sexta, 8h às 17h", telefones: ["(81) 90000-0003"],
    comoAjudar: "Psicólogos e assistentes sociais podem se voluntariar para os grupos de escuta. Também aceita doações em dinheiro." },
  { id: 4, nome: "Espaço Recomeço", bairro: "Cordeiro", tipo: "Instituição filantrópica",
    descricao: "Oficinas de geração de renda e acolhimento para pessoas em reinserção social.",
    publico: "Adultos em reinserção social",
    servicos: ["Oficinas", "Acolhimento"],
    endereco: "Rua das Palmeiras, 300", horario: "Segunda a sábado, 8h às 18h", telefones: ["(81) 90000-0004"],
    comoAjudar: "Procura instrutores voluntários para oficinas de costura, panificação e informática, além de doações de máquinas e materiais." },
  { id: 5, nome: "Ponto de Higiene Dignidade", bairro: "Boa Vista", tipo: "Projeto social",
    descricao: "Banho, troca de roupas, kit de higiene e lavanderia solidária.",
    publico: "Pessoas em situação de rua",
    servicos: ["Higiene"],
    endereco: "Praça da Estação, 15", horario: "Terça a sábado, 8h às 14h", telefones: ["(81) 90000-0005"],
    comoAjudar: "Doações de toalhas, sabonetes, escovas de dente e roupas íntimas novas são sempre bem-vindas." },
  { id: 6, nome: "Abrigo Frei Caneca", bairro: "Santo Amaro", tipo: "Serviço público municipal",
    descricao: "Acolhimento 24 horas para adultos, com refeições e acompanhamento social.",
    publico: "Adultos, homens e mulheres",
    servicos: ["Acolhimento", "Alimentação", "Psicossocial"],
    endereco: "Rua Frei Caneca, 700", horario: "Todos os dias, 24 horas", telefones: ["(81) 90000-0006"],
    comoAjudar: "As doações devem ser entregues na recepção, das 8h às 17h. Não há cadastro de voluntários no momento." },
  { id: 7, nome: "Clínica Solidária Cuidar", bairro: "Imbiribeira", tipo: "Clínica filantrópica",
    descricao: "Consultas básicas, aferição de pressão, curativos e distribuição de medicamentos.",
    publico: "Pessoas sem plano de saúde",
    servicos: ["Saúde", "Higiene"],
    endereco: "Avenida Mar Azul, 1020", horario: "Segunda a sexta, 7h às 15h", telefones: ["(81) 90000-0007"],
    comoAjudar: "Aceita medicamentos dentro da validade e materiais de curativo. Profissionais de saúde podem se voluntariar aos sábados." },
  { id: 8, nome: "Casa Mãos Abertas", bairro: "Cordeiro", tipo: "ONG",
    descricao: "Acolhimento de mulheres e crianças, com apoio psicológico e oficinas.",
    publico: "Mulheres e seus filhos",
    servicos: ["Acolhimento", "Psicossocial", "Oficinas"],
    endereco: "Rua dos Girassóis, 45", horario: "Todos os dias, 24 horas", telefones: ["(81) 90000-0008"],
    aviso: "Por segurança, o endereço completo é informado após o primeiro contato.",
    comoAjudar: "Precisa de fraldas, material escolar e roupas infantis. Voluntárias ajudam com reforço escolar e brincadeiras." },
  { id: 9, nome: "Cozinha Comunitária Sabor da Rua", bairro: "Boa Vista", tipo: "Coletivo de voluntários",
    descricao: "Refeições quentes à noite e cestas básicas para famílias cadastradas.",
    publico: "Pessoas em situação de rua e famílias cadastradas",
    servicos: ["Alimentação"],
    endereco: "Rua da Aurora, 210", horario: "Segunda a sábado, 18h às 21h", telefones: ["(81) 90000-0009"],
    comoAjudar: "Aceita arroz, feijão, óleo e legumes. Voluntários podem ajudar a cozinhar ou a distribuir marmitas à noite." }
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

/* ---------- Utilitários ---------- */
function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarElemento(tag, classe = "", texto = "") {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

function telHref(telefone) {
  return "tel:+55" + telefone.replace(/\D/g, "");
}

/* ---------- Filtros ---------- */
function preencherFiltros() {
  const bairros = [...new Set(instituicoes.map(item => item.bairro))].sort();
  const servicos = [...new Set(instituicoes.flatMap(item => item.servicos))].sort();

  bairros.forEach(bairro => campoRegiao.add(new Option(bairro, bairro)));
  servicos.forEach(servico => campoServico.add(new Option(servico, servico)));
}

/* ---------- Cards ---------- */
function criarCard(instituicao) {
  const card = criarElemento("article", "institution-card");

  const imagem = criarElemento("div", "institution-image");
  imagem.setAttribute("aria-hidden", "true");
  imagem.appendChild(criarElemento("i", "fa-solid fa-building"));

  const info = criarElemento("div", "institution-info");

  const status = criarElemento("span", "status unknown", "Atendimento a confirmar");
  const nome = criarElemento("h3", "", instituicao.nome);

  const endereco = criarElemento("p", "location");
  endereco.append(
    criarElemento("i", "fa-solid fa-location-dot"),
    document.createTextNode(` ${instituicao.bairro}, Recife - PE`)
  );

  const descricao = criarElemento("p", "institution-description", instituicao.descricao);

  const tags = criarElemento("div", "help-service-tags");
  instituicao.servicos.forEach(servico => {
    tags.appendChild(criarElemento("span", "help-service-tag", servico));
  });

  const detalhes = criarElemento("button", "btn-detalhes", "Ver detalhes");
  detalhes.type = "button";
  detalhes.dataset.detalhes = instituicao.id;
  detalhes.setAttribute("aria-label", `Ver detalhes de ${instituicao.nome}`);

  info.append(status, nome, endereco, descricao, tags, detalhes);
  card.append(imagem, info);

  return card;
}

function renderizarInstituicoes(dados) {
  lista.replaceChildren();

  if (!dados.length) {
    const vazio = criarElemento("div", "help-empty");
    vazio.append(
      criarElemento("i", "fa-solid fa-magnifying-glass"),
      criarElemento("h3", "", "Nenhuma instituição encontrada"),
      criarElemento("p", "", "Tente alterar os filtros ou pesquisar por outro serviço.")
    );
    lista.appendChild(vazio);
    return;
  }

  const fragmento = document.createDocumentFragment();
  dados.forEach(instituicao => fragmento.appendChild(criarCard(instituicao)));
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
  if (evento) evento.preventDefault();

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
    const correspondeRegiao = !regiao || normalizar(instituicao.bairro) === regiao;
    const correspondeServico =
      !servico || instituicao.servicos.some(item => normalizar(item) === servico);

    return correspondeBusca && correspondeRegiao && correspondeServico;
  });

  renderizarInstituicoes(resultados);
  atualizarFiltrosRapidos();

  contador.textContent = `${resultados.length} instituição(ões) encontrada(s).`;

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

/* ---------- Janela "Ver detalhes" ---------- */
const modal = criarElemento("div", "help-modal");
modal.hidden = true;

let ultimoFoco = null;
const FOCAVEIS = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function criarLinhaModal(icone, rotulo, conteudo) {
  const linha = criarElemento("div", "help-modal__row");

  const dt = criarElemento("dt");
  dt.append(
    criarElemento("i", `fa-solid ${icone}`),
    document.createTextNode(` ${rotulo}`)
  );
  dt.firstChild.setAttribute("aria-hidden", "true");

  const dd = criarElemento("dd");
  if (typeof conteudo === "string") {
    dd.textContent = conteudo;
  } else {
    dd.append(...conteudo);
  }

  linha.append(dt, dd);
  return linha;
}

function criarBotaoLink(classe, icone, texto, href, externo = false) {
  const link = criarElemento("a", classe);
  link.href = href;
  if (externo) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  const i = criarElemento("i", `fa-solid ${icone}`);
  i.setAttribute("aria-hidden", "true");
  link.append(i, document.createTextNode(` ${texto}`));
  return link;
}

function montarModal(inst) {
  const painel = criarElemento("div", "help-modal__panel");
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-labelledby", "help-modal-titulo");
  painel.tabIndex = -1;

  const fechar = criarElemento("button", "help-modal__close");
  fechar.type = "button";
  fechar.dataset.fechar = "";
  fechar.setAttribute("aria-label", "Fechar detalhes");
  const iconeFechar = criarElemento("i", "fa-solid fa-xmark");
  iconeFechar.setAttribute("aria-hidden", "true");
  fechar.appendChild(iconeFechar);

  const tipo = criarElemento("p", "help-modal__tipo", inst.tipo);
  const titulo = criarElemento("h2", "", inst.nome);
  titulo.id = "help-modal-titulo";
  const desc = criarElemento("p", "help-modal__desc", inst.descricao);

  const tags = criarElemento("ul", "help-service-tags");
  tags.setAttribute("aria-label", "Serviços oferecidos");
  inst.servicos.forEach(s => tags.appendChild(criarElemento("li", "help-service-tag", s)));

  // Telefones
  const telefones = [];
  inst.telefones.forEach((t, indice) => {
    if (indice > 0) telefones.push(document.createTextNode(" / "));
    const a = criarElemento("a", "", t);
    a.href = telHref(t);
    telefones.push(a);
  });

  // Endereço
  const enderecoNodes = [
    document.createTextNode(inst.endereco),
    document.createElement("br"),
    criarElemento("small", "", `${inst.bairro}, Recife - PE`)
  ];

  const dl = criarElemento("dl", "help-modal__lista");
  dl.append(
    criarLinhaModal("fa-people-group", "Quem é atendido", inst.publico),
    criarLinhaModal("fa-location-dot", "Endereço", enderecoNodes),
    criarLinhaModal("fa-clock", "Horário", inst.horario),
    criarLinhaModal("fa-phone", "Telefone", telefones),
    criarLinhaModal("fa-hand-holding-heart", "Como ajudar", inst.comoAjudar || AJUDA_PADRAO)
  );

  painel.append(fechar, tipo, titulo, desc, tags, dl);

  if (inst.aviso) {
    const aviso = criarElemento("p", "help-modal__aviso");
    const iconeAviso = criarElemento("i", "fa-solid fa-circle-info");
    iconeAviso.setAttribute("aria-hidden", "true");
    aviso.append(iconeAviso, document.createTextNode(` ${inst.aviso}`));
    painel.appendChild(aviso);
  }

  painel.appendChild(
    criarElemento("p", "help-modal__fonte", "Informações fictícias, apenas para demonstração do projeto.")
  );

  const acoes = criarElemento("div", "help-modal__acoes");
  const mapa = "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${inst.endereco}, ${inst.bairro}, Recife - PE`);

  acoes.appendChild(criarBotaoLink("help-btn help-btn--primary", "fa-route", "Como chegar", mapa, true));
  if (inst.telefones[0]) {
    acoes.appendChild(criarBotaoLink("help-btn help-btn--outline", "fa-phone", "Ligar", telHref(inst.telefones[0])));
  }
  painel.appendChild(acoes);

  return painel;
}

function abrirDetalhes(id, gatilho) {
  const inst = instituicoes.find(item => item.id === Number(id));
  if (!inst) return;

  ultimoFoco = gatilho || document.activeElement;
  modal.replaceChildren(montarModal(inst));
  modal.hidden = false;
  document.body.classList.add("help-travado");
  history.replaceState(null, "", "#inst-" + inst.id);
  modal.querySelector("[data-fechar]").focus();
}

function fecharDetalhes() {
  if (modal.hidden) return;

  modal.hidden = true;
  modal.replaceChildren();
  document.body.classList.remove("help-travado");
  history.replaceState(null, "", location.pathname + location.search);

  if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
}

function configurarDetalhes() {
  document.body.appendChild(modal);

  lista.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-detalhes]");
    if (botao) abrirDetalhes(botao.dataset.detalhes, botao);
  });

  modal.addEventListener("click", evento => {
    if (evento.target === modal || evento.target.closest("[data-fechar]")) {
      fecharDetalhes();
    }
  });

  document.addEventListener("keydown", evento => {
    if (modal.hidden) return;

    if (evento.key === "Escape") {
      fecharDetalhes();
      return;
    }

    if (evento.key !== "Tab") return;

    const itens = modal.querySelectorAll(FOCAVEIS);
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];

    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  });

  // Link direto: pagina.html#inst-7 abre os detalhes da instituição 7
  const match = /^#inst-(\d+)$/.exec(location.hash);
  if (match) abrirDetalhes(match[1]);
}

/* ---------- Menu ---------- */
function configurarMenu() {
  if (!menu || !menuToggle) return;

  menuToggle.addEventListener("click", () => {
    const aberto = menu.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(aberto));
    menuToggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");

    const icone = menuToggle.querySelector("i");
    if (icone) icone.className = aberto ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");

      const icone = menuToggle.querySelector("i");
      if (icone) icone.className = "fa-solid fa-bars";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  preencherFiltros();
  configurarFiltros();
  configurarDetalhes();
  configurarMenu();
  filtrarInstituicoes();
});