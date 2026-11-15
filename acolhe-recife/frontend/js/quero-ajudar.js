const API_URL = "http://127.0.0.1:5000/api";

const $ = (id) => document.getElementById(id);

const form = $("donation-form");
const institutionSelect = $("institution");
const donationType = $("donation-type");
const formError = $("form-error");

let instituicoes = [];
let currentStep = 1;

const menuToggle = $("menu-toggle");
const menu = $("menu");

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const aberto = menu.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(aberto));
    menuToggle.setAttribute(
      "aria-label",
      aberto ? "Fechar menu" : "Abrir menu"
    );
  });
}

function mostrarErro(mensagem) {
  formError.textContent = mensagem;
  formError.hidden = false;
}

function limparErro() {
  formError.textContent = "";
  formError.hidden = true;
}

function instituicaoAtual() {
  return instituicoes.find(
    (item) => String(item.id) === institutionSelect.value
  );
}

function formaEntrega() {
  return document.querySelector(
    'input[name="deliveryMethod"]:checked'
  ).value;
}

async function carregarInstituicoes() {
  institutionSelect.disabled = true;

  try {
    const resposta = await fetch(`${API_URL}/instituicoes`);

    if (!resposta.ok) {
      throw new Error("Não foi possível carregar as instituições.");
    }

    instituicoes = await resposta.json();

    institutionSelect.replaceChildren(
      new Option("Selecione uma instituição", "")
    );

    instituicoes.forEach((item) => {
      institutionSelect.add(
        new Option(item.nome, String(item.id))
      );
    });

    institutionSelect.disabled = false;
    atualizarInstituicao();
  } catch (erro) {
    mostrarErro(
      "Não foi possível conectar ao servidor. Verifique se a API está funcionando."
    );
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

  $("institution-name").textContent = instituicao.nome;
  $("institution-location").textContent =
    `${instituicao.bairro}, Recife - PE`;

  $("direct-institution-name").textContent = instituicao.nome;

  instituicao.necessidades.forEach((necessidade) => {
    donationType.add(new Option(necessidade, necessidade));

    const item = document.createElement("span");
    item.className = "accepted-item";

    const icone = document.createElement("i");
    icone.className = "fa-solid fa-circle-check";

    item.append(icone, document.createTextNode(necessidade));
    $("accepted-donations").appendChild(item);
  });
}

function atualizarEntrega() {
  const coleta = formaEntrega() === "pickup";

  $("direct-delivery").hidden = coleta;
  $("pickup-delivery").hidden = !coleta;

  document.querySelectorAll(".delivery-card").forEach((card) => {
    card.classList.toggle(
      "selected",
      card.querySelector("input").checked
    );
  });
}

function mostrarEtapa(etapa) {
  currentStep = etapa;
  limparErro();

  document.querySelectorAll(".form-step").forEach((item) => {
    item.classList.toggle(
      "active",
      Number(item.dataset.step) === etapa
    );
  });

  document.querySelectorAll(".progress-item").forEach((item) => {
    const numero = Number(item.dataset.step);

    item.classList.toggle("active", numero === etapa);
    item.classList.toggle("completed", numero < etapa);
  });

  $("previous-step").hidden = etapa === 1;
  $("next-step").hidden = etapa === 4;
  $("submit-donation").hidden = etapa !== 4;

  if (etapa === 4) {
    mostrarResumo($("donation-summary"));
  }
}

function validarCampos(campos) {
  for (const campo of campos) {
    if (!campo.value.trim()) {
      mostrarErro("Preencha todos os campos obrigatórios.");
      campo.focus();
      return false;
    }
  }

  return true;
}

function validarEtapa() {
  limparErro();

  if (currentStep === 1) {
    if (!instituicaoAtual()) {
      mostrarErro("Selecione uma instituição.");
      return false;
    }

    if (!instituicaoAtual().necessidades.length) {
      mostrarErro("Esta instituição não possui necessidades disponíveis.");
      return false;
    }
  }

  if (currentStep === 2) {
    if (!validarCampos([
      $("donor-name"),
      $("donor-phone"),
      donationType,
      $("donation-quantity"),
      $("donation-description")
    ])) {
      return false;
    }

    const telefone = $("donor-phone").value.replace(/\D/g, "");

    if (telefone.length !== 11) {
      mostrarErro("Informe um celular com DDD e 11 dígitos.");
      return false;
    }

    if (!instituicaoAtual().necessidades.includes(
      donationType.value
    )) {
      mostrarErro("Tipo de doação não aceito pela instituição.");
      return false;
    }
  }

  if (currentStep === 3 && formaEntrega() === "pickup") {
    if (!validarCampos([
      $("pickup-cep"),
      $("pickup-neighborhood"),
      $("pickup-street"),
      $("pickup-number")
    ])) {
      return false;
    }

    if ($("pickup-cep").value.replace(/\D/g, "").length !== 8) {
      mostrarErro("Informe um CEP com 8 dígitos.");
      return false;
    }
  }

  return true;
}

function dadosDoacao() {
  const coleta = formaEntrega() === "pickup";

  return {
    instituicao_id: Number(institutionSelect.value),
    nome: $("donor-name").value.trim(),
    telefone: $("donor-phone").value.replace(/\D/g, ""),
    categoria: donationType.value,
    descricao: $("donation-description").value.trim(),
    quantidade: $("donation-quantity").value.trim(),
    observacoes: $("donation-observations").value.trim(),
    entrega: formaEntrega(),
    endereco_coleta: coleta ? {
      cep: $("pickup-cep").value.replace(/\D/g, ""),
      bairro: $("pickup-neighborhood").value.trim(),
      rua: $("pickup-street").value.trim(),
      numero: $("pickup-number").value.trim(),
      referencia: $("pickup-reference").value.trim()
    } : null
  };
}

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
    ["Instituição", instituicaoAtual().nome],
    ["Doador", dados.nome],
    ["WhatsApp", dados.telefone],
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
    ...linhas.map(([titulo, valor]) => criarLinha(titulo, valor))
  );
}

$("next-step").addEventListener("click", () => {
  if (validarEtapa()) {
    mostrarEtapa(currentStep + 1);
  }
});

$("previous-step").addEventListener("click", () => {
  if (currentStep > 1) {
    mostrarEtapa(currentStep - 1);
  }
});

institutionSelect.addEventListener("change", atualizarInstituicao);

document.querySelectorAll(
  'input[name="deliveryMethod"]'
).forEach((radio) => {
  radio.addEventListener("change", atualizarEntrega);
});

$("donor-phone").addEventListener("input", (event) => {
  const digitos = event.target.value.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) {
    event.target.value = digitos ? `(${digitos}` : "";
  } else if (digitos.length <= 7) {
    event.target.value =
      `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  } else {
    event.target.value =
      `(${digitos.slice(0, 2)}) ` +
      `${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
});

$("pickup-cep").addEventListener("input", (event) => {
  const digitos = event.target.value.replace(/\D/g, "").slice(0, 8);

  event.target.value = digitos.length > 5
    ? `${digitos.slice(0, 5)}-${digitos.slice(5)}`
    : digitos;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  limparErro();

  if (currentStep !== 4) {
    return;
  }

  if (!$("donation-consent").checked) {
    mostrarErro("Confirme os dados antes de continuar.");
    return;
  }

  const botao = $("submit-donation");
  botao.disabled = true;
  botao.textContent = "Registrando doação...";

  try {
    const resposta = await fetch(`${API_URL}/doacoes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dadosDoacao())
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        resultado.erro || "Não foi possível registrar a doação."
      );
    }

    const resumo = $("success-summary");

    resumo.replaceChildren(
      criarLinha("Protocolo", resultado.protocolo),
      criarLinha("Status", "Pendente"),
      criarLinha("Instituição", instituicaoAtual().nome)
    );

    const consulta = document.createElement("p");
    consulta.className = "donation-consultation";

    const titulo = document.createElement("strong");
    titulo.textContent = "Código de consulta: ";

    const codigo = document.createElement("span");
    codigo.textContent = resultado.token_consulta;

    consulta.append(titulo, codigo);
    resumo.appendChild(consulta);

    const aviso = document.createElement("p");
    aviso.textContent =
      "Guarde o protocolo e o código de consulta. " +
      "Eles serão necessários para acompanhar a solicitação.";
    resumo.appendChild(aviso);

    form.hidden = true;
    document.querySelector(".donation-progress").hidden = true;
    $("donation-success").hidden = false;

    $("donation-success").querySelector("h3").textContent =
      "Doação registrada com sucesso!";

    $("donation-success").querySelector("h3 + p").textContent =
      "Sua solicitação foi registrada no sistema. " +
      "A instituição ainda precisa avaliar a doação. " +
      "Caso tenha solicitado coleta, o transporte também " +
      "precisará ser confirmado.";

  } catch (erro) {
    mostrarErro(erro.message);
  } finally {
    botao.disabled = false;
    botao.innerHTML =
      '<i class="fa-solid fa-check"></i> Confirmar doação';
  }
});

$("new-donation").addEventListener("click", () => {
  form.reset();

  $("donation-success").hidden = true;
  document.querySelector(".donation-progress").hidden = false;
  form.hidden = false;

  atualizarInstituicao();
  atualizarEntrega();
  mostrarEtapa(1);

  $("formulario-doacao").scrollIntoView({
    behavior: "smooth"
  });
});

carregarInstituicoes();
atualizarEntrega();
mostrarEtapa(1);