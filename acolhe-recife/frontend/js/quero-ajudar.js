
"use strict";

const AMBIENTE_LOCAL = [
  "localhost",
  "127.0.0.1"
].includes(window.location.hostname);

const API_URL = AMBIENTE_LOCAL
  ? "http://127.0.0.1:5000/api"
  : "/api";

const $ = (id) => document.getElementById(id);

const form = $("donation-form");
const institutionSelect = $("institution");
const donationType = $("donation-type");
const formError = $("form-error");

let instituicoes = [];
let currentStep = 1;
let enviando = false;
let carregando = false;


// Menu mobile

const menuToggle = $("menu-toggle");
const menu = $("menu");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const aberto = menu.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      String(aberto)
    );

    menuToggle.setAttribute(
      "aria-label",
      aberto ? "Fechar menu" : "Abrir menu"
    );
  });
}


// Comunicação com a API

async function requisicao(endpoint, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    90000
  );

  try {
    const resposta = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        signal: controller.signal
      }
    );

    const resultado = await resposta.json().catch(
      () => null
    );

    if (!resposta.ok) {
      throw new Error(
        resultado?.erro ||
        "Servidor temporariamente indisponível."
      );
    }

    if (resultado === null) {
      throw new Error("Resposta inválida do servidor.");
    }

    return resultado;

  } catch (erro) {
    if (erro.name === "AbortError") {
      throw new Error(
        "O servidor demorou para responder."
      );
    }

    if (erro instanceof TypeError) {
      throw new Error(
        "Não foi possível conectar ao servidor."
      );
    }

    throw erro;

  } finally {
    clearTimeout(timeout);
  }
}


// Mensagens do formulário

function mostrarErro(mensagem) {
  formError.textContent = mensagem;
  formError.hidden = false;
}

function limparErro() {
  formError.textContent = "";
  formError.hidden = true;
}

function mostrarErroConexao(mensagem) {
  mostrarErro(`${mensagem} `);

  const botao = document.createElement("button");

  botao.type = "button";
  botao.className = "btn-previous";
  botao.textContent = "Tentar novamente";
  botao.style.marginTop = "10px";

  botao.addEventListener(
    "click",
    carregarInstituicoes
  );

  formError.appendChild(botao);
}


// Instituições

function instituicaoAtual() {
  return instituicoes.find(
    (item) => String(item.id) === institutionSelect.value
  );
}

function formaEntrega() {
  return document.querySelector(
    'input[name="deliveryMethod"]:checked'
  )?.value || "direct";
}

async function carregarInstituicoes() {
  if (carregando) return;

  carregando = true;

  limparErro();

  institutionSelect.disabled = true;
  $("next-step").disabled = true;

  institutionSelect.replaceChildren(
    new Option("Conectando ao servidor...", "")
  );

  try {
    const resultado = await requisicao("/instituicoes");

    if (!Array.isArray(resultado)) {
      throw new Error("Lista de instituições inválida.");
    }

    instituicoes = resultado;

    institutionSelect.replaceChildren(
      new Option("Selecione uma instituição", "")
    );

    instituicoes.forEach((item) => {
      institutionSelect.add(
        new Option(item.nome, String(item.id))
      );
    });

    institutionSelect.disabled = false;

    if (!instituicoes.length) {
      mostrarErro(
        "Nenhuma instituição disponível no momento."
      );
    } else {
      $("next-step").disabled = false;
    }

    atualizarInstituicao();

  } catch (erro) {
    instituicoes = [];

    institutionSelect.replaceChildren(
      new Option("Instituições indisponíveis", "")
    );

    atualizarInstituicao();

    mostrarErroConexao(erro.message);

  } finally {
    carregando = false;
  }
}

function atualizarInstituicao() {
  const instituicao = instituicaoAtual();

  $("institution-details").hidden = !instituicao;

  $("accepted-donations").replaceChildren();

  donationType.replaceChildren(
    new Option("Selecione o tipo", "")
  );

  if (!instituicao) {
    $("direct-institution-name").textContent = "";
    return;
  }

  $("institution-name").textContent =
    instituicao.nome;

  $("institution-location").textContent =
    `${instituicao.bairro}, Recife - PE`;

  $("direct-institution-name").textContent =
    instituicao.nome;

  instituicao.necessidades.forEach((necessidade) => {
    donationType.add(
      new Option(necessidade, necessidade)
    );

    const item = document.createElement("span");
    item.className = "accepted-item";

    const icone = document.createElement("i");
    icone.className = "fa-solid fa-circle-check";

    item.append(
      icone,
      document.createTextNode(necessidade)
    );

    $("accepted-donations").appendChild(item);
  });
}


// Forma de entrega

function atualizarEntrega() {
  const coleta = formaEntrega() === "pickup";

  $("direct-delivery").hidden = coleta;
  $("pickup-delivery").hidden = !coleta;

  document.querySelectorAll(
    ".delivery-card"
  ).forEach((card) => {
    card.classList.toggle(
      "selected",
      card.querySelector("input").checked
    );
  });
}


// Controle das etapas

function mostrarEtapa(etapa) {
  currentStep = etapa;

  limparErro();

  document.querySelectorAll(
    ".form-step"
  ).forEach((item) => {
    item.classList.toggle(
      "active",
      Number(item.dataset.step) === etapa
    );
  });

  document.querySelectorAll(
    ".progress-item"
  ).forEach((item) => {
    const numero = Number(item.dataset.step);

    item.classList.toggle(
      "active",
      numero === etapa
    );

    item.classList.toggle(
      "completed",
      numero < etapa
    );
  });

  $("previous-step").hidden = etapa === 1;
  $("next-step").hidden = etapa === 4;
  $("submit-donation").hidden = etapa !== 4;

  if (etapa === 4) {
    mostrarResumo($("donation-summary"));
  }
}


// Validação

function validarCampos(campos) {
  for (const campo of campos) {
    if (!campo.value.trim()) {
      mostrarErro(
        "Preencha todos os campos obrigatórios."
      );

      campo.focus();

      return false;
    }
  }

  return true;
}

function validarEtapa(etapa = currentStep) {
  limparErro();

  const instituicao = instituicaoAtual();

  if (etapa === 1) {
    if (!instituicao) {
      mostrarErro("Selecione uma instituição.");
      return false;
    }

    if (!instituicao.necessidades.length) {
      mostrarErro(
        "Esta instituição não possui necessidades disponíveis."
      );

      return false;
    }
  }

  if (etapa === 2) {
    if (!validarCampos([
      $("donor-name"),
      $("donor-phone"),
      donationType,
      $("donation-quantity"),
      $("donation-description")
    ])) {
      return false;
    }

    const telefone = $("donor-phone")
      .value.replace(/\D/g, "");

    if (telefone.length !== 11) {
      mostrarErro(
        "Informe um celular com DDD e 11 dígitos."
      );

      $("donor-phone").focus();

      return false;
    }

    if (!instituicao?.necessidades.includes(
      donationType.value
    )) {
      mostrarErro(
        "Tipo de doação não aceito pela instituição."
      );

      return false;
    }
  }

  if (etapa === 3 && formaEntrega() === "pickup") {
    if (!validarCampos([
      $("pickup-cep"),
      $("pickup-neighborhood"),
      $("pickup-street"),
      $("pickup-number")
    ])) {
      return false;
    }

    const cep = $("pickup-cep")
      .value.replace(/\D/g, "");

    if (cep.length !== 8) {
      mostrarErro("Informe um CEP com 8 dígitos.");

      $("pickup-cep").focus();

      return false;
    }
  }

  return true;
}


// Dados da doação

function dadosDoacao() {
  const coleta = formaEntrega() === "pickup";

  return {
    instituicao_id: Number(institutionSelect.value),

    nome: $("donor-name").value.trim(),

    telefone: $("donor-phone")
      .value.replace(/\D/g, ""),

    categoria: donationType.value,

    descricao: $("donation-description")
      .value.trim(),

    quantidade: $("donation-quantity")
      .value.trim(),

    observacoes: $("donation-observations")
      .value.trim(),

    entrega: formaEntrega(),

    endereco_coleta: coleta ? {
      cep: $("pickup-cep")
        .value.replace(/\D/g, ""),

      bairro: $("pickup-neighborhood")
        .value.trim(),

      rua: $("pickup-street").value.trim(),

      numero: $("pickup-number").value.trim(),

      referencia: $("pickup-reference")
        .value.trim()

    } : null
  };
}


// Resumo da doação

function criarLinha(titulo, valor) {
  const linha = document.createElement("div");
  linha.className = "summary-row";

  const rotulo = document.createElement("strong");
  rotulo.textContent = titulo;

  const conteudo = document.createElement("span");
  conteudo.textContent = valor;

  linha.append(rotulo, conteudo);

  return linha;
}

function mostrarResumo(container) {
  const dados = dadosDoacao();

  const linhas = [
    ["Instituição", instituicaoAtual()?.nome || ""],
    ["Doador", dados.nome],
    ["WhatsApp", $("donor-phone").value],
    ["Categoria", dados.categoria],
    ["Itens", dados.descricao],
    ["Quantidade", dados.quantidade],
    ["Observações", dados.observacoes || "Nenhuma"],
    [
      "Entrega",
      dados.entrega === "direct"
        ? "Entrega direta"
        : "Solicitação de coleta"
    ]
  ];

  if (dados.endereco_coleta) {
    const endereco = dados.endereco_coleta;

    linhas.push([
      "Endereço de coleta",
      [
        endereco.rua,
        endereco.numero,
        endereco.bairro,
        endereco.cep,
        endereco.referencia
      ].filter(Boolean).join(", ")
    ]);
  }

  container.replaceChildren(
    ...linhas.map(
      ([titulo, valor]) => criarLinha(titulo, valor)
    )
  );
}


// Navegação

$("next-step").addEventListener("click", () => {
  if (carregando || enviando) return;

  if (currentStep < 4 && validarEtapa()) {
    mostrarEtapa(currentStep + 1);
  }
});

$("previous-step").addEventListener("click", () => {
  if (enviando) return;

  if (currentStep > 1) {
    mostrarEtapa(currentStep - 1);
  }
});

institutionSelect.addEventListener("change", () => {
  limparErro();
  atualizarInstituicao();
});

document.querySelectorAll(
  'input[name="deliveryMethod"]'
).forEach((radio) => {
  radio.addEventListener(
    "change",
    atualizarEntrega
  );
});


// Máscara de telefone

$("donor-phone").addEventListener("input", (event) => {
  const digitos = event.target.value
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digitos.length <= 2) {
    event.target.value = digitos
      ? `(${digitos}`
      : "";

  } else if (digitos.length <= 7) {
    event.target.value =
      `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;

  } else {
    event.target.value =
      `(${digitos.slice(0, 2)}) ` +
      `${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
});


// Máscara de CEP

$("pickup-cep").addEventListener("input", (event) => {
  const digitos = event.target.value
    .replace(/\D/g, "")
    .slice(0, 8);

  event.target.value = digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
});


// Confirmação da doação

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (enviando || currentStep !== 4) return;

  limparErro();

  for (let etapa = 1; etapa <= 3; etapa++) {
    mostrarEtapa(etapa);

    if (!validarEtapa(etapa)) {
      return;
    }
  }

  mostrarEtapa(4);

  if (!$("donation-consent").checked) {
    mostrarErro(
      "Confirme os dados antes de continuar."
    );

    return;
  }

  const botao = $("submit-donation");
  const botaoVoltar = $("previous-step");

  enviando = true;

  botao.disabled = true;
  botaoVoltar.disabled = true;

  botao.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> ' +
    'Registrando doação...';

  try {
    const resultado = await requisicao("/doacoes", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(dadosDoacao())
    });

    if (!resultado.protocolo || !resultado.token_consulta) {
      throw new Error(
        "Não foi possível confirmar o registro."
      );
    }

    const resumo = $("success-summary");

    resumo.replaceChildren(
      criarLinha("Protocolo", resultado.protocolo),
      criarLinha("Status", "Pendente"),
      criarLinha("Instituição", instituicaoAtual().nome),
      criarLinha("Código de consulta", resultado.token_consulta)
    );

    const aviso = document.createElement("p");

    aviso.textContent =
      "Guarde o protocolo e o código de consulta. " +
      "Eles serão necessários para consultar sua solicitação.";

    aviso.style.marginTop = "15px";

    resumo.appendChild(aviso);

    form.hidden = true;

    document.querySelector(
      ".donation-progress"
    ).hidden = true;

    $("donation-success").hidden = false;

    $("donation-success")
      .querySelector("h3")
      .textContent = "Doação registrada com sucesso!";

    $("donation-success")
      .querySelector("h3 + p")
      .textContent =
        "Sua solicitação foi registrada no sistema. " +
        "O recebimento e a coleta ainda precisam ser confirmados.";

    $("formulario-doacao").scrollIntoView({
      behavior: "smooth"
    });

  } catch (erro) {
    mostrarErro(
      `${erro.message} Se o envio foi interrompido, ` +
      "o registro pode ter sido realizado. Evite reenviar " +
      "imediatamente sem verificar."
    );

  } finally {
    enviando = false;

    botao.disabled = false;
    botaoVoltar.disabled = false;

    botao.innerHTML =
      '<i class="fa-solid fa-check"></i> Confirmar doação';
  }
});


// Nova doação

$("new-donation").addEventListener("click", () => {
  form.reset();

  $("donation-success").hidden = true;

  document.querySelector(
    ".donation-progress"
  ).hidden = false;

  form.hidden = false;

  atualizarInstituicao();
  atualizarEntrega();
  mostrarEtapa(1);

  $("formulario-doacao").scrollIntoView({
    behavior: "smooth"
  });
});


// Inicialização

mostrarEtapa(1);
atualizarEntrega();
carregarInstituicoes();
