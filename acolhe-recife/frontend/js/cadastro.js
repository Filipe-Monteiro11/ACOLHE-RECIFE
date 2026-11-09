/* ============================================================
   cadastro.js
   Máscaras, validação, busca de CEP e salvamento (protótipo).
   ============================================================ */

const form = document.getElementById("cadastro-form");
const feedback = document.getElementById("cadastro-feedback");

const campos = {
  nome: document.getElementById("nome"),
  cnpj: document.getElementById("cnpj"),
  categoria: document.getElementById("categoria"),
  descricao: document.getElementById("descricao"),
  telefone: document.getElementById("telefone"),
  responsavel: document.getElementById("responsavel"),
  cep: document.getElementById("cep"),
  rua: document.getElementById("rua"),
  numero: document.getElementById("numero"),
  bairro: document.getElementById("bairro"),
  cidade: document.getElementById("cidade"),
  email: document.getElementById("email"),
  senha: document.getElementById("senha"),
  confirmarSenha: document.getElementById("confirmar-senha"),
  termos: document.getElementById("termos"),
};

/* ---------- Utilitários ---------- */
const somenteDigitos = (valor) => valor.replace(/\D/g, "");

function mostrarErro(campo, mensagem) {
  const id = campo.id;
  const erro = document.getElementById(`erro-${id}`);
  const grupo = campo.closest(".input-group");

  if (erro) erro.textContent = mensagem;
  if (grupo) {
    grupo.classList.toggle("is-invalid", Boolean(mensagem));
    grupo.classList.toggle("is-valid", !mensagem && campo.value.trim() !== "");
  }
  campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
  return !mensagem;
}

/* ---------- Máscaras ---------- */
function mascaraCnpj(valor) {
  const d = somenteDigitos(valor).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function mascaraTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function mascaraCep(valor) {
  const d = somenteDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}

campos.cnpj.addEventListener("input", () => {
  campos.cnpj.value = mascaraCnpj(campos.cnpj.value);
});
campos.telefone.addEventListener("input", () => {
  campos.telefone.value = mascaraTelefone(campos.telefone.value);
});
campos.cep.addEventListener("input", () => {
  campos.cep.value = mascaraCep(campos.cep.value);
});

/* ---------- Validações ---------- */
function cnpjValido(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const calcularDigito = (base) => {
    let peso = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(cnpj.slice(0, 12));
  const d2 = calcularDigito(cnpj.slice(0, 12) + d1);
  return cnpj.endsWith(`${d1}${d2}`);
}

const emailValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);

function nivelSenha(senha) {
  let nivel = 0;
  if (senha.length >= 8) nivel++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) nivel++;
  if (/\d/.test(senha)) nivel++;
  if (/[^A-Za-z0-9]/.test(senha)) nivel++;
  return nivel;
}

const validadores = {
  nome: () =>
    mostrarErro(
      campos.nome,
      campos.nome.value.trim().length < 3 ? "Informe o nome da instituição." : ""
    ),

  cnpj: () => {
    const v = campos.cnpj.value.trim();
    if (!v) return mostrarErro(campos.cnpj, "Informe o CNPJ.");
    return mostrarErro(campos.cnpj, cnpjValido(v) ? "" : "CNPJ inválido.");
  },

  categoria: () =>
    mostrarErro(campos.categoria, campos.categoria.value ? "" : "Escolha uma área de atuação."),

  descricao: () =>
    mostrarErro(
      campos.descricao,
      campos.descricao.value.trim().length < 20
        ? "Descreva a instituição em pelo menos 20 caracteres."
        : ""
    ),

  telefone: () => {
    const tamanho = somenteDigitos(campos.telefone.value).length;
    return mostrarErro(
      campos.telefone,
      tamanho === 10 || tamanho === 11 ? "" : "Informe um telefone com DDD."
    );
  },

  responsavel: () =>
    mostrarErro(
      campos.responsavel,
      campos.responsavel.value.trim().length < 3 ? "Informe o nome do responsável." : ""
    ),

  cep: () =>
    mostrarErro(
      campos.cep,
      somenteDigitos(campos.cep.value).length === 8 ? "" : "CEP deve ter 8 números."
    ),

  rua: () => mostrarErro(campos.rua, campos.rua.value.trim() ? "" : "Informe a rua."),
  numero: () => mostrarErro(campos.numero, campos.numero.value.trim() ? "" : "Informe o número."),
  bairro: () => mostrarErro(campos.bairro, campos.bairro.value.trim() ? "" : "Informe o bairro."),
  cidade: () => mostrarErro(campos.cidade, campos.cidade.value.trim() ? "" : "Informe a cidade."),

  email: () => {
    const v = campos.email.value.trim();
    if (!v) return mostrarErro(campos.email, "Informe o e-mail.");
    return mostrarErro(campos.email, emailValido(v) ? "" : "E-mail inválido.");
  },

  senha: () => {
    const v = campos.senha.value;
    if (v.length < 8) return mostrarErro(campos.senha, "A senha precisa ter no mínimo 8 caracteres.");
    if (nivelSenha(v) < 2) return mostrarErro(campos.senha, "Misture letras, números ou símbolos.");
    return mostrarErro(campos.senha, "");
  },

  confirmarSenha: () => {
    const v = campos.confirmarSenha.value;
    if (!v) return mostrarErro(campos.confirmarSenha, "Repita a senha.");
    return mostrarErro(
      campos.confirmarSenha,
      v === campos.senha.value ? "" : "As senhas não são iguais."
    );
  },

  termos: () => {
    const ok = campos.termos.checked;
    document.getElementById("erro-termos").textContent = ok ? "" : "É preciso aceitar os termos.";
    return ok;
  },
};

/* Valida ao sair do campo; depois de errar, revalida enquanto digita */
Object.entries(validadores).forEach(([nome, validar]) => {
  const campo = campos[nome];
  campo.addEventListener("blur", validar);
  campo.addEventListener("input", () => {
    if (campo.getAttribute("aria-invalid") === "true") validar();
  });
});
campos.termos.addEventListener("change", validadores.termos);

/* Revalida a confirmação quando a senha muda */
campos.senha.addEventListener("input", () => {
  if (campos.confirmarSenha.value) validadores.confirmarSenha();
});

/* ---------- Contador de caracteres ---------- */
const contador = document.getElementById("contador");
campos.descricao.addEventListener("input", () => {
  contador.textContent = campos.descricao.value.length;
});

/* ---------- Força da senha ---------- */
const strengthBar = document.getElementById("strength-bar");
const strengthText = document.getElementById("strength-text");
const rotulos = ["", "Fraca", "Razoável", "Boa", "Forte"];

campos.senha.addEventListener("input", () => {
  const nivel = campos.senha.value ? nivelSenha(campos.senha.value) : 0;
  strengthBar.dataset.nivel = nivel;
  strengthText.textContent = nivel ? `Senha ${rotulos[nivel].toLowerCase()}` : "";
});

/* ---------- Mostrar / ocultar senha ---------- */
document.querySelectorAll(".toggle-password").forEach((botao) => {
  botao.addEventListener("click", () => {
    const input = document.getElementById(botao.dataset.target);
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";

    const icone = botao.querySelector("i");
    icone.classList.toggle("fa-eye", !mostrar);
    icone.classList.toggle("fa-eye-slash", mostrar);
    botao.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
  });
});

/* ---------- Busca de endereço pelo CEP (ViaCEP) ---------- */
campos.cep.addEventListener("blur", async () => {
  const cep = somenteDigitos(campos.cep.value);
  if (cep.length !== 8) return;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      mostrarErro(campos.cep, "CEP não encontrado.");
      return;
    }

    campos.rua.value = dados.logradouro || campos.rua.value;
    campos.bairro.value = dados.bairro || campos.bairro.value;
    campos.cidade.value = dados.localidade || campos.cidade.value;

    ["rua", "bairro", "cidade"].forEach((nome) => validadores[nome]());
    mostrarErro(campos.cep, "");
    (dados.logradouro ? campos.numero : campos.rua).focus();
  } catch {
    /* Sem internet ou API fora do ar: a pessoa preenche manualmente */
  }
});

/* ---------- Envio ---------- */
function mostrarFeedback(mensagem, sucesso = false) {
  feedback.textContent = mensagem;
  feedback.classList.toggle("is-success", sucesso);
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  mostrarFeedback("");

  // Roda todas as validações (sem curto-circuito, para mostrar todos os erros)
  const resultados = Object.values(validadores).map((validar) => validar());

  if (resultados.includes(false)) {
    mostrarFeedback("Revise os campos destacados.");
    const primeiroErro = form.querySelector("[aria-invalid='true']") || campos.termos;
    primeiroErro.focus();
    return;
  }

  // Protótipo: salva no navegador. NÃO guarda a senha.
  // Em produção, envie os dados a um servidor (HTTPS) que armazene a senha com hash.
  const instituicoes = JSON.parse(localStorage.getItem("instituicoes") || "[]");
  const cnpj = somenteDigitos(campos.cnpj.value);
  const email = campos.email.value.trim().toLowerCase();

  if (instituicoes.some((i) => i.cnpj === cnpj)) {
    mostrarErro(campos.cnpj, "Este CNPJ já está cadastrado.");
    campos.cnpj.focus();
    return;
  }
  if (instituicoes.some((i) => i.email === email)) {
    mostrarErro(campos.email, "Este e-mail já está cadastrado.");
    campos.email.focus();
    return;
  }

  instituicoes.push({
    id: Date.now(),
    nome: campos.nome.value.trim(),
    cnpj,
    categoria: campos.categoria.value,
    descricao: campos.descricao.value.trim(),
    telefone: somenteDigitos(campos.telefone.value),
    responsavel: campos.responsavel.value.trim(),
    endereco: {
      cep: somenteDigitos(campos.cep.value),
      rua: campos.rua.value.trim(),
      numero: campos.numero.value.trim(),
      bairro: campos.bairro.value.trim(),
      cidade: campos.cidade.value.trim(),
    },
    email,
    status: "pendente", // sugestão: instituições passam por aprovação antes de aparecer no site
    criadoEm: new Date().toISOString(),
  });

  localStorage.setItem("instituicoes", JSON.stringify(instituicoes));

  mostrarFeedback("Cadastro enviado! Redirecionando para o login...", true);
  form.querySelector("button[type='submit']").disabled = true;
  setTimeout(() => (window.location.href = "login.html"), 1800);
});