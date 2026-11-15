const instituicoes = [
  {
    id: "1",
    nome: "Centro Esperança",
    bairro: "Boa Vista",
    necessidades: ["Alimentos", "Roupas", "Produtos de higiene"]
  },
  {
    id: "2",
    nome: "Casa de Apoio Solidário",
    bairro: "Santo Amaro",
    necessidades: ["Alimentos", "Produtos de higiene"]
  },
  {
    id: "3",
    nome: "Instituto Novos Caminhos",
    bairro: "Imbiribeira",
    necessidades: ["Materiais escolares", "Roupas"]
  },
  {
    id: "4",
    nome: "Rede Mãos Amigas",
    bairro: "Cordeiro",
    necessidades: ["Alimentos", "Roupas", "Produtos de higiene"]
  },
  {
    id: "5",
    nome: "Espaço Recomeçar",
    bairro: "Boa Viagem",
    necessidades: ["Materiais escolares", "Produtos de higiene"]
  },
  {
    id: "6",
    nome: "Projeto Viver Melhor",
    bairro: "Casa Amarela",
    necessidades: ["Alimentos", "Materiais escolares"]
  }
];

const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

const form = document.getElementById("donation-form");
const progressItems = document.querySelectorAll(".progress-item");
const formSteps = document.querySelectorAll(".form-step");

const institutionSelect = document.getElementById("institution");
const institutionDetails = document.getElementById("institution-details");
const institutionName = document.getElementById("institution-name");
const institutionLocation = document.getElementById("institution-location");
const acceptedDonations = document.getElementById("accepted-donations");

const donationType = document.getElementById("donation-type");
const donorName = document.getElementById("donor-name");
const donorPhone = document.getElementById("donor-phone");
const donationQuantity = document.getElementById("donation-quantity");
const donationDescription = document.getElementById("donation-description");
const donationObservations = document.getElementById("donation-observations");

const deliveryRadios = document.querySelectorAll(
  'input[name="deliveryMethod"]'
);

const directDelivery = document.getElementById("direct-delivery");
const pickupDelivery = document.getElementById("pickup-delivery");
const directInstitutionName = document.getElementById(
  "direct-institution-name"
);

const pickupCep = document.getElementById("pickup-cep");
const pickupNeighborhood = document.getElementById("pickup-neighborhood");
const pickupStreet = document.getElementById("pickup-street");
const pickupNumber = document.getElementById("pickup-number");
const pickupReference = document.getElementById("pickup-reference");

const previousButton = document.getElementById("previous-step");
const nextButton = document.getElementById("next-step");
const submitButton = document.getElementById("submit-donation");
const formError = document.getElementById("form-error");
const donationSummary = document.getElementById("donation-summary");
const donationConsent = document.getElementById("donation-consent");

const donationSuccess = document.getElementById("donation-success");
const successSummary = document.getElementById("success-summary");
const newDonationButton = document.getElementById("new-donation");

let currentStep = 1;

if (menuToggle && menu) {
  menuToggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Fechar menu" : "Abrir menu"
    );
  });
}

function getInstitution() {
  return instituicoes.find(
    (instituicao) => instituicao.id === institutionSelect.value
  );
}

function getDeliveryMethod() {
  return document.querySelector(
    'input[name="deliveryMethod"]:checked'
  ).value;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.textContent = "";
  formError.hidden = true;
}

function populateInstitutions() {
  instituicoes.forEach((instituicao) => {
    const option = document.createElement("option");

    option.value = instituicao.id;
    option.textContent = instituicao.nome;

    institutionSelect.appendChild(option);
  });
}

function updateInstitution() {
  const instituicao = getInstitution();

  institutionDetails.hidden = !instituicao;
  donationType.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Selecione o tipo";

  donationType.appendChild(defaultOption);
  acceptedDonations.replaceChildren();

  if (!instituicao) {
    directInstitutionName.textContent = "";
    return;
  }

  institutionName.textContent = instituicao.nome;
  institutionLocation.textContent = `${instituicao.bairro}, Recife - PE`;
  directInstitutionName.textContent = instituicao.nome;

  instituicao.necessidades.forEach((necessidade) => {
    const item = document.createElement("span");
    item.className = "accepted-item";

    const icon = document.createElement("i");
    icon.className = "fa-solid fa-circle-check";

    item.append(icon, document.createTextNode(necessidade));
    acceptedDonations.appendChild(item);

    const option = document.createElement("option");
    option.value = necessidade;
    option.textContent = necessidade;

    donationType.appendChild(option);
  });
}

function updateDelivery() {
  const method = getDeliveryMethod();

  directDelivery.hidden = method !== "direct";
  pickupDelivery.hidden = method !== "pickup";

  document.querySelectorAll(".delivery-card").forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');

    card.classList.toggle("selected", radio.checked);
  });
}

function showStep(step) {
  currentStep = step;
  clearError();

  formSteps.forEach((element) => {
    element.classList.toggle(
      "active",
      Number(element.dataset.step) === step
    );
  });

  progressItems.forEach((item) => {
    const number = Number(item.dataset.step);

    item.classList.toggle("active", number === step);
    item.classList.toggle("completed", number < step);
  });

  previousButton.hidden = step === 1;
  nextButton.hidden = step === 4;
  submitButton.hidden = step !== 4;

  if (step === 4) {
    renderSummary(donationSummary);
  }
}

function validateStep() {
  clearError();

  if (currentStep === 1) {
    if (!getInstitution()) {
      showError("Selecione uma instituição para continuar.");
      institutionSelect.focus();
      return false;
    }
  }

  if (currentStep === 2) {
    const requiredFields = [
      donorName,
      donorPhone,
      donationType,
      donationQuantity,
      donationDescription
    ];

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        showError("Preencha todos os campos obrigatórios.");
        field.focus();
        return false;
      }
    }

    const phoneDigits = donorPhone.value.replace(/\D/g, "");

    if (phoneDigits.length !== 11) {
      showError("Informe um celular com DDD e 11 dígitos.");
      donorPhone.focus();
      return false;
    }

    const instituicao = getInstitution();

    if (!instituicao.necessidades.includes(donationType.value)) {
      showError("Selecione um tipo de doação aceito pela instituição.");
      donationType.focus();
      return false;
    }
  }

  if (currentStep === 3 && getDeliveryMethod() === "pickup") {
    const requiredFields = [
      pickupCep,
      pickupNeighborhood,
      pickupStreet,
      pickupNumber
    ];

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        showError("Preencha os dados obrigatórios da coleta.");
        field.focus();
        return false;
      }
    }

    if (pickupCep.value.replace(/\D/g, "").length !== 8) {
      showError("Informe um CEP válido com 8 dígitos.");
      pickupCep.focus();
      return false;
    }
  }

  return true;
}

function getDonationData() {
  const instituicao = getInstitution();
  const method = getDeliveryMethod();

  const address = [
    pickupStreet.value.trim(),
    pickupNumber.value.trim(),
    pickupNeighborhood.value.trim(),
    `CEP ${pickupCep.value.trim()}`,
    pickupReference.value.trim()
  ].filter(Boolean).join(", ");

  return [
    ["Instituição", instituicao.nome],
    ["Bairro da instituição", instituicao.bairro],
    ["Nome do doador", donorName.value.trim()],
    ["WhatsApp", donorPhone.value.trim()],
    ["Tipo de doação", donationType.value],
    ["Itens", donationDescription.value.trim()],
    ["Quantidade", donationQuantity.value.trim()],
    [
      "Observações",
      donationObservations.value.trim() || "Nenhuma"
    ],
    [
      "Forma de entrega",
      method === "direct"
        ? "Entrega diretamente à instituição"
        : "Solicitação de coleta"
    ],
    ...(method === "pickup"
      ? [["Endereço de retirada", address]]
      : [])
  ];
}

function renderSummary(container) {
  container.replaceChildren();

  getDonationData().forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const title = document.createElement("strong");
    title.textContent = label;

    const content = document.createElement("span");
    content.textContent = value;

    row.append(title, content);
    container.appendChild(row);
  });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

institutionSelect.addEventListener("change", () => {
  updateInstitution();
  clearError();
});

deliveryRadios.forEach((radio) => {
  radio.addEventListener("change", updateDelivery);
});

donorPhone.addEventListener("input", () => {
  donorPhone.value = formatPhone(donorPhone.value);
});

pickupCep.addEventListener("input", () => {
  pickupCep.value = formatCep(pickupCep.value);
});

nextButton.addEventListener("click", () => {
  if (!validateStep()) {
    return;
  }

  showStep(currentStep + 1);
});

previousButton.addEventListener("click", () => {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearError();

  if (currentStep !== 4) {
    return;
  }

  if (!donationConsent.checked) {
    showError("Confirme as informações antes de continuar.");
    donationConsent.focus();
    return;
  }

  renderSummary(successSummary);

  form.hidden = true;
  document.querySelector(".donation-progress").hidden = true;
  donationSuccess.hidden = false;
});

newDonationButton.addEventListener("click", () => {
  form.reset();

  donationConsent.checked = false;
  donationSuccess.hidden = true;
  form.hidden = false;
  document.querySelector(".donation-progress").hidden = false;

  updateInstitution();
  updateDelivery();
  showStep(1);

  document.getElementById("formulario-doacao").scrollIntoView({
    behavior: "smooth"
  });
});

populateInstitutions();
updateInstitution();
updateDelivery();
showStep(1);