const API_URL = "http://127.0.0.1:5000";

const lista = document.getElementById("lista-instituicoes");
const formulario = document.getElementById("search-form");
const feedback = document.getElementById("search-feedback");
const menu = document.getElementById("menu");
const menuToggle = document.getElementById("menu-toggle");

let instituicoes = [];
let servicosPorInstituicao = new Map();

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

async function buscarAPI(caminho) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!resposta.ok) {
    throw new Error(`Erro HTTP ${resposta.status}`);
  }

  return resposta.json();
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
    "Disponibilidade não informada"
  );

  const nome = criarElemento(
    "h3",
    "",
    instituicao.nome || "Instituição sem nome"
  );

  const endereco = criarElemento("p", "location");

  const iconeLocal = criarElemento(
    "i",
    "fa-solid fa-location-dot"
  );

  endereco.append(
    iconeLocal,
    document.createTextNode(
      ` ${instituicao.endereco || "Endereço não informado"}`
    )
  );

  const descricao = criarElemento(
    "p",
    "institution-description",
    instituicao.descricao || "Descrição não informada."
  );

  const servicos = servicosPorInstituicao.get(instituicao.id) || [];

  const nomesServicos = servicos
    .map(servico => servico.tipo)
    .filter(Boolean);

  const textoServicos = nomesServicos.length
    ? `Serviços: ${nomesServicos.join(", ")}`
    : "Serviços não informados.";

  const servicosElemento = criarElemento(
    "p",
    "institution-services",
    textoServicos
  );

  const detalhes = criarElemento(
    "a",
    "btn-detalhes",
    "Ver detalhes"
  );

  detalhes.href = `instituicao.html?id=${encodeURIComponent(instituicao.id)}`;

  info.append(
    status,
    nome,
    endereco,
    descricao,
    servicosElemento,
    detalhes
  );

  card.append(imagem, info);

  return card;
}

function renderizarInstituicoes(dados) {
  if (!lista) return;

  lista.replaceChildren();

  if (!dados.length) {
    lista.appendChild(
      criarElemento(
        "p",
        "empty-message",
        "Nenhuma instituição encontrada."
      )
    );
    return;
  }

  const fragmento = document.createDocumentFragment();

  dados.forEach(instituicao => {
    fragmento.appendChild(criarCard(instituicao));
  });

  lista.appendChild(fragmento);
}

function filtrarInstituicoes(evento) {
  if (evento) evento.preventDefault();

  const nome = normalizar(
    document.getElementById("search-name")?.value
  );

  const regiao = normalizar(
    document.getElementById("search-region")?.value
  );

  const servico = normalizar(
    document.getElementById("search-service")?.value
  );

  const resultados = instituicoes.filter(instituicao => {
    const nomeInstituicao = normalizar(instituicao.nome);
    const endereco = normalizar(instituicao.endereco);

    const servicos = servicosPorInstituicao.get(instituicao.id) || [];

    const tipos = servicos.map(item => normalizar(item.tipo));

    const correspondeNome = !nome || nomeInstituicao.includes(nome);
    const correspondeRegiao = !regiao || endereco.includes(regiao);

    const correspondeServico = !servico || tipos.some(tipo =>
      tipo.includes(servico)
    );

    return (
      correspondeNome &&
      correspondeRegiao &&
      correspondeServico
    );
  });

  renderizarInstituicoes(resultados);

  if (feedback) {
    feedback.textContent =
      `${resultados.length} instituição(ões) encontrada(s).`;
  }

  if (evento) {
    document.getElementById("instituicoes")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

async function carregarInstituicoes() {
  if (!lista) return;

  lista.replaceChildren(
    criarElemento(
      "p",
      "loading-message",
      "Carregando instituições..."
    )
  );

  try {
    const dados = await buscarAPI("/instituicoes");

    if (!Array.isArray(dados)) {
      throw new Error("Formato de resposta inválido");
    }

    instituicoes = dados;

    const resultados = await Promise.allSettled(
      instituicoes.map(instituicao =>
        buscarAPI(`/instituicoes/${instituicao.id}/servicos`)
      )
    );

    let falhas = 0;

    resultados.forEach((resultado, indice) => {
      const id = instituicoes[indice].id;

      if (
        resultado.status === "fulfilled" &&
        Array.isArray(resultado.value)
      ) {
        servicosPorInstituicao.set(id, resultado.value);
      } else {
        falhas++;
        servicosPorInstituicao.set(id, []);
      }
    });

    filtrarInstituicoes();

    if (falhas > 0 && feedback) {
      feedback.textContent +=
        " Alguns serviços não puderam ser carregados.";
    }

  } catch (erro) {
    console.error("Erro ao carregar instituições:", erro);

    lista.replaceChildren(
      criarElemento(
        "p",
        "empty-message",
        "Não foi possível carregar as instituições. Verifique a conexão com o servidor."
      )
    );

    if (feedback) {
      feedback.textContent = "";
    }
  }
}

function configurarMenu() {
  if (!menu || !menuToggle) return;

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
  configurarMenu();

  if (formulario) {
    formulario.addEventListener("submit", filtrarInstituicoes);
  }

  carregarInstituicoes();
});